import { describe, expect, it } from "vitest";

import {
  cleanDisplayTranscript,
  countConsecutiveSteps,
  normalizeTranscript,
  stripForCompare,
} from "./shahadaText";

describe("stripForCompare", () => {
  it("removes Arabic diacritics", () => {
    expect(stripForCompare("أَشْهَدُ أَن لَّا إِلَٰهَ")).toBe("اشهد ان لا اله");
  });

  it("normalizes all four alef variants (أ إ آ ٱ) to bare alef ا", () => {
    expect(stripForCompare("أإآٱ")).toBe("اااا");
  });

  it("normalizes teh marbuta to heh", () => {
    expect(stripForCompare("رحمة")).toBe("رحمه");
  });

  it("normalizes alef maksura to yeh", () => {
    expect(stripForCompare("يرى")).toBe("يري");
  });

  it("no duplicate alef replacement — أ only replaced once", () => {
    expect(stripForCompare("أأ")).toBe("اا");
  });
});

describe("normalizeTranscript", () => {
  it("lowercases and removes diacritics", () => {
    expect(normalizeTranscript("Ashhadu AN")).toBe("ashhadu an");
  });

  it("collapses multiple spaces to one", () => {
    expect(normalizeTranscript("la   ilaha")).toBe("la ilaha");
  });

  it("trims leading and trailing whitespace", () => {
    expect(normalizeTranscript("  hello  ")).toBe("hello");
  });
});

describe("cleanDisplayTranscript", () => {
  it("removes consecutive duplicate words", () => {
    expect(cleanDisplayTranscript("الله الله محمد")).toBe("الله محمد");
  });

  it("keeps non-consecutive duplicates", () => {
    expect(cleanDisplayTranscript("الله محمد الله")).toBe("الله محمد الله");
  });

  it("returns empty string for empty input", () => {
    expect(cleanDisplayTranscript("")).toBe("");
  });
});

describe("countConsecutiveSteps", () => {
  it("matches the first Shahada step from Arabic transcript", () => {
    const t = "أشهد أن لا إله";
    expect(countConsecutiveSteps(t, normalizeTranscript(t))).toBe(1);
  });

  it("matches the first step via phonetic keyword 'ashhadu'", () => {
    const t = "ashhadu an la ilaha";
    expect(countConsecutiveSteps(t, normalizeTranscript(t))).toBe(1);
  });

  it("matches two consecutive steps", () => {
    const t = "أشهد أن لا إله إلا الله";
    expect(countConsecutiveSteps(t, normalizeTranscript(t))).toBe(2);
  });

  it("does not skip steps — gap between step 1 and 3 counts as 1", () => {
    const t = "أشهد أن لا إله وأشهد";
    expect(countConsecutiveSteps(t, normalizeTranscript(t))).toBe(1);
  });

  it("returns 0 for an unrelated transcript", () => {
    const t = "hello world";
    expect(countConsecutiveSteps(t, normalizeTranscript(t))).toBe(0);
  });

  it("respects fromStep offset — pre-counts already-matched steps", () => {
    const t = "وأشهد أن محمداً رسول الله";
    const n = normalizeTranscript(t);
    expect(countConsecutiveSteps(t, n, 2)).toBeGreaterThanOrEqual(4);
  });
});
