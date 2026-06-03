import { useState } from "react";

interface IntroFlowProps {
  onStart: () => Promise<void> | void;
}

export function IntroFlow({ onStart }: IntroFlowProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      await onStart();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLearnMore = () => {
    const el = document.getElementById("about");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.hash = "#about";
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="max-w-sm text-md font-medium text-ink dark:text-white">
        Are you ready to recite the Shahada?
      </p>

      <div className="flex gap-3">
        <button
          onClick={handleStart}
          disabled={isLoading}
          aria-label={isLoading ? "Requesting microphone access…" : "Yes, I'm ready"}
          aria-busy={isLoading}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 px-6 py-2 rounded-full bg-ink text-white dark:bg-white dark:text-ink text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {isLoading ? (
            <>
              <span
                aria-hidden="true"
                className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white dark:border-ink/30 dark:border-t-ink animate-spin"
              />
              Requesting mic…
            </>
          ) : (
            "Yes, I'm ready"
          )}
        </button>

        <button
          onClick={handleLearnMore}
          aria-label="Learn more about the Shahada"
          className="min-h-[44px] px-6 py-2 rounded-full border border-zinc-300 dark:border-zinc-600 text-sm font-medium transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          Learn more
        </button>
      </div>
    </div>
  );
}