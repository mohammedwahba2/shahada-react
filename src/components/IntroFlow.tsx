interface IntroFlowProps {
  onStart: () => void;
}

export function IntroFlow({ onStart }: IntroFlowProps) {
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
          onClick={onStart}
          className="px-6 py-2 rounded-full bg-ink text-white dark:bg-white dark:text-ink text-sm font-medium"
        >
          Yes, I'm ready
        </button>

        <button
          onClick={handleLearnMore}
          className="px-6 py-2 rounded-full border border-zinc-300 dark:border-zinc-600 text-sm font-medium"
        >
          Learn more
        </button>
      </div>
    </div>
  );
}