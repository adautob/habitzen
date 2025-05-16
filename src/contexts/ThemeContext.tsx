
"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, defaultTheme = "system", storageKey = "habitzen-theme" }: { children: ReactNode, defaultTheme?: Theme, storageKey?: string }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    try {
      const storedTheme = window.localStorage.getItem(storageKey) as Theme | null;
      return storedTheme || defaultTheme;
    } catch (e) {
      console.warn("Failed to read theme from localStorage", e);
      return defaultTheme;
    }
  });

  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">("light");

  const applyTheme = useCallback((selectedTheme: Theme) => {
    let currentTheme: "light" | "dark";
    if (selectedTheme === "system") {
      currentTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      currentTheme = selectedTheme;
    }

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(currentTheme);
    setEffectiveTheme(currentTheme);
  }, []);


  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, applyTheme]);


  const setTheme = (newTheme: Theme) => {
    try {
      window.localStorage.setItem(storageKey, newTheme);
    } catch (e) {
       console.warn("Failed to save theme to localStorage", e);
    }
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
