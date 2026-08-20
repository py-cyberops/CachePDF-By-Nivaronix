import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

interface ThemeContextType {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    if (!switchable) return defaultTheme;
    const stored = localStorage.getItem("cachepdf-theme-preference") as ThemePreference | null;
    const legacy = localStorage.getItem("theme") as Theme | null;
    return stored === "light" || stored === "dark" || stored === "system" ? stored : legacy || defaultTheme;
  });
  const [systemTheme, setSystemTheme] = useState<Theme>(() => window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const theme = useMemo<Theme>(() => preference === "system" ? systemTheme : preference, [preference, systemTheme]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemTheme(query.matches ? "dark" : "light");
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("theme-light");
    } else {
      root.classList.remove("dark");
      root.classList.add("theme-light");
    }

    if (switchable) {
      localStorage.setItem("cachepdf-theme-preference", preference);
      localStorage.setItem("theme", theme);
    }
  }, [theme, preference, switchable]);

  const setPreference = (nextPreference: ThemePreference) => setPreferenceState(nextPreference);

  const toggleTheme = switchable
    ? () => {
        setPreferenceState(theme === "light" ? "dark" : "light");
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
