
"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, defaultTheme = "system", storageKey = "habitzen-theme" }: { children: ReactNode, defaultTheme?: Theme, storageKey?: string }) {
  const [isMounted, setIsMounted] = useState(false);

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

  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">(() => {
    // Determine initial effective theme, respecting SSR and client capabilities
    let initialEffective: "light" | "dark";
    if (theme === "system") {
      if (typeof window !== 'undefined') {
        initialEffective = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } else {
        initialEffective = "light"; // SSR default for system theme
      }
    } else {
      initialEffective = theme as "light" | "dark";
    }
    return initialEffective;
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const applyTheme = useCallback((selectedTheme: Theme) => {
    let currentTheme: "light" | "dark";
    if (selectedTheme === "system") {
      if (typeof window !== 'undefined') {
        currentTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } else {
        currentTheme = 'light'; // Default for SSR if window is not available
      }
    } else {
      currentTheme = selectedTheme;
    }

    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(currentTheme);
    }
    setEffectiveTheme(currentTheme);
  }, []);


  useEffect(() => {
    if (isMounted) {
      applyTheme(theme);

      if (theme === "system" && typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
          applyTheme("system");
        };
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
      }
    }
  }, [theme, applyTheme, isMounted]);


  const setThemeCallback = useCallback((newTheme: Theme) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(storageKey, newTheme);
      } catch (e) {
         console.warn("Failed to save theme to localStorage", e);
      }
    }
    setThemeState(newTheme);
  }, [storageKey]);

  const toggleThemeCallback = useCallback(() => {
    setThemeCallback(effectiveTheme === 'dark' ? 'light' : 'dark');
  }, [effectiveTheme, setThemeCallback]);

  const contextValue = useMemo(() => ({
    theme,
    effectiveTheme,
    setTheme: setThemeCallback,
    toggleTheme: toggleThemeCallback
  }), [theme, effectiveTheme, setThemeCallback, toggleThemeCallback]);

  if (!isMounted) {
    // Render nothing or a fallback on the server and before client-side mount
    // This prevents children from accessing context before it's fully initialized client-side
    return null;
  }

  return (
    <ThemeContext.Provider value={contextValue}>
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
