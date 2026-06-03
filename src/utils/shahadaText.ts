import { shahadaSteps } from "../data/shahada";

/** Normalize transcript for matching */
export const normalizeTranscript = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();

/** Normalize Arabic text for comparison (diacritics + character variants) */
export const stripForCompare = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[أإآٱأ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .trim();

/** Remove repeated words for cleaner UI display */
export const cleanDisplayTranscript = (text: string): string => {
  if (!text) return "";

  const words = text.trim().split(/\s+/);
  const uniqueWords = words.filter(
    (word, index) => word !== words[index - 1],
  );

  return uniqueWords.join(" ");
};

/**
 * Count sequential Shahada steps matched in transcript.
 * Uses fuzzy Arabic matching (normalized arabic + keywords + compactHints).
 */
export const countConsecutiveSteps = (
  raw: string,
  normalized: string,
  fromStep: number = 0,
): number => {
  const compactRaw = stripForCompare(raw);
  const normLower = normalized.toLowerCase();

  let lastIndex = 0;
  let matched = 0;

  for (let i = 0; i < shahadaSteps.length; i++) {
    const step = shahadaSteps[i];
    if (!step) break;

    if (i < fromStep) {
      matched++;
      continue;
    }

    const arabic = stripForCompare(step.arabic);

    // Build all candidates: arabic text + keywords + compactHints
    const keywordCandidates = (step.keywords ?? []).map((k) =>
      stripForCompare(k),
    );
    const hintCandidates = (step.compactHints ?? []).map((h) =>
      stripForCompare(h),
    );

    const allCandidates = [arabic, ...keywordCandidates, ...hintCandidates].filter(
      Boolean,
    );

    let bestStart = -1;
    let bestLen = 0;

    for (const cand of allCandidates) {
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
        lastIndex = Math.min(
          normLower.length,
          Math.max(
            lastIndex,
            Math.floor(
              (lastIndex / compactRaw.length) * normLower.length,
            ),
          ),
        );
      }
      continue;
    }

    break;
  }

  return matched;
};