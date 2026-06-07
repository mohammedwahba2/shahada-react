import { shahadaSteps } from "../data/shahada";

export const normalizeTranscript = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();

export const stripForCompare = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")      
    .replace(/[أإآٱ]/g, "ا")    
    .replace(/ة/g, "ه")          
    .replace(/ى/g, "ي")           
    .replace(/ؤ/g, "و")         
    .replace(/ئ/g, "ي")          
    .trim();

export const cleanDisplayTranscript = (text: string): string => {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  return words.filter((word, i) => word !== words[i - 1]).join(" ");
};

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

    const keywordCandidates = (step.keywords ?? []).map(stripForCompare);
    const hintCandidates = (step.compactHints ?? []).map(stripForCompare);
    const allCandidates = [arabic, ...keywordCandidates, ...hintCandidates].filter(Boolean);

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
            Math.floor((lastIndex / compactRaw.length) * normLower.length),
          ),
        );
      }
      continue;
    }

    break;
  }

  return matched;
};
