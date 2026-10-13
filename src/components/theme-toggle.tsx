"use client"

import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { MENU_ICON, MENU_ICON_ITEM } from "@/components/mobile-bar"
import { isDarkTheme, toggleTheme } from "@/lib/theme"

export function ThemeToggle() {
  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Sun className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

// For the mobile menu; it renders when the menu opens, so the label is current.
export function ThemeMenuItem() {
  const dark = isDarkTheme();
  return (
    <DropdownMenuItem className={MENU_ICON_ITEM} onSelect={toggleTheme}>
      {dark ? <Sun className={MENU_ICON} /> : <Moon className={MENU_ICON} />}
      {dark ? 'Light theme' : 'Dark theme'}
    </DropdownMenuItem>
  );
}
