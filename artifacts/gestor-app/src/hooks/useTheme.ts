import { useState, useEffect } from "react";

export type Theme = "dark" | "light";
const STORAGE_KEY = "gestor-theme";
const THEME_EVENT = "gestor-theme-change";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem(STORAGE_KEY) as Theme) ?? "dark";
  });

  // Ouvir mudanças disparadas por outras instâncias do hook
  useEffect(() => {
    function handler(e: Event) {
      setThemeState((e as CustomEvent<Theme>).detail);
    }
    window.addEventListener(THEME_EVENT, handler);
    return () => window.removeEventListener(THEME_EVENT, handler);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("light", next === "light");
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
    window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: next }));
  }

  return { theme, toggle, isDark: theme === "dark" };
}
