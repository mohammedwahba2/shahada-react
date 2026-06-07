import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";

import type { SpeechRecognitionHook } from "../types";

type SessionRefs = {
  sessionActiveRef: MutableRefObject<boolean>;
  recognitionPausedRef: MutableRefObject<boolean>;
};

type RecognitionState = "idle" | "starting" | "listening" | "stopping";

const RESTART_DELAY_MS = 120;
const START_RETRY_DELAY_MS = 150;

const ERROR_MESSAGES: Partial<Record<string, string>> = {
  "not-allowed": "Mic permission denied",
  "audio-capture": "No microphone was captured",
  network: "Internet connection lost",
};

function getSpeechRecognitionCtor():
  | SpeechRecognitionConstructor
  | undefined {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

function isMobile(): boolean {
  return (
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
}

const useSpeechRecognition = (
  sessionRefs?: SessionRefs,
): SpeechRecognitionHook => {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ctorRef = useRef(getSpeechRecognitionCtor());
  const hasSupport = ctorRef.current !== undefined;

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const accumulatedRef = useRef("");
  const stateRef = useRef<RecognitionState>("idle");

  const startListeningRef = useRef<() => void>(() => {});

  const mobile = isMobile();

  const createRecognition = useCallback((): SpeechRecognition | null => {
    const Ctor = ctorRef.current;
    if (!Ctor) return null;

    const rec = new Ctor();
    rec.lang = "ar-SA";
    rec.interimResults = true;
    rec.continuous = !mobile;
    rec.maxAlternatives = 1;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";

      for (let i = event.resultIndex ?? 0; i < event.results.length; i++) {
        const result = event.results.item(i);
        const text = result.item(0)?.transcript ?? "";

        if (result.isFinal) {
          accumulatedRef.current = [accumulatedRef.current, text]
            .filter(Boolean)
            .join(" ")
            .trim();
        } else {
          interim += text;
        }
      }

      setTranscript(
        [accumulatedRef.current, interim].filter(Boolean).join(" ").trim(),
      );
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted" || event.error === "no-speech") return;

      const msg =
        ERROR_MESSAGES[event.error] ?? `Speech error: ${event.error}`;
      setError(msg);
      stateRef.current = "idle";
      setIsListening(false);
    };

    rec.onend = () => {
      stateRef.current = "idle";
      setIsListening(false);

      if (!sessionRefs) return;

      const { sessionActiveRef, recognitionPausedRef } = sessionRefs;
      if (!sessionActiveRef.current || recognitionPausedRef.current) return;

      window.setTimeout(() => {
        if (!sessionActiveRef.current || recognitionPausedRef.current) return;
        startListeningRef.current();
      }, RESTART_DELAY_MS);
    };

    return rec;
  }, [mobile, sessionRefs]);

  useEffect(() => {
    recognitionRef.current = createRecognition();

    return () => {
      stateRef.current = "stopping";
      try {
        recognitionRef.current?.abort();
      } catch {
        console.warn("Failed to abort speech recognition during cleanup");
      }
      recognitionRef.current = null;
    };
  }, [createRecognition]);

  const startListening = useCallback(() => {
    if (!ctorRef.current) {
      setError("Speech recognition not supported");
      return;
    }

    if (
      stateRef.current === "starting" ||
      stateRef.current === "listening"
    ) {
      return;
    }

    stateRef.current = "starting";
    setError(null);

    const attempt = (isRetry: boolean) => {
      if (stateRef.current !== "starting") return;

      try {
        recognitionRef.current = createRecognition();

        if (!recognitionRef.current) {
          setError("Speech recognition not supported");
          stateRef.current = "idle";
          setIsListening(false);
          return;
        }

        recognitionRef.current.start();
        stateRef.current = "listening";
        setIsListening(true);
      } catch (err) {
        if (stateRef.current !== "starting") return;

        if (!isRetry) {
          window.setTimeout(() => attempt(true), START_RETRY_DELAY_MS);
          return;
        }

        const domName = err instanceof DOMException ? err.name : "";
        setError(
          domName === "InvalidStateError"
            ? "Speech recognition was still stopping. Tap start again in a moment."
            : "Speech recognition could not start on this browser.",
        );
        stateRef.current = "idle";
        setIsListening(false);
      }
    };

    window.setTimeout(() => attempt(false), 0);
  }, [createRecognition]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const stopListening = useCallback(() => {
    stateRef.current = "stopping";
    setIsListening(false);

    try {
      recognitionRef.current?.abort();
    } catch {
      try {
        recognitionRef.current?.stop();
      } catch {
        console.warn("Failed to stop speech recognition");
      }
    }
  }, []);

  const resetTranscript = useCallback(() => {
    stateRef.current = "stopping";
    accumulatedRef.current = "";
    setTranscript("");

    try {
      recognitionRef.current?.abort();
    } catch {
      console.warn("Failed to abort speech recognition during reset");
    }

    stateRef.current = "idle";
    recognitionRef.current = createRecognition();
  }, [createRecognition]);

  return {
    transcript,
    isListening,
    hasSupport,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
};

export default useSpeechRecognition;
