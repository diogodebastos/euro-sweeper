import { countries } from '@/lib/countries';

export const CLASSIC_AT = 5;
export const FLAGS_AT = 10;
export const EUROPE_AT = Object.keys(countries).length;
export const HARD_MINES_FACTOR = 1.25;
export const BOSS_LIVES = 3;

export interface Progress {
  // Countries cleared on the current tour of Europe.
  beaten: string[];
  // Every country ever cleared. Unlocks and the map are based on this.
  cleared: string[];
  current: string;
  classic: boolean;
  flags: boolean;
  hard: boolean;
  bossBeaten: boolean;
}

export const NEW_PROGRESS: Progress = {
  beaten: [],
  cleared: [],
  current: 'portugal',
  classic: false,
  flags: false,
  hard: false,
  bossBeaten: false,
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

export function unlocks(cleared: string[], bossBeaten: boolean) {
  return {
    classic: cleared.length >= CLASSIC_AT,
    flags: cleared.length >= FLAGS_AT,
    boss: cleared.length >= EUROPE_AT,
    // Beating the final boss: gold map, Hard mode and travel anywhere.
    champion: bossBeaten,
  };
}

export function mineCount(countryKey: string, hard: boolean) {
  const { mines } = countries[countryKey];
  return hard ? Math.round(mines * HARD_MINES_FACTOR) : mines;
}

// A final boss run in progress, so a refresh or a closed tab doesn't lose it.
// Cells are stored as row * cols + col.
export interface BossRun {
  mines: number[];
  revealed: number[];
  flagged: number[];
  lives: number;
}

const BOSS_KEY = 'eurosweeper:boss';

export function loadBossRun(): BossRun | null {
  try {
    const run = JSON.parse(localStorage.getItem(BOSS_KEY) ?? 'null');
    const isList = (v: unknown) => Array.isArray(v) && v.every(n => Number.isInteger(n));
    if (!run || !isList(run.mines) || !isList(run.revealed) || !isList(run.flagged) || !(run.lives > 0)) return null;
    return run;
  } catch {
    return null;
  }
}

export function saveBossRun(run: BossRun | null) {
  try {
    if (run) localStorage.setItem(BOSS_KEY, JSON.stringify(run));
    else localStorage.removeItem(BOSS_KEY);
  } catch {
    // Storage unavailable: the run lasts this visit only.
  }
}
