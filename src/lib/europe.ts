import { countries } from '@/lib/countries';
import { flagColor } from '@/lib/flags';

// Every board placed at its position on one shared grid: the Europe map and the
// final boss board.

export interface EuropeCell {
  key: string;
  // The country's flag colour at this cell, as on its own board.
  flag: string;
}

const entries = Object.entries(countries);
const top = Math.min(...entries.map(([, c]) => c.position[0]));
const left = Math.min(...entries.map(([, c]) => c.position[1]));
export const EUROPE_ROWS = Math.max(...entries.map(([, c]) => c.position[0] - top + c.shape.length));
export const EUROPE_COLS = Math.max(...entries.map(([, c]) => c.position[1] - left + c.shape[0].length));

const landCells = (key: string) => countries[key].shape.flat().filter(Boolean).length;

// Small countries first, so ordering by this keeps them visible where boards overlap.
export const BY_SIZE = entries.map(([key]) => key).sort((a, b) => landCells(a) - landCells(b));

// Neighbouring boards share their border cells; earlier countries in `priority` win them.
export function europeGrid(priority: string[] = BY_SIZE): (EuropeCell | null)[][] {
  const grid: (EuropeCell | null)[][] = Array.from({ length: EUROPE_ROWS }, () => Array(EUROPE_COLS).fill(null));
  [...priority].reverse().forEach(key => {
    const { shape, position } = countries[key];
    const rows = shape.length, cols = shape[0].length;
    shape.forEach((line, r) => line.forEach((cell, c) => {
      if (cell) {
        grid[position[0] - top + r][position[1] - left + c] = { key, flag: flagColor(key, r, c, rows, cols) ?? '#3498db' };
      }
    }));
  });
  return grid;
}

// Same mine density as the country boards put together.
export function europeMines(cellCount: number) {
  const mines = entries.reduce((sum, [, c]) => sum + c.mines, 0);
  const cells = entries.reduce((sum, [key]) => sum + landCells(key), 0);
  return Math.round(cellCount * mines / cells);
}
