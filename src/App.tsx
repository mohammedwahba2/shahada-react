import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Helmet } from "react-helmet-async";

import { Header } from "./components/Header";
import { VisualizerOrb } from "./components/VisualizerOrb";
import { Button } from "./components/Button";
import { RecitePrompt } from "./components/RecitePrompt";
import { Certificate } from "./components/Certificate";
import { IntroFlow } from "./components/IntroFlow";
import { MatchedWordsDisplay } from "./components/MatchedWordsDisplay";

import { shahadaSteps } from "./data/shahada";

import useSpeechRecognition from "./hooks/useSpeechRecognition";
import useAudioVisualizer from "./hooks/useAudioVisualizer";

import type { OrbVisualMode } from "./types";

// audio + speech thresholds
const SPEAKING_ON = 40;
const SPEAKING_OFF = 30;

/**
 * Normalize transcript for matching
 */
const normalizeTranscript = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Normalize Arabic text for comparison (diacritics + character variants)
 */
const stripForCompare = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[أإآٱأ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .trim();

/**
 * Remove repeated words for cleaner UI display
 */
const cleanDisplayTranscript = (text: string): string => {
  if (!text) return "";

  const words = text.trim().split(/\s+/);

  const uniqueWords = words.filter(
    (word, index) => word !== words[index - 1]
  );

  return uniqueWords.join(" ");
};

/**
 * Count sequential Shahada steps matched in transcript
 * Uses fuzzy Arabic matching (normalized + hints)
 */
const countConsecutiveSteps = (
  raw: string,
  normalized: string,
  fromStep: number = 0  
): number => {
  const compactRaw = stripForCompare(raw);
  const normLower = normalized.toLowerCase();

  let lastIndex = 0;
  let normalizedIndex = 0;
  let matched = 0;

  for (let i = 0; i < shahadaSteps.length; i++) {
    const step = shahadaSteps[i];
    if (!step) break; 

    if (i < fromStep) {
      matched++;
      continue;
    }

    const arabic = stripForCompare(step.arabic);
    const hints = (step.compactHints ?? []).map((h) =>
      stripForCompare(h)
    );

    let bestStart = -1;
    let bestLen = 0;

    for (const cand of [arabic, ...hints]) {
      if (!cand) continue;
      const idx = compactRaw.indexOf(cand, lastIndex);
      if (idx !== -1 && (bestStart === -1 || idx < bestStart)) {
        bestStart = idx;
        bestLen = cand.length;
      }
    }

    if (bestStart !== -1) {
      matched++;
      lastIndex = bestStart + bestLen;
      if (compactRaw.length && normLower.length) {
        normalizedIndex = Math.min(
          normLower.length,
          Math.max(normalizedIndex, Math.floor((lastIndex / compactRaw.length) * normLower.length))
        );
      }
      continue;
    }

    break;
  }

  return matched;
};


//   Custom hook that detects when the user is actually speaking
const useSpeakingDetection = (
  volume: number,
  isRecording: boolean
) => {
  const isSpeakingRef = useRef(false);
  const smoothRef = useRef(0);

  useEffect(() => {
    smoothRef.current = smoothRef.current * 0.8 + volume * 0.2;
  }, [volume]);

  useEffect(() => {
    if (!isRecording) return;

    const currentVolume = smoothRef.current;

    if (!isSpeakingRef.current) {
      if (currentVolume >= SPEAKING_ON) {
        isSpeakingRef.current = true;
      }
    } else {
      if (currentVolume <= SPEAKING_OFF) {
        isSpeakingRef.current = false;
      }
    }
  }, [volume, isRecording]);

  return isSpeakingRef.current;
};

const App = () => {
  const isMobileBrowser =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const [isRecording, setIsRecording] = useState(false);
  const [startupError, setStartupError] = useState<
    string | null
  >(null);

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
    []
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
    [clearTimer]
  );

  const {
    volume,
    startVisualizer,
    stopVisualizer,
    suspendVisualizer,
    resumeVisualizer,
  } = useAudioVisualizer();

  const {
    transcript,
    hasSupport,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition(speechSessionRefs);

  useEffect(() => {
    recordingActiveRef.current = isRecording;
  }, [isRecording]);

  const normalized = useMemo(
    () => normalizeTranscript(transcript),
    [transcript]
  );

  const computedMatchSteps = useMemo(
    () => countConsecutiveSteps(transcript, normalized),
    [transcript, normalized]
  );

const steps = useMemo(() => {
  if (prevStepRef.current >= shahadaSteps.length) {
    return shahadaSteps.length;
  }

  if (!isRecording) {
    sessionPeakStepsRef.current = 0;
    return computedMatchSteps;
  }

  const peak = sessionPeakStepsRef.current;

  const fullMatch = computedMatchSteps;

  const partialMatch = peak > 0
    ? countConsecutiveSteps(transcript, normalized, peak)
    : 0;

  const best = Math.max(fullMatch, partialMatch);

  sessionPeakStepsRef.current = Math.max(peak, best);

  return Math.min(sessionPeakStepsRef.current, shahadaSteps.length);
}, [isRecording, computedMatchSteps, transcript, normalized]);

  const isComplete = steps >= shahadaSteps.length;

  // Keep last step visible after completion
  const currentStep =
    shahadaSteps[Math.min(steps, shahadaSteps.length - 1)];

  const isSpeaking = useSpeakingDetection(
    volume,
    isRecording
  );

  const orbMode: OrbVisualMode = useMemo(() => {
    if (error) return "error";

    if (orbOverride) return orbOverride;

    if (!isRecording) return "listening";

    return isSpeaking ? "speaking" : "listening";
  }, [error, orbOverride, isRecording, isSpeaking]);

  // Small pulse when user advances
  useEffect(() => {
    if (!isRecording) return;

    if (steps > prevStepRef.current) {
      prevStepRef.current = steps;

      setOrbOverride("engaged");

      scheduleTimer(2000);
    }
  }, [steps, isRecording, scheduleTimer]);

  // Cleanup
  useEffect(() => {
    return () => {
      clearTimer();
      stopVisualizer();
      stopListening();
    };
  }, [clearTimer, stopVisualizer, stopListening]);

  // Stop listening after completion
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
    if (!hasSupport) {
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

      if (!isMobileBrowser) {
        try {
          await startVisualizer();
        } catch {
          // Visualization is optional; do not block recognition when it fails.
        }
      }

      recordingActiveRef.current = true;
      recognitionPausedForGuideRef.current = false;
      setIsRecording(true);
      startListening();
      prevStepRef.current = 0;

    } catch (error) {
      recordingActiveRef.current = false;
      stopVisualizer();
      stopListening();
      setIsRecording(false);
      setStartupError(
        error instanceof Error
          ? error.message
          : "The microphone could not be started."
      );
    }
  }, [
    clearTimer,
    hasSupport,
    isMobileBrowser,
    startListening,
    startVisualizer,
    stopListening,
    stopVisualizer,
  ]);

  const handleStop = useCallback(() => {
    const hasText = transcript.trim().length > 0;

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
  }, [
    transcript,
    steps,
    stopVisualizer,
    stopListening,
    scheduleTimer,
  ]);

  const handleRestart = useCallback(() => {
    clearTimer();

    setOrbOverride(null);
    setStartupError(null);

    recordingActiveRef.current = false;
    recognitionPausedForGuideRef.current = false;

    resetTranscript();

    stopVisualizer();
    stopListening();

    setIsRecording(false);

    prevStepRef.current = 0;
  }, [
    clearTimer,
    resetTranscript,
    stopVisualizer,
    stopListening,
  ]);

  const subtitle = isComplete
    ? "Your first step on your path to Islam."
    : isRecording
    ? "Repeat after me"
    : "Your First Step On Your Path To Islam.";

  const display =
    cleanDisplayTranscript(transcript) ||
    (isRecording ? "Listening…" : "");
  const statusMessage =
    startupError ||
    error ||
    (!hasSupport
      ? /iPad|iPhone|iPod/i.test(
          typeof navigator !== "undefined"
            ? navigator.userAgent
            : ""
        )
        ? "Voice recognition is not available on iPhone/iPad browsers. Use Android Chrome or a computer."
        : "This browser does not support live speech recognition."
      : null);

  return (
    <>
      <Helmet>
        <title>
          Shahada App | Learn and Recite the Shahada Online
        </title>

        <meta
          name="description"
          content="Learn and recite the Shahada with real-time Arabic transcription and voice recognition for accurate pronunciation practice."
        />
      </Helmet>

      <div className="flex min-h-full flex-col bg-white text-ink dark:bg-ink dark:text-white">
        <Header />

        <main className="flex flex-1 flex-col items-center px-4 pb-16 pt-12 sm:px-6 sm:pt-40 lg:px-8">
          <div className="flex w-full max-w-2xl flex-1 flex-col items-center text-center">
            <h1 className="text-4xl font-semibold sm:text-6xl">
              SHAHADA
            </h1>

            <p className="max-w-md text-sm font-medium text-ink dark:text-white sm:text-xl">
              {subtitle}
            </p>

            <div className="mt-10 mb-4 md:mb-8 sm:mt-22">
              <VisualizerOrb mode={orbMode} />

              {isRecording && currentStep && transcript.trim() && (
            <MatchedWordsDisplay
              expected={currentStep.arabic}
              display={display}
            />
          )}
            </div>

            {/* Recitation guide */}
            {!isComplete && isRecording && (
              <RecitePrompt
                step={currentStep!}
                stepIndex={steps}
                onSpeechStart={handlePromptSpeechStart}
                onSpeechEnd={handlePromptSpeechEnd}
              />
            )}

            <div className="mt-10 flex flex-col gap-4">
              {statusMessage && <p>{statusMessage}</p>}

              {!isRecording && !isComplete && (
                <IntroFlow onStart={handleStart} />
              )}

              {isRecording && !isComplete && (
                <Button variant="stop" onClick={handleStop}>
                  Stop recording
                </Button>
              )}

              {isComplete && (
                <Certificate onRestart={handleRestart} />
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default App;
