import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { shahadaSteps } from "../data/shahada";
import useAudioVisualizer from "./useAudioVisualizer";
import useSpeechRecognition from "./useSpeechRecognition";
import { useSpeakingDetection } from "./useSpeakingDetection";
import { useOnlineStatus } from "./useOnlineStatus";
import {
  cleanDisplayTranscript,
  countConsecutiveSteps,
  normalizeTranscript,
} from "../utils/shahadaText";
import type { OrbVisualMode } from "../types";

type OrbOverride = "engaged" | "error" | null;

const ORB_FLASH_MS = 2_000;

export const useRecitationSession = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [startupError, setStartupError] = useState<string | null>(null);

  const [textInput, setTextInput] = useState("");
  const [textSubmitted, setTextSubmitted] = useState(false);
  const [textFlowStarted, setTextFlowStarted] = useState(false);

  // ── Certificate ────────────────────────────────────────────────────────────
  const [showCertificate, setShowCertificate] = useState(false);

  const [orbOverride, setOrbOverride] = useState<OrbOverride>(null);
  const orbTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const recordingActiveRef = useRef(false);
  const recognitionPausedRef = useRef(false);

  const speechSessionRefs = useMemo(
    () => ({ sessionActiveRef: recordingActiveRef, recognitionPausedRef }),
    [],
  );

  const isOnline = useOnlineStatus();

  const {
    volume,
    volumeRef,
    startVisualizer,
    stopVisualizer,
    suspendVisualizer,
    resumeVisualizer,
  } = useAudioVisualizer();

  const {
    transcript: speechTranscript,
    hasSupport,
    error,
    startListening,
    stopListening,
    resetTranscript: resetSpeechTranscript,
  } = useSpeechRecognition(speechSessionRefs);

  const isSpeaking = useSpeakingDetection(volume, isRecording);

  const transcript = hasSupport ? speechTranscript : textInput;

  const normalized = useMemo(() => normalizeTranscript(transcript), [transcript]);

  const computedSteps = useMemo(
    () => countConsecutiveSteps(transcript, normalized),
    [transcript, normalized],
  );

  const sessionPeakRef = useRef(0);
  const prevStepsRef = useRef(0);

  const steps = useMemo((): number => {
    if (prevStepsRef.current >= shahadaSteps.length)
      return shahadaSteps.length;

    if (!hasSupport || !isRecording) {
      sessionPeakRef.current = 0;
      return computedSteps;
    }

    const peak = Math.max(
      sessionPeakRef.current,
      computedSteps,
      sessionPeakRef.current > 0
        ? countConsecutiveSteps(transcript, normalized, sessionPeakRef.current)
        : 0,
    );

    sessionPeakRef.current = Math.min(peak, shahadaSteps.length);
    return sessionPeakRef.current;
  }, [hasSupport, isRecording, computedSteps, transcript, normalized]);

  const isComplete = steps >= shahadaSteps.length;
  const currentStep = shahadaSteps[Math.min(steps, shahadaSteps.length - 1)];

  const orbMode: OrbVisualMode = useMemo(() => {
    if (error) return "error";
    if (orbOverride) return orbOverride;
    if (!isRecording && !textSubmitted) return "listening";
    return isSpeaking ? "speaking" : "listening";
  }, [error, orbOverride, isRecording, isSpeaking, textSubmitted]);

  const flashOrb = useCallback((mode: OrbOverride) => {
    if (orbTimerRef.current) clearTimeout(orbTimerRef.current);
    setOrbOverride(mode);
    orbTimerRef.current = window.setTimeout(
      () => setOrbOverride(null),
      ORB_FLASH_MS,
    );
  }, []);

  const teardownSession = useCallback(() => {
    recordingActiveRef.current = false;
    recognitionPausedRef.current = false;
    stopVisualizer();
    stopListening();
    setIsRecording(false);
  }, [stopVisualizer, stopListening]);

  useEffect(() => {
    recordingActiveRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording) return;
    if (steps > prevStepsRef.current) {
      prevStepsRef.current = steps;
      flashOrb("engaged");
    }
  }, [steps, isRecording, flashOrb]);

  useEffect(() => {
    if (!hasSupport && isComplete && textSubmitted) {
      flashOrb("engaged");
      setShowCertificate(true);
    }
  }, [hasSupport, isComplete, textSubmitted, flashOrb]);

  useEffect(() => {
    if (!isComplete || !isRecording) return;
    teardownSession();
    flashOrb("engaged");
    setShowCertificate(true);
  }, [isComplete, isRecording, teardownSession, flashOrb]);

  useEffect(() => {
    if (!isOnline && isRecording) teardownSession();
  }, [isOnline, isRecording, teardownSession]);

  useEffect(() => {
    if (isOnline) setStartupError(null);
  }, [isOnline]);

  useEffect(() => {
    const timer = orbTimerRef;
    return () => {
      if (timer.current) clearTimeout(timer.current);
      stopVisualizer();
      stopListening();
    };
  }, [stopVisualizer, stopListening]);

  const handlePromptSpeechStart = useCallback(() => {
    recognitionPausedRef.current = true;
    void suspendVisualizer();
    stopListening();
  }, [stopListening, suspendVisualizer]);

  const handlePromptSpeechEnd = useCallback(() => {
    recognitionPausedRef.current = false;
    void resumeVisualizer();
    startListening();
  }, [resumeVisualizer, startListening]);

  const handleStart = useCallback(async () => {
    if (!isOnline) {
      setStartupError("No internet connection. Please reconnect and try again.");
      return;
    }

    if (orbTimerRef.current) clearTimeout(orbTimerRef.current);
    setOrbOverride(null);
    setStartupError(null);

    // Prime speechSynthesis to prevent the first utterance from being cut off
    // on some browsers (known Chromium quirk).
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const primer = new SpeechSynthesisUtterance(" ");
        primer.volume = 0;
        primer.lang = "ar-SA";
        window.speechSynthesis.speak(primer);
        window.speechSynthesis.cancel();
        void window.speechSynthesis.getVoices();
      }
    } catch {
      // Non-fatal — proceed without priming.
    }

    try {
      await startVisualizer();
    } catch {
      console.warn("Audio visualizer failed to start. Continuing without it.");
    }

    recordingActiveRef.current = true;
    recognitionPausedRef.current = false;
    prevStepsRef.current = 0;
    sessionPeakRef.current = 0;
    setIsRecording(true);
    startListening();
  }, [isOnline, startVisualizer, startListening]);

  const handleStop = useCallback(() => {
    const incomplete = steps < shahadaSteps.length;
    const hasSpoken = speechTranscript.trim().length > 0;

    teardownSession();

    if (hasSpoken && incomplete) flashOrb("error");
  }, [steps, speechTranscript, teardownSession, flashOrb]);

  const handleTextSubmit = useCallback(() => {
    if (textInput.trim()) setTextSubmitted(true);
  }, [textInput]);

  const handleRestart = useCallback(() => {
    if (orbTimerRef.current) clearTimeout(orbTimerRef.current);
    setOrbOverride(null);
    setStartupError(null);
    setTextInput("");
    setTextSubmitted(false);
    setTextFlowStarted(false);
    setShowCertificate(false);

    teardownSession();
    resetSpeechTranscript();

    prevStepsRef.current = 0;
    sessionPeakRef.current = 0;
  }, [teardownSession, resetSpeechTranscript]);

  const handleStartWithTextFallback = useCallback(async () => {
    if (!hasSupport) {
      setTextFlowStarted(true);
      return;
    }
    await handleStart();
  }, [hasSupport, handleStart]);

  const subtitle = showCertificate
    ? "Your first step on your path to Islam."
    : isRecording || (!hasSupport && textSubmitted)
      ? "Repeat after me"
      : "Your First Step On Your Path To Islam.";

  const display =
    cleanDisplayTranscript(transcript) || (isRecording ? "Listening…" : "");

  const statusMessage = isOnline ? (startupError ?? error ?? null) : null;

  const showTextFallback = !hasSupport && textFlowStarted && !showCertificate;

    
  return {
    isRecording,
    isComplete,
    showCertificate,
    isOnline,
    hasSupport,
    steps,
    currentStep,

    orbMode,
    volumeRef,

    transcript,
    display,
    subtitle,
    statusMessage,

    textInput,
    textFlowStarted,
    showTextFallback,
    setTextInput,

    handleStart: handleStartWithTextFallback,
    handleStop,
    handleRestart,
    handleTextSubmit,
    handlePromptSpeechStart,
    handlePromptSpeechEnd,
  };
};
