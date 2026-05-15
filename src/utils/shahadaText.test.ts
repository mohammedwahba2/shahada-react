import { describe, expect, it } from "vitest";

import {
  cleanDisplayTranscript,
  countConsecutiveSteps,
  normalizeTranscript,
  stripForCompare,
} from "./shahadaText";

describe("shahadaText", () => {
  it("normalizes Arabic diacritics for matching", () => {
    const raw = "أَشْهَدُ أَن لَّا إِلَٰهَ";
    expect(stripForCompare(raw)).toBe("اشهد ان لا اله");
  });

  it("counts the first Shahada step in a transcript", () => {
    const transcript = "أشهد أن لا إله";
    const normalized = normalizeTranscript(transcript);
    expect(countConsecutiveSteps(transcript, normalized)).toBe(1);
  });

  it("removes consecutive duplicate words in display text", () => {
    expect(cleanDisplayTranscript("الله الله محمد")).toBe("الله محمد");
  });
});
