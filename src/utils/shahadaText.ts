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
  return text
    .trim()
    .split(/\s+/)
    .filter((word, i, arr) => word !== arr[i - 1])
    .join(" ");
};


function buildCandidates(stepIndex: number): string[] {
  const step = shahadaSteps[stepIndex];
  if (!step) return [];

  const raw = [
    step.arabic,
    ...(step.keywords ?? []),
    ...(step.compactHints ?? []),
  ];

  return [...new Set(raw.map(stripForCompare).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );
}

const STEP_CANDIDATES: readonly string[][] = shahadaSteps.map((_, i) =>
  buildCandidates(i),
);


export const countConsecutiveSteps = (
  transcript: string,
  _normalized: string,    
  fromStep = 0,
): number => {
  const haystack = stripForCompare(transcript);

  let cursor = 0;
  let matched = 0;

  for (let i = 0; i < shahadaSteps.length; i++) {
    if (i < fromStep) {
      matched++;
      continue;
    }

    const candidates = STEP_CANDIDATES[i] ?? [];

    let bestStart = -1;
    let bestEnd = -1;

    for (const cand of candidates) {
      const idx = haystack.indexOf(cand, cursor);
      if (idx === -1) continue;

      if (bestStart === -1 || idx < bestStart) {
        bestStart = idx;
        bestEnd = idx + cand.length;
      }
    }

    if (bestStart === -1) break; 

    matched++;
    cursor = bestEnd; 
  }

  return matched;
};
