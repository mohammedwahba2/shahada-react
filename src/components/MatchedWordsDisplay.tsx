import { useMemo } from "react";
import { stripForCompare } from "../utils/shahadaText";

const countConsecutiveWordsMatched = (
  expected: string,
  actual: string,
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

export function MatchedWordsDisplay({
  expected,
  display,
}: MatchedWordsDisplayProps) {
  const matchedCount = useMemo(
    () => countConsecutiveWordsMatched(expected, display),
    [expected, display],
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
          key={`${idx}-${word}`}
          className={
            idx < matchedCount
              ? "text-ink dark:text-white"
              : "text-ink/30 dark:text-white/30"
          }
        >
          {word + " "}
        </span>
      ))}
    </p>
  );
}
