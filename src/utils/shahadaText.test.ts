import { describe, expect, it } from "vitest";

import {
  cleanDisplayTranscript,
  countConsecutiveSteps,
  normalizeTranscript,
  stripForCompare,
} from "./shahadaText";

describe("stripForCompare", () => {
  it("strips Arabic diacritics (tashkeel)", () => {
    expect(stripForCompare("أَشْهَدُ أَن لَّا إِلَٰهَ")).toBe("اشهد ان لا اله");
  });

  it("unifies all four alef variants to bare alef", () => {
    expect(stripForCompare("أإآٱ")).toBe("اااا");
  });

  it("converts teh marbuta to heh", () => {
    expect(stripForCompare("رحمة")).toBe("رحمه");
  });

  it("converts alef maksura to yeh", () => {
    expect(stripForCompare("يرى")).toBe("يري");
  });

  it("converts waw with hamza to plain waw", () => {
    expect(stripForCompare("مؤمن")).toBe("مومن");
  });

  it("converts yeh with hamza to plain yeh", () => {
    expect(stripForCompare("شيئ")).toBe("شيي");
  });

  it("does not double-replace alef — each variant replaced exactly once", () => {
    expect(stripForCompare("أأإآ")).toBe("اااا");
  });

  it("trims leading and trailing whitespace", () => {
    expect(stripForCompare("  اشهد  ")).toBe("اشهد");
  });
});

describe("normalizeTranscript", () => {
  it("lowercases Latin text", () => {
    expect(normalizeTranscript("Ashhadu AN")).toBe("ashhadu an");
  });

  it("removes Latin diacritics (NFD decomposition)", () => {
    expect(normalizeTranscript("Āllāh")).toBe("allah");
  });

  it("collapses multiple spaces to one", () => {
    expect(normalizeTranscript("la   ilaha")).toBe("la ilaha");
  });

  it("trims leading and trailing whitespace", () => {
    expect(normalizeTranscript("  hello  ")).toBe("hello");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeTranscript("")).toBe("");
  });
});

describe("cleanDisplayTranscript", () => {
  it("removes consecutive duplicate words", () => {
    expect(cleanDisplayTranscript("الله الله محمد")).toBe("الله محمد");
  });

  it("keeps non-consecutive duplicates", () => {
    expect(cleanDisplayTranscript("الله محمد الله")).toBe("الله محمد الله");
  });

  it("removes multiple consecutive duplicates in a row", () => {
    expect(cleanDisplayTranscript("اشهد اشهد اشهد ان")).toBe("اشهد ان");
  });

  it("returns empty string for empty input", () => {
    expect(cleanDisplayTranscript("")).toBe("");
  });

  it("returns single-word input unchanged", () => {
    expect(cleanDisplayTranscript("الله")).toBe("الله");
  });
});

describe("countConsecutiveSteps", () => {
  const match = (t: string, from?: number) =>
    countConsecutiveSteps(t, normalizeTranscript(t), from);

  it("matches step 1 via Arabic text", () => {
    expect(match("أشهد أن لا إله")).toBe(1);
  });

  it("matches step 1 via phonetic keyword 'ashhadu an la ilaha'", () => {
    expect(match("ashhadu an la ilaha")).toBe(1);
  });

  it("matches step 1 via keyword 'la ilaha'", () => {
    expect(match("la ilaha")).toBe(1);
  });

  it("matches two consecutive steps (Arabic)", () => {
    expect(match("أشهد أن لا إله إلا الله")).toBe(2);
  });

  it("matches two steps via mixed Arabic/phonetic", () => {
    expect(match("ashhadu an la ilaha إلا الله")).toBe(2);
  });

  it("matches all 5 steps for a full Arabic Shahada", () => {
    const full = "أشهد أن لا إله إلا الله وأشهد أن محمداً رسول الله";
    expect(match(full)).toBe(5);
  });

  it("matches all 5 steps for a full phonetic Shahada", () => {
    const full =
      "ashhadu an la ilaha illa allah wa ashhadu anna muhammadan rasulullah";
    expect(match(full)).toBe(5);
  });

  it("does not skip steps — step 2 missing means only step 1 is counted", () => {
    expect(match("أشهد أن لا إله وأشهد")).toBe(1);
  });

  it("requires steps to appear left-to-right — reversed order scores 0", () => {
    expect(match("رسول الله أشهد أن لا إله")).toBe(0);
  });

  it("respects fromStep=2 — pre-counts first two steps", () => {
    const t = "وأشهد أن محمداً رسول الله";
    expect(match(t, 2)).toBeGreaterThanOrEqual(4);
  });

  it("returns 0 for unrelated text", () => {
    expect(match("hello world")).toBe(0);
  });

  it("returns 0 for empty string", () => {
    expect(match("")).toBe(0);
  });

  it("handles STT repetition artifacts (الله الله) in step 2", () => {
    expect(match("أشهد أن لا إله الله الله")).toBeGreaterThanOrEqual(2);
  });

  it("is not confused by extra words between steps", () => {
    const t = "أشهد أن لا إله يعني إلا الله";
    expect(match(t)).toBeGreaterThanOrEqual(2);
  });
});
