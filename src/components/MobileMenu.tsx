import { X, Menu } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { navLinks } from "../config/navLinks.ts";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // esc + scroll lock
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      closeButtonRef.current?.focus();
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        className="max-md:flex hidden h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full border border-ink text-ink transition hover:bg-ink/10 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <Menu size={18} aria-hidden="true" />
      </button>


      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <aside
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile menu"
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-white p-6 shadow-2xl transition-transform duration-300 dark:bg-zinc-900 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-10 flex items-center justify-between">
          <span className="text-lg font-bold text-zinc-900 dark:text-white">
            Menu
          </span>

          <button
            ref={closeButtonRef}
            onClick={closeMenu}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-ink text-ink transition hover:bg-ink/10 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Mobile navigation">
          <ul className="flex flex-col gap-6 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={closeMenu}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  );
}