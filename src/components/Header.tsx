import { useTheme } from "../context/ThemeContext";
import type { HeaderProps } from "../types";
import { MobileMenu } from "./MobileMenu";
import { Sun, Moon } from "lucide-react";

/**
 * nav links (desktop + mobile)
 */
const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
  { href: "#donate", label: "Donate" },
] as const;

/**
 * app header (logo + nav + theme + mobile menu)
 */
export function Header({ className = "" }: HeaderProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className={className}>
      <nav
        className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        {/* brand */}
        <a
          href="#home"
          className="text-lg font-bold text-zinc-900 dark:text-white sm:text-xl"
          aria-label="Shahada App - Home"
        >
          SHAHADA
        </a>

        {/* desktop nav */}
        <ul className="hidden items-center gap-12 text-sm font-semibold uppercase tracking-wide text-ink dark:text-white md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="transition hover:text-zinc-900 dark:hover:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          {/* theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Light mode" : "Dark mode"}
            aria-pressed={isDark}
            className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full border border-ink text-ink transition hover:bg-ink/10 active:bg-ink/15 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {isDark ? (
              <Sun size={18} aria-hidden="true" />
            ) : (
              <Moon size={18} aria-hidden="true" />
            )}
          </button>

          {/* mobile menu */}
          <MobileMenu />
        </div>
      </nav>
    </header>
  );
}