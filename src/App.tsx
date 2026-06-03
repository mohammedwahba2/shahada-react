import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Header } from "./components/Header";
import { VisualizerOrb } from "./components/VisualizerOrb";
import { Button } from "./components/Button";
import { RecitePrompt } from "./components/RecitePrompt";
import { Certificate } from "./components/Certificate";
import { IntroFlow } from "./components/IntroFlow";
import { MatchedWordsDisplay } from "./components/MatchedWordsDisplay";
import { TextInputFallback } from "./components/TextInputFallback";

import { shahadaSteps } from "./data/shahada";

import useSpeechRecognition from "./hooks/useSpeechRecognition";
import useAudioVisualizer from "./hooks/useAudioVisualizer";
import { useSpeakingDetection } from "./hooks/useSpeakingDetection";

import {
  cleanDisplayTranscript,
  countConsecutiveSteps,
  normalizeTranscript,
} from "./utils/shahadaText";

import type { OrbVisualMode } from "./types";

const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [startupError, setStartupError] = useState<string | null>(null);

  // Text fallback state (iOS / Firefox)
  const [textInput, setTextInput] = useState("");
  const [textSubmitted, setTextSubmitted] = useState(false);

  const [orbOverride, setOrbOverride] = useState<
    null | "engaged" | "error"
  >(null);

  const overrideTimerRef = useRef<number | null>(null);
  const prevStepRef = useRef(0);
  const sessionPeakStepsRef = useRef(0);
  const recordingActiveRef = useRef(false);
  const recognitionPausedForGuideRef = useRef(false);

  const speechSessionRefs = useMemo(
    () => ({
      sessionActiveRef: recordingActiveRef,
      recognitionPausedRef: recognitionPausedForGuideRef,
    }),
    [],
  );

  const clearTimer = useCallback(() => {
    if (overrideTimerRef.current) {
      clearTimeout(overrideTimerRef.current);
      overrideTimerRef.current = null;
    }
  }, []);

  const scheduleTimer = useCallback(
    (ms: number) => {
      clearTimer();
      overrideTimerRef.current = window.setTimeout(() => {
        setOrbOverride(null);
      }, ms);
    },
    [clearTimer],
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

  // Use speech transcript when supported, text input when not
  const transcript = hasSupport ? speechTranscript : textInput;

  useEffect(() => {
    recordingActiveRef.current = isRecording;
  }, [isRecording]);

  const normalized = useMemo(
    () => normalizeTranscript(transcript),
    [transcript],
  );

  const computedMatchSteps = useMemo(
    () => countConsecutiveSteps(transcript, normalized),
    [transcript, normalized],
  );

  const steps = useMemo(() => {
    if (prevStepRef.current >= shahadaSteps.length) {
      return shahadaSteps.length;
    }

    // In text mode we don't have an active "recording" session,
    // so just return computed steps directly
    if (!hasSupport) {
      return computedMatchSteps;
    }

    if (!isRecording) {
      sessionPeakStepsRef.current = 0;
      return computedMatchSteps;
    }

    const peak = sessionPeakStepsRef.current;
    const fullMatch = computedMatchSteps;
    const partialMatch =
      peak > 0
        ? countConsecutiveSteps(transcript, normalized, peak)
        : 0;

    const best = Math.max(fullMatch, partialMatch);
    sessionPeakStepsRef.current = Math.max(peak, best);

    return Math.min(sessionPeakStepsRef.current, shahadaSteps.length);
  }, [hasSupport, isRecording, computedMatchSteps, transcript, normalized]);

  const isComplete = steps >= shahadaSteps.length;

  const currentStep =
    shahadaSteps[Math.min(steps, shahadaSteps.length - 1)];

  const isSpeaking = useSpeakingDetection(volume, isRecording);

  const orbMode: OrbVisualMode = useMemo(() => {
    if (error) return "error";
    if (orbOverride) return orbOverride;
    if (!isRecording && !textSubmitted) return "listening";
    return isSpeaking ? "speaking" : "listening";
  }, [error, orbOverride, isRecording, isSpeaking, textSubmitted]);

  useEffect(() => {
    if (!isRecording) return;
    if (steps > prevStepRef.current) {
      prevStepRef.current = steps;
      setOrbOverride("engaged");
      scheduleTimer(2000);
    }
  }, [steps, isRecording, scheduleTimer]);

  // Mark complete when text input matches all steps
  useEffect(() => {
    if (!hasSupport && isComplete && textSubmitted) {
      setOrbOverride("engaged");
      scheduleTimer(2000);
    }
  }, [hasSupport, isComplete, textSubmitted, scheduleTimer]);

  useEffect(() => {
    return () => {
      clearTimer();
      stopVisualizer();
      stopListening();
    };
  }, [clearTimer, stopVisualizer, stopListening]);

  useEffect(() => {
    if (isComplete && isRecording) {
      recordingActiveRef.current = false;
      recognitionPausedForGuideRef.current = false;
      stopListening();
      stopVisualizer();
      setIsRecording(false);
      setOrbOverride("engaged");
      scheduleTimer(2000);
    }
  }, [
    isComplete,
    isRecording,
    stopListening,
    stopVisualizer,
    scheduleTimer,
  ]);

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
        // Visualization is optional; do not block recognition when it fails.
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
        err instanceof Error
          ? err.message
          : "The microphone could not be started.",
      );
    }
  }, [
    clearTimer,
    hasSupport,
    startListening,
    startVisualizer,
    stopListening,
    stopVisualizer,
  ]);

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

    recordingActiveRef.current = false;
    recognitionPausedForGuideRef.current = false;

    resetSpeechTranscript();
    stopVisualizer();
    stopListening();
    setIsRecording(false);

    prevStepRef.current = 0;
    sessionPeakStepsRef.current = 0;
  }, [clearTimer, resetSpeechTranscript, stopVisualizer, stopListening]);

  const subtitle = isComplete
    ? "Your first step on your path to Islam."
    : isRecording || (!hasSupport && textSubmitted)
      ? "Repeat after me"
      : "Your First Step On Your Path To Islam.";

  const display =
    cleanDisplayTranscript(transcript) ||
    (isRecording ? "Listening…" : "");

  // Only show error for speech mode — text mode handles its own UI
  const statusMessage = startupError || error || null;

  // In text mode, show the fallback after the user taps "Yes, I'm ready"
  const showTextFallback = !hasSupport && isRecording === false;

  return (
    <div className="flex min-h-full flex-col bg-white text-ink dark:bg-ink dark:text-white">
      <Header />

      <main
        id="main-content"
        className="flex flex-1 flex-col items-center px-4 pb-16 pt-12 sm:px-6 sm:pt-40 lg:px-8"
      >
        <div className="flex w-full max-w-2xl flex-1 flex-col items-center text-center">
          <h1 className="text-4xl font-semibold sm:text-6xl">SHAHADA</h1>

          <p className="max-w-md text-sm font-medium text-ink dark:text-white sm:text-xl">
            {subtitle}
          </p>

          <div className="mt-10 mb-4 md:mb-8 sm:mt-22">
            <VisualizerOrb mode={orbMode} volumeRef={volumeRef} />

            {/* Show matched words in both speech and text mode */}
            {currentStep && transcript.trim() && (
              <MatchedWordsDisplay
                expected={currentStep.arabic}
                display={display}
              />
            )}
          </div>

          {/* Pronunciation guide — show in speech mode only */}
          {!isComplete && isRecording && (
            <RecitePrompt
              step={currentStep!}
              stepIndex={steps}
              onSpeechStart={handlePromptSpeechStart}
              onSpeechEnd={handlePromptSpeechEnd}
            />
          )}

          <div className="mt-10 flex flex-col gap-4 items-center">
            {statusMessage && <p>{statusMessage}</p>}

            {/* Speech mode: not started yet */}
            {hasSupport && !isRecording && !isComplete && (
              <IntroFlow onStart={handleStart} />
            )}

            {/* Speech mode: recording */}
            {hasSupport && isRecording && !isComplete && (
              <Button variant="stop" onClick={handleStop}>
                Stop recording
              </Button>
            )}

            {/* Text fallback mode */}
            {showTextFallback && !isComplete && (
              <TextInputFallback
                value={textInput}
                onChange={setTextInput}
                onSubmit={handleTextSubmit}
                isComplete={isComplete}
              />
            )}

            {isComplete && <Certificate onRestart={handleRestart} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;