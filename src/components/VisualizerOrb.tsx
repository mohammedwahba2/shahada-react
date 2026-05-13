import type { OrbVisualMode, VisualizerOrbProps } from "../types";

const orbAsset = (mode: OrbVisualMode) => {
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

export function VisualizerOrb({ mode }: VisualizerOrbProps) {
  return (
    <div className="flex items-center justify-center isolate">
      <div className="overflow-hidden rounded-full [contain:paint]">
        <img
          src={orbAsset(mode)}
          alt=""
          width={200}
          height={200}
          draggable={false}
          className="block h-[200px] w-[200px] max-w-none"
        />
      </div>
    </div>
  );
}