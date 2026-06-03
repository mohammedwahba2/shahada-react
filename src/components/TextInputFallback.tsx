import { useRef, type ChangeEvent } from "react";

interface TextInputFallbackProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isComplete: boolean;
}

/**
 * Fallback for browsers without Web Speech API (iOS Safari, Firefox).
 * The user types the Shahada instead of speaking it — same matching logic applies.
 */
export function TextInputFallback({
  value,
  onChange,
  onSubmit,
  isComplete,
}: TextInputFallbackProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim()) {
      onSubmit();
    }
  };

  if (isComplete) return null;

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-sm">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Voice recognition is not available on this browser.
        <br />
        Type the Shahada in Arabic below.
      </p>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        dir="rtl"
        lang="ar"
        placeholder="Type the Shahada in Arabic..."
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className={[
          "w-full rounded-full border px-5 py-3 text-center text-base outline-none transition",
          "border-zinc-300 bg-transparent dark:border-zinc-600",
          "focus:border-zinc-500 dark:focus:border-zinc-400",
          "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
        ].join(" ")}
      />

      <button
        type="button"
        onClick={onSubmit}
        disabled={!value.trim()}
        className="px-6 py-2 rounded-full bg-ink text-white dark:bg-white dark:text-ink text-sm font-medium disabled:opacity-40 transition"
      >
        Check
      </button>
    </div>
  );
}