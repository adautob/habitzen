
"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// 1. Fornecer um valor padrão inicial para o contexto.
// Isso garante que useContext(ThemeContext) nunca retorne undefined.
const initialContextValue: ThemeContextType = {
  theme: "system", // Um padrão seguro
  effectiveTheme: "light", // Um padrão seguro
  setTheme: () => {
    // Isso pode ser um no-op ou um aviso se chamado antes da montagem completa
    console.warn("ThemeProvider not fully initialized: setTheme called.");
  },
  toggleTheme: () => {
    console.warn("ThemeProvider not fully initialized: toggleTheme called.");
  },
};

// 2. Usar o valor padrão ao criar o contexto.
const ThemeContext = createContext<ThemeContextType>(initialContextValue);

export function ThemeProvider({ children, defaultTheme = "system", storageKey = "habitzen-theme" }: { children: ReactNode, defaultTheme?: Theme, storageKey?: string }) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  // Initialize effectiveTheme to a non-undefined value that matches initialContextValue.effectiveTheme
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">(initialContextValue.effectiveTheme);
  const [isMounted, setIsMounted] = useState(false);

  // Effect para configuração inicial no lado do cliente
  useEffect(() => {
    let storedThemeValue: Theme;
    try {
      storedThemeValue = (window.localStorage.getItem(storageKey) as Theme | null) || defaultTheme;
    } catch (e) {
      console.warn("Failed to read theme from localStorage during initial setup", e);
      storedThemeValue = defaultTheme;
    }
    setThemeState(storedThemeValue);

    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialEffective = storedThemeValue === "system"
      ? (systemPrefersDark ? "dark" : "light")
      : (storedThemeValue as "light" | "dark");

    setEffectiveTheme(initialEffective);

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(initialEffective);

    setIsMounted(true); // Sinaliza que a configuração do lado do cliente está completa
  }, [defaultTheme, storageKey]);


  // Effect para aplicar mudanças de tema e ouvir mudanças de preferência do sistema
  useEffect(() => {
    if (!isMounted) return; // Executar somente após a montagem e configuração inicial

    const root = window.document.documentElement;
    let newAppliedEffectiveTheme: "light" | "dark";

    if (theme === "system") {
      newAppliedEffectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      newAppliedEffectiveTheme = theme as "light" | "dark";
    }

    if (effectiveTheme !== newAppliedEffectiveTheme) {
      setEffectiveTheme(newAppliedEffectiveTheme);
    }
    
    root.classList.remove("light", "dark");
    root.classList.add(newAppliedEffectiveTheme);

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        const systemEffectiveThemeUpdate = mediaQuery.matches ? "dark" : "light";
        root.classList.remove("light", "dark");
        root.classList.add(systemEffectiveThemeUpdate);
        setEffectiveTheme(systemEffectiveThemeUpdate); // Atualiza o estado para refletir a mudança
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme, effectiveTheme, isMounted]);


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

  // O ThemeProvider SEMPRE renderiza o componente Provider.
  // Seus filhos são renderizados condicionalmente após a montagem.
  return (
    <ThemeContext.Provider value={contextValue}>
      {isMounted ? children : null}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  // Como ThemeContext agora é criado com initialContextValue,
  // 'context' nunca deve ser undefined aqui se o useTheme for chamado
  // dentro de uma árvore com ThemeProvider.
  // A verificação original "if (context === undefined)" era para o caso de
  // createContext ser chamado sem um valor padrão (ou com undefined explicitamente).
  // Se, por algum motivo extremo, context ainda fosse o initialContextValue (semelhante a estar fora de um Provider),
  // as funções de placeholder em initialContextValue emitiriam avisos.
  // A throw new Error original indica que o useContext realmente retornou undefined.
  if (context === undefined) {
     // Este caso deve ser teoricamente impossível agora com createContext(initialContextValue)
     // e ThemeProvider sempre renderizando o Provider.
     // Manter o erro por segurança, mas a causa raiz deve ter sido o createContext(undefined).
    throw new Error("useTheme must be used within a ThemeProvider. This error should not occur if ThemeContext has a default value.");
  }
  return context;
};
