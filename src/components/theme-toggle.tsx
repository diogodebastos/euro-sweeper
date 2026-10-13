"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { THEME_KEY } from "@/lib/theme"

export type ThemeToggleHandle = {
  toggle: () => void;
};

export const ThemeToggle = React.forwardRef<ThemeToggleHandle>((props, ref) => {
  const [theme, setThemeState] = React.useState<"light" | "dark">("dark")

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setThemeState(isDark ? "dark" : "light");
  }, [])

  const toggleTheme = () => {
    setThemeState(prevTheme => {
      const newTheme = prevTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle("dark", newTheme === 'dark');
      try {
        localStorage.setItem(THEME_KEY, newTheme);
      } catch {
        // Storage unavailable: the theme lasts this visit only.
      }
      return newTheme;
    });
  }

  React.useImperativeHandle(ref, () => ({
    toggle() {
      toggleTheme();
    }
  }));

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Sun className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
});
ThemeToggle.displayName = "ThemeToggle";
