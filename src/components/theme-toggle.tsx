"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

export type ThemeToggleHandle = {
  toggle: () => void;
};

export const ThemeToggle = React.forwardRef<ThemeToggleHandle>((props, ref) => {
  const [theme, setThemeState] = React.useState<"theme-light" | "dark">("dark")

  React.useEffect(() => {
    const isDark = theme === "dark";
    document.documentElement.classList[isDark ? "add" : "remove"]("dark")
  }, [theme])

  const toggleTheme = () => {
    setThemeState(prevTheme => prevTheme === 'dark' ? 'theme-light' : 'dark');
  }

  React.useImperativeHandle(ref, () => ({
    toggle() {
      toggleTheme();
    }
  }));

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
});
ThemeToggle.displayName = "ThemeToggle";
