import { useCallback, useEffect, useRef, useState } from "react";
import type { ShahadaStep } from "../types";
import { Volume2 } from "lucide-react";

const getStepAudioSrc = (stepId: number) =>
  `${import.meta.env.BASE_URL}audio/step${stepId}.m4a`;

export interface RecitePromptProps {
  step: ShahadaStep;
  stepIndex: number;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

export function RecitePrompt({
  step,
  stepIndex,
  onSpeechStart,
  onSpeechEnd,
}: RecitePromptProps) {
  const [busy, setBusy] = useState(false);
  const onSpeechStartRef = useRef(onSpeechStart);
  const onSpeechEndRef = useRef(onSpeechEnd);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playGenRef = useRef(0);

  // Keep callback refs fresh without triggering effects
  useEffect(() => {
    onSpeechStartRef.current = onSpeechStart;
    onSpeechEndRef.current = onSpeechEnd;
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  const handleEnd = useCallback((gen: number) => {
    if (gen !== playGenRef.current) return;
    setBusy(false);
    onSpeechEndRef.current?.();
  }, []);

  const play = useCallback(
    (stepId: number) => {
      const gen = ++playGenRef.current;

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }

      setBusy(true);
      onSpeechStartRef.current?.();

      const audio = new Audio(getStepAudioSrc(stepId));
      audio.preload = "auto";
      audioRef.current = audio;

      audio.onended = () => handleEnd(gen);
      audio.onerror = () => handleEnd(gen);

      void audio.play().catch(() => {
        handleEnd(gen);
      });
    },
    [handleEnd],
  );

  // Auto-play when step.id changes — stepIndex used only for initial delay
  useEffect(() => {
    const delay = stepIndex === 0 ? 450 : 140;
    const capturedId = step.id;
    playGenRef.current++;

    const id = window.setTimeout(() => play(capturedId), delay);
    const audioNode = audioRef.current;

    return () => {
      clearTimeout(id);
      if (audioNode) {
        audioNode.pause();
        audioNode.src = "";
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id]); 

  return (
    <div className="flex w-full max-w-lg items-center justify-center gap-3">
      <p className="text-center text-[15px] font-medium text-zinc-800 dark:text-zinc-100 sm:text-base">
        {step.promptLine}
      </p>

      <button
        type="button"
        onClick={() => play(step.id)}
        disabled={busy}
        aria-label="Play pronunciation"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-ink text-ink transition hover:bg-ink/10 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <Volume2 size={22} strokeWidth={1.75} />
      </button>
    </div>
  );
}