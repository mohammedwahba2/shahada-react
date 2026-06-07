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

const useSpeechRecognition = (
  sessionRefs?: SessionRefs
): SpeechRecognitionHook => {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ctorRef = useRef<SpeechRecognitionConstructor | undefined>(
    typeof window !== "undefined"
      ? (window.SpeechRecognition ??
        window.webkitSpeechRecognition)
      : undefined
  );

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const accumulatedRef = useRef("");
  const startGenerationRef = useRef(0);
  const startListeningRef = useRef<() => void>(() => {});
  const isMobileBrowser =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const hasSupport = ctorRef.current !== undefined;

  const createRecognition = useCallback(() => {
    const Ctor = ctorRef.current;
    if (!Ctor) return null;

    const rec = new Ctor();

    rec.lang = "ar-SA";
    rec.interimResults = true;
    rec.continuous = !isMobileBrowser;
    rec.maxAlternatives = 1;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      const start = event.resultIndex ?? 0;
      let interimPart = "";

      for (let i = start; i < event.results.length; i++) {
        const result = event.results.item(i);
        const text = result.item(0)?.transcript ?? "";

        if (result.isFinal) {
          accumulatedRef.current = [
            accumulatedRef.current,
            text,
          ]
            .filter(Boolean)
            .join(" ")
            .trim();
        } else {
          interimPart += text;
        }
      }

      const full = [
        accumulatedRef.current,
        interimPart,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      setTranscript(full);
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted") {
        return;
      }
    
      if (event.error === "no-speech") {
        return;
      }
    
      if (event.error === "network") {
        setError("Internet connection lost");
        setIsListening(false);
        return;
      }
    
      const msg =
        event.error === "not-allowed"
          ? "Mic permission denied"
          : event.error === "audio-capture"
          ? "No microphone was captured"
          : `Speech error: ${event.error}`;
    
      setError(msg);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);

      if (!sessionRefs) {
        return;
      }

      const active = sessionRefs.sessionActiveRef.current;
      const paused = sessionRefs.recognitionPausedRef.current;

      if (!active || paused) {
        return;
      }

      window.setTimeout(() => {
        if (!sessionRefs.sessionActiveRef.current) {
          return;
        }

        if (sessionRefs.recognitionPausedRef.current) {
          return;
        }

        startListeningRef.current();
      }, 120);
    };

    return rec;
  }, [sessionRefs, isMobileBrowser]);

  useEffect(() => {
    recognitionRef.current = createRecognition();

    return () => {
      startGenerationRef.current += 1;

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

    setError(null);

    const generation = ++startGenerationRef.current;

    const attempt = (isRetry: boolean) => {
      if (generation !== startGenerationRef.current) {
        return;
      }

      try {
        recognitionRef.current = createRecognition();

        if (!recognitionRef.current) {
          setError("Speech recognition not supported");
          setIsListening(false);
          return;
        }

        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        if (generation !== startGenerationRef.current) {
          return;
        }

        if (!isRetry) {
          window.setTimeout(() => attempt(true), 150);
          return;
        }

        const name =
          err instanceof DOMException ? err.name : "";

        setError(
          name === "InvalidStateError"
            ? "Speech recognition was still stopping. Tap start again in a moment."
            : "Speech recognition could not start on this browser."
        );
        setIsListening(false);
      }
    };

    window.setTimeout(() => attempt(false), 0);
  }, [createRecognition]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const stopListening = useCallback(() => {
    startGenerationRef.current += 1;

    try {
      recognitionRef.current?.abort();
    } catch {
      try {
        recognitionRef.current?.stop();
      } catch {
        console.warn("Failed to stop speech recognition");
      }
    }

    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    startGenerationRef.current += 1;

    accumulatedRef.current = "";
    setTranscript("");

    try {
      recognitionRef.current?.abort();
    } catch {
      console.warn("Failed to abort speech recognition during reset");
    }

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
