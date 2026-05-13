import { useMemo } from "react";

/**
 * normalize Arabic text for comparison
 */
const stripForCompare = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[أإآٱأ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .trim();

/**
 * simple word-by-word matching (sequential)
 */
const countConsecutiveWordsMatched = (
  expected: string,
  actual: string
): number => {
  const expectedWords = stripForCompare(expected).split(/\s+/);
  const actualWords = stripForCompare(actual).split(/\s+/);

  let matched = 0;
  let j = 0;

  for (const word of actualWords) {
    if (j < expectedWords.length && expectedWords[j] === word) {
      matched++;
      j++;
    }
  }

  return matched;
};

interface MatchedWordsDisplayProps {
  expected: string;
  display: string;
}

/**
 * highlights matched words in expected Arabic text
 */
export function MatchedWordsDisplay({
  expected,
  display,
}: MatchedWordsDisplayProps) {
  const matchedCount = useMemo(
    () => countConsecutiveWordsMatched(expected, display),
    [expected, display]
  );

  const words = useMemo(() => expected.split(/\s+/), [expected]);

  return (
    <p
      className="mt-4 text-lg sm:text-2xl leading-relaxed"
      dir="rtl"
      aria-live="polite"
    >
      {words.map((word, idx) => (
        <span
          key={idx}
          className={
            idx < matchedCount ? "text-ink/60 dark:text-white/60" : ""
          }
        >
          {word + " "}
        </span>
      ))}
    </p>
  );
}