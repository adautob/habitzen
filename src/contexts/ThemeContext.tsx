
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
  const [theme, setThemeState] = useState<Theme>(defaultTheme); // Initialize with default, localStorage/system preference read in useEffect
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">("light"); // Safe default, updated after mount

  // Effect to handle initial theme setup on client mount
  useEffect(() => {
    let initialStoredTheme: Theme;
    try {
      initialStoredTheme = (window.localStorage.getItem(storageKey) as Theme | null) || defaultTheme;
    } catch (e) {
      console.warn("Failed to read theme from localStorage during initial setup", e);
      initialStoredTheme = defaultTheme;
    }
    setThemeState(initialStoredTheme); // Set the theme based on localStorage or default

    let initialEffective: "light" | "dark";
    if (initialStoredTheme === "system") {
      initialEffective = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      initialEffective = initialStoredTheme as "light" | "dark";
    }

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(initialEffective);
    setEffectiveTheme(initialEffective); // Set the determined effective theme

    setIsMounted(true); // Signal that client-side setup is complete
  }, [defaultTheme, storageKey]);

  // Effect to apply theme changes and listen for system preference changes
  useEffect(() => {
    if (!isMounted) return; // Only run after initial mount and setup

    let currentAppliedTheme: "light" | "dark";
    if (theme === "system") {
      currentAppliedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      currentAppliedTheme = theme as "light" | "dark";
    }

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(currentAppliedTheme);
    // Also update effectiveTheme state if it changed due to system preference for 'system' theme
    if (theme === "system" && effectiveTheme !== currentAppliedTheme) {
        setEffectiveTheme(currentAppliedTheme);
    }


    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        const newSystemEffectiveTheme = mediaQuery.matches ? "dark" : "light";
        root.classList.remove("light", "dark");
        root.classList.add(newSystemEffectiveTheme);
        setEffectiveTheme(newSystemEffectiveTheme); // Update state to reflect change
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme, isMounted, effectiveTheme]); // Added effectiveTheme to dependencies for the check


  const setThemeCallback = useCallback((newTheme: Theme) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(storageKey, newTheme);
      } catch (e) {
         console.warn("Failed to save theme to localStorage", e);
      }
    }
    setThemeState(newTheme); // This will trigger the useEffect above to apply the theme
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
    // Return null on SSR and before client-side mount & theme initialization is complete.
    // This prevents children from rendering and calling useTheme prematurely.
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
    // This error should ideally not be hit if the `if (!isMounted) return null;` guard
    // in ThemeProvider works as expected and RootLayout places AppHeader correctly.
    throw new Error("useTheme must be used within a ThemeProvider. Check component hierarchy, conditional rendering, and ensure ThemeProvider has mounted.");
  }
  return context;
};
