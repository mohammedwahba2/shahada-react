import type { ButtonProps } from "../types";
import { BookText } from "lucide-react";

/**
 * Button styles per variant.
 */
const variantClasses: Record<ButtonProps["variant"], string> = {
  start:
    "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500/40 dark:bg-blue-500 dark:hover:bg-blue-400",
  stop:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500/40 dark:bg-red-500 dark:hover:bg-red-400",
  certificate:
    "min-w-[220px] gap-2 bg-zinc-900 text-white hover:bg-zinc-800 focus-visible:ring-zinc-500/40 dark:bg-zinc-950 dark:hover:bg-zinc-900",
  learnMore:
    "min-w-[220px] border-2 border-zinc-900 bg-white text-zinc-900 hover:bg-zinc-50 focus-visible:ring-zinc-400/40 dark:border-zinc-100 dark:bg-transparent dark:text-zinc-100 dark:hover:bg-zinc-900/40",
};

/**
 * Fallback accessible labels when no text children are provided.
 */
const variantLabels: Record<ButtonProps["variant"], string> = {
  start: "Start recording",
  stop: "Stop recording",
  certificate: "Generate certificate",
  learnMore: "Learn more",
};

function CertificateIcon() {
  return <BookText size={20} className="shrink-0" aria-hidden="true" />;
}

/**
 * Reusable button with variants and accessibility defaults.
 * aria-label falls back to variantLabels only when children are absent.
 */
export function Button({
  variant,
  onClick,
  children,
  disabled,
  type = "button",
}: ButtonProps) {
  const isCertificate = variant === "certificate";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={children ? undefined : variantLabels[variant]}
      className={[
        "inline-flex min-h-[48px] items-center justify-center rounded-full px-7 py-3",
        "text-sm font-semibold shadow-sm transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "dark:focus-visible:ring-offset-zinc-950",
        variantClasses[variant],
      ].join(" ")}
    >
      {isCertificate && <CertificateIcon />}
      {children}
    </button>
  );
}