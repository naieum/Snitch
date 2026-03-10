import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Theme = "midnight" | "cream";

const STORAGE_KEY = "snitchmcp-theme";

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: "midnight",
  setTheme: () => {},
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("midnight");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "midnight" || stored === "cream") {
      setThemeState(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    document.documentElement.setAttribute("data-theme", t);
  }

  function toggle() {
    setTheme(theme === "midnight" ? "cream" : "midnight");
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="relative flex h-7 w-12 items-center rounded-full p-0.5 transition-colors duration-200"
      style={{ backgroundColor: theme === "midnight" ? "var(--bg-raised)" : "var(--accent)" }}
      title={`Switch to ${theme === "midnight" ? "cream" : "midnight"} theme`}
    >
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-200 text-xs"
        style={{
          backgroundColor: theme === "midnight" ? "var(--text-primary)" : "var(--bg-surface)",
          transform: theme === "cream" ? "translateX(18px)" : "translateX(0)",
        }}
      >
        {theme === "midnight" ? "\u263E" : "\u2600"}
      </span>
    </button>
  );
}
