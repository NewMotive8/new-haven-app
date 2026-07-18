import * as React from "react";

export type Theme = "light" | "dark";
const STORAGE_KEY = "incentiv8-theme";

function readInitial(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
}

function apply(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.setAttribute("data-theme", theme);
  document.body?.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
}

// Module-level subscribers so every mounted hook stays in sync.
const listeners = new Set<(t: Theme) => void>();
let current: Theme = "dark";

export function useTheme() {
  const [theme, setThemeState] = React.useState<Theme>(current);

  React.useEffect(() => {
    const initial = readInitial();
    current = initial;
    apply(initial);
    setThemeState(initial);
    const l = (t: Theme) => setThemeState(t);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const setTheme = React.useCallback((t: Theme) => {
    current = t;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, t);
    }
    apply(t);
    listeners.forEach((fn) => fn(t));
  }, []);

  const toggle = React.useCallback(() => {
    setTheme(current === "dark" ? "light" : "dark");
  }, [setTheme]);

  return { theme, setTheme, toggle };
}
