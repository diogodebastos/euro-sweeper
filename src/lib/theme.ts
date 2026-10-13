// localStorage key for the player's light/dark choice.
export const THEME_KEY = 'eurosweeper:theme';

// The <html> class is the single source of truth, so every theme control stays in sync.
export function isDarkTheme() {
  return document.documentElement.classList.contains('dark');
}

export function toggleTheme() {
  const dark = !isDarkTheme();
  document.documentElement.classList.toggle('dark', dark);
  try {
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  } catch {
    // Storage unavailable: the theme lasts this visit only.
  }
}
