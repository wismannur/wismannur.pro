"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ColorScheme = "blue" | "purple" | "green" | "orange" | "red";
export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  setTheme: (theme: Theme) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>("blue");

  const setTheme = () => {
    // Pure Dark mode locked for public experience
  };

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("colorScheme", scheme);
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light");
    root.classList.add("dark");
    root.setAttribute("data-color-scheme", colorScheme);
  }, [colorScheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme: "dark",
        colorScheme,
        setTheme,
        setColorScheme,
        isDark: true,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return {
      theme: "dark",
      colorScheme: "blue",
      setTheme: () => {},
      setColorScheme: () => {},
      isDark: true,
    };
  }
  return context;
};
