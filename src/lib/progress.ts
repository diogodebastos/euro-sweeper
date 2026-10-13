import { countries } from '@/lib/countries';

export const CLASSIC_AT = 5;
export const FLAGS_AT = 10;
export const EUROPE_AT = Object.keys(countries).length;
export const HARD_MINES_FACTOR = 1.25;

export interface Progress {
  // Countries cleared on the current tour of Europe.
  beaten: string[];
  // Every country ever cleared. Unlocks and the map are based on this.
  cleared: string[];
  current: string;
  classic: boolean;
  flags: boolean;
  hard: boolean;
}

export const NEW_PROGRESS: Progress = {
  beaten: [],
  cleared: [],
  current: 'portugal',
  classic: false,
  flags: false,
  hard: false,
};

const KEY = 'eurosweeper:progress';

export function loadProgress(): Progress {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (!saved) return NEW_PROGRESS;
    const known = (keys: unknown) =>
      Array.isArray(keys) ? keys.filter((k): k is string => typeof k === 'string' && k in countries) : [];
    return {
      ...NEW_PROGRESS,
      ...saved,
      beaten: known(saved.beaten),
      cleared: known(saved.cleared),
      current: saved.current in countries ? saved.current : 'portugal',
    };
  } catch {
    return NEW_PROGRESS;
  }
}

export function saveProgress(progress: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Storage unavailable (private window, blocked site data): progress lasts this visit only.
  }
}

export function unlocks(cleared: string[]) {
  return {
    classic: cleared.length >= CLASSIC_AT,
    flags: cleared.length >= FLAGS_AT,
    europe: cleared.length >= EUROPE_AT,
  };
}

export function mineCount(countryKey: string, hard: boolean) {
  const { mines } = countries[countryKey];
  return hard ? Math.round(mines * HARD_MINES_FACTOR) : mines;
}
