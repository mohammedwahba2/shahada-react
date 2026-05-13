interface IntroFlowProps {
  onStart: () => void;
}

export function IntroFlow({ onStart }: IntroFlowProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="max-w-sm text-md font-medium text-ink dark:text-white">
        هل أنت مستعد لنطق الشهادة؟
      </p>

      <div className="flex gap-3">
        <button
          onClick={onStart}
          className="px-6 py-2 rounded-full bg-ink text-white dark:bg-white dark:text-ink text-sm font-medium"
        >
          نعم، أنا مستعد
        </button>

        <button
          onClick={onStart}
          className="px-6 py-2 rounded-full border border-zinc-300 dark:border-zinc-600 text-sm font-medium"
        >
          تعلم المزيد
        </button>
      </div>
    </div>
  );
}