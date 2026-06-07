import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Theme, ThemeContextValue } from "../types";

const STORAGE_KEY = "shahada-theme";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const readInitialTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    console.warn("Could not read theme from localStorage");
  }

  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  const isDark = theme === "dark";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      console.warn("Could not save theme to localStorage");
    }
  }, [theme, isDark]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const handleOsChange = (e: MediaQueryListEvent) => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "dark" || stored === "light") return;
      } catch {
       console.warn("Could not read theme from localStorage");
      }

      setTheme(e.matches ? "dark" : "light");
    };

    mq.addEventListener("change", handleOsChange);
    return () => mq.removeEventListener("change", handleOsChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }, []);

  const value: ThemeContextValue = {
    theme,
    toggleTheme,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);

  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return ctx;
};