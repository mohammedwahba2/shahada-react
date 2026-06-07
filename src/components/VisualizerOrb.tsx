import { memo, useEffect, useRef } from "react";
import type { VisualizerOrbProps } from "../types";

const orbAsset = (mode: VisualizerOrbProps["mode"]) => {
  switch (mode) {
    case "listening":
      return "/orbs/listen.svg";
    case "engaged":
      return "/orbs/engage.svg";
    case "error":
      return "/orbs/error.svg";
    default:
      return "/orbs/speak.svg";
  }
};

const orbLabel: Record<VisualizerOrbProps["mode"], string> = {
  idle: "Waiting to start",
  listening: "Listening for your voice",
  speaking: "Voice detected",
  engaged: "Step matched — well done",
  error: "An error occurred",
};

const BASE_SCALE: Record<VisualizerOrbProps["mode"], number> = {
  idle: 1,
  listening: 1,
  speaking: 1.04,
  engaged: 1.06,
  error: 1,
};

function VisualizerOrbComponent({ mode, volumeRef }: VisualizerOrbProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const modeRef = useRef(mode);
  const scaleRef = useRef(1);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);

      const img = imgRef.current;
      if (!img) return;

      const vol = volumeRef?.current ?? 0;
      const currentMode = modeRef.current;

      const base = BASE_SCALE[currentMode] ?? 1;
      // Only add volume boost when actively speaking
      const boost =
        currentMode === "speaking" || currentMode === "engaged"
          ? (vol / 255) * 0.18
          : 0;

      const target = base + boost;

      // Exponential smoothing: snappy upward, slow decay
      const alpha = vol > scaleRef.current * 255 * 0.9 ? 0.18 : 0.08;
      scaleRef.current = scaleRef.current + (target - scaleRef.current) * alpha;

      img.style.transform = `scale(${scaleRef.current.toFixed(4)})`;
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [volumeRef]);

  return (
    <div
      role="img"
      aria-label={orbLabel[mode]}
      aria-live="polite"
      aria-atomic="true"
      className="flex items-center justify-center isolate"
    >
      <div className="overflow-hidden rounded-full [contain:paint]">
        <img
          ref={imgRef}
          src={orbAsset(mode)}
          alt={orbLabel[mode]}
          width={200}
          height={200}
          draggable={false}
          decoding="async"
          className="h-52 w-52 max-w-full will-change-transform transition-opacity duration-300 sm:h-64 sm:w-64"
        />
      </div>
    </div>
  );
}

export const VisualizerOrb = memo(VisualizerOrbComponent);
