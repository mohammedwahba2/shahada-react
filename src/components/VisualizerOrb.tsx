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
  idle:     "Waiting to start",
  listening: "Listening for your voice",
  speaking: "Voice detected",
  engaged:  "Step matched — well done",
  error:    "An error occurred",
};

function VisualizerOrbComponent({ mode, volumeRef }: VisualizerOrbProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (!volumeRef) return;

    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
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
          alt="Listening for your voice"    
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