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

export const useRecitationSession = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [startupError, setStartupError] = useState<string | null>(null);

  const [textInput, setTextInput] = useState("");
  const [textSubmitted, setTextSubmitted] = useState(false);
  const [textFlowStarted, setTextFlowStarted] = useState(false);

  const [orbOverride, setOrbOverride] = useState<null | "engaged" | "error">(null);

  /**
   * Distinct from `isComplete` — this flips to true only AFTER the mic
   * has fully stopped, preventing the certificate from appearing while
   * the user is still speaking the last words.
   */
  const [showCertificate, setShowCertificate] = useState(false);

  const overrideTimerRef = useRef<number | null>(null);
  const prevStepRef = useRef(0);
  const sessionPeakStepsRef = useRef(0);
  const recordingActiveRef = useRef(false);
  const recognitionPausedForGuideRef = useRef(false);

  const isOnline = useOnlineStatus();

  const speechSessionRefs = useMemo(
    () => ({
      sessionActiveRef: recordingActiveRef,
      recognitionPausedRef: recognitionPausedForGuideRef,
    }),
    [],
  );

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

  const transcript = hasSupport ? speechTranscript : textInput;

  useEffect(() => {
    recordingActiveRef.current = isRecording;
  }, [isRecording]);

  const normalized = useMemo(() => normalizeTranscript(transcript), [transcript]);

  const computedMatchSteps = useMemo(
    () => countConsecutiveSteps(transcript, normalized),
    [transcript, normalized],
  );

  const steps = useMemo(() => {
    if (prevStepRef.current >= shahadaSteps.length) return shahadaSteps.length;

    if (!hasSupport) return computedMatchSteps;

    if (!isRecording) {
      sessionPeakStepsRef.current = 0;
      return computedMatchSteps;
    }

    const peak = sessionPeakStepsRef.current;
    const fullMatch = computedMatchSteps;
    const partialMatch =
      peak > 0 ? countConsecutiveSteps(transcript, normalized, peak) : 0;

    const best = Math.max(fullMatch, partialMatch);
    sessionPeakStepsRef.current = Math.max(peak, best);

    return Math.min(sessionPeakStepsRef.current, shahadaSteps.length);
  }, [hasSupport, isRecording, computedMatchSteps, transcript, normalized]);

  const isComplete = steps >= shahadaSteps.length;
  const currentStep = shahadaSteps[Math.min(steps, shahadaSteps.length - 1)];

  const isSpeaking = useSpeakingDetection(volume, isRecording);

  const orbMode: OrbVisualMode = useMemo(() => {
    if (error) return "error";
    if (orbOverride) return orbOverride;
    if (!isRecording && !textSubmitted) return "listening";
    return isSpeaking ? "speaking" : "listening";
  }, [error, orbOverride, isRecording, isSpeaking, textSubmitted]);

  const clearTimer = useCallback(() => {
    if (overrideTimerRef.current) {
      clearTimeout(overrideTimerRef.current);
      overrideTimerRef.current = null;
    }
  }, []);

  const scheduleTimer = useCallback(
    (ms: number) => {
      clearTimer();
      overrideTimerRef.current = window.setTimeout(() => setOrbOverride(null), ms);
    },
    [clearTimer],
  );

  // Flash "engaged" when a new step is matched during speech recording
  useEffect(() => {
    if (!isRecording) return;
    if (steps > prevStepRef.current) {
      prevStepRef.current = steps;
      setOrbOverride("engaged");
      scheduleTimer(2000);
    }
  }, [steps, isRecording, scheduleTimer]);

  // Flash "engaged" when the typed text completes the Shahada
  useEffect(() => {
    if (!hasSupport && isComplete && textSubmitted) {
      setOrbOverride("engaged");
      scheduleTimer(2000);
      // Text mode has no mic to close — certificate is safe to show immediately
      setShowCertificate(true);
    }
  }, [hasSupport, isComplete, textSubmitted, scheduleTimer]);

  // Auto-stop when the full Shahada is matched via speech
  useEffect(() => {
    if (isComplete && isRecording) {
      recordingActiveRef.current = false;
      recognitionPausedForGuideRef.current = false;
      stopListening();
      stopVisualizer();
      setIsRecording(false);
      setOrbOverride("engaged");
      scheduleTimer(2000);
      setShowCertificate(true);
    }
  }, [isComplete, isRecording, stopListening, stopVisualizer, scheduleTimer]);
  // Stop recording if the connection drops mid-session
  useEffect(() => {
    if (!isOnline && isRecording) {
      recordingActiveRef.current = false;
      recognitionPausedForGuideRef.current = false;
      stopVisualizer();
      stopListening();
      setIsRecording(false);
    }
  }, [isOnline, isRecording, stopListening, stopVisualizer]);

  // Clear startup errors once the connection is restored
  useEffect(() => {
    if (isOnline) setStartupError(null);
  }, [isOnline]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      stopVisualizer();
      stopListening();
    };
  }, [clearTimer, stopVisualizer, stopListening]);

  const handlePromptSpeechStart = useCallback(() => {
    recognitionPausedForGuideRef.current = true;
    void suspendVisualizer();
    stopListening();
  }, [stopListening, suspendVisualizer]);

  const handlePromptSpeechEnd = useCallback(() => {
    recognitionPausedForGuideRef.current = false;
    void resumeVisualizer();
    startListening();
  }, [resumeVisualizer, startListening]);

  const handleStart = useCallback(async () => {
    if (!hasSupport) return;

    if (!isOnline) {
      setStartupError("No internet connection. Please reconnect and try again.");
      return;
    }

    clearTimer();
    setOrbOverride(null);
    setStartupError(null);

    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
        const primer = new SpeechSynthesisUtterance(" ");
        primer.volume = 0;
        primer.lang = "ar-SA";
        window.speechSynthesis.speak(primer);
        window.speechSynthesis.cancel();
        void window.speechSynthesis.getVoices();
      }

      try {
        await startVisualizer();
      } catch {
        console.warn("Audio visualizer failed to start. Continuing without it.");
      }

      recordingActiveRef.current = true;
      recognitionPausedForGuideRef.current = false;
      setIsRecording(true);
      startListening();
      prevStepRef.current = 0;
    } catch (err) {
      recordingActiveRef.current = false;
      stopVisualizer();
      stopListening();
      setIsRecording(false);
      setStartupError(
        err instanceof Error ? err.message : "The microphone could not be started.",
      );
    }
  }, [clearTimer, hasSupport, isOnline, startListening, startVisualizer, stopListening, stopVisualizer]);

  const handleStop = useCallback(() => {
    const hasText = speechTranscript.trim().length > 0;
    const incomplete = steps < shahadaSteps.length;

    recordingActiveRef.current = false;
    recognitionPausedForGuideRef.current = false;

    stopVisualizer();
    stopListening();
    setIsRecording(false);

    if (hasText && incomplete) {
      setOrbOverride("error");
      scheduleTimer(2000);
    }
  }, [speechTranscript, steps, stopVisualizer, stopListening, scheduleTimer]);

  const handleTextSubmit = useCallback(() => {
    if (!textInput.trim()) return;
    setTextSubmitted(true);
  }, [textInput]);

  const handleRestart = useCallback(() => {
    clearTimer();
    setOrbOverride(null);
    setStartupError(null);
    setTextInput("");
    setTextSubmitted(false);
    setTextFlowStarted(false);
    setShowCertificate(false);

    recordingActiveRef.current = false;
    recognitionPausedForGuideRef.current = false;

    resetSpeechTranscript();
    stopVisualizer();
    stopListening();
    setIsRecording(false);

    prevStepRef.current = 0;
    sessionPeakStepsRef.current = 0;
  }, [clearTimer, resetSpeechTranscript, stopVisualizer, stopListening]);

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

  const statusMessage = !isOnline ? null : startupError || error || null;

  const showTextFallback = !hasSupport && textFlowStarted && !showCertificate;

  return {
    // State
    isRecording,
    isComplete,
    showCertificate,
    isOnline,
    hasSupport,
    steps,
    currentStep,

    // Orb
    orbMode,
    volumeRef,

    // Transcript / display
    transcript,
    display,
    subtitle,
    statusMessage,

    // Text fallback
    textInput,
    textFlowStarted,
    showTextFallback,
    setTextInput,

    // Handlers
    handleStart: handleStartWithTextFallback,
    handleStop,
    handleRestart,
    handleTextSubmit,
    handlePromptSpeechStart,
    handlePromptSpeechEnd,
  };
};