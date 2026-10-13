"use client";

import { useEffect, useMemo, useState } from 'react';
import { countries } from '@/lib/countries';
import { BY_SIZE, EUROPE_COLS, EUROPE_ROWS, europeGrid } from '@/lib/europe';
import { CLASSIC_AT, EUROPE_AT, FLAGS_AT, loadProgress } from '@/lib/progress';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const GOLDS = ['#D4AF37', '#E8C547', '#C49A2C'];

const MILESTONES = [
  { goal: `${CLASSIC_AT} countries`, label: 'Classic theme', done: (count: number) => count >= CLASSIC_AT },
  { goal: `${FLAGS_AT} countries`, label: 'Flag tiles', done: (count: number) => count >= FLAGS_AT },
  { goal: `${EUROPE_AT} countries`, label: 'The final boss', done: (count: number) => count >= EUROPE_AT },
  { goal: 'Final boss', label: 'Gold map, Hard mode and travel anywhere', done: (_: number, boss: boolean) => boss },
];

interface Cell {
  key: string;
  row: number;
  col: number;
  color: string;
}

export default function EuropeMap() {
  const [cleared, setCleared] = useState<string[] | null>(null);
  const [bossBeaten, setBossBeaten] = useState(false);
  const [showGold, setShowGold] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const progress = loadProgress();
    setCleared(progress.cleared);
    setBossBeaten(progress.bossBeaten);
  }, []);

  const isGold = bossBeaten && showGold;

  const { cells, width, height } = useMemo(() => {
    const done = new Set(cleared ?? []);
    // Cleared countries win shared border cells, then smaller countries.
    const grid = europeGrid([...BY_SIZE].sort((a, b) => Number(done.has(b)) - Number(done.has(a))));
    const goldOf = Object.fromEntries(Object.keys(countries).map((key, i) => [key, GOLDS[i % GOLDS.length]]));
    const cells: Cell[] = [];
    grid.forEach((line, row) => line.forEach((cell, col) => {
      if (!cell) return;
      const color = isGold ? goldOf[cell.key] : done.has(cell.key) ? cell.flag : 'hsl(var(--muted))';
      cells.push({ key: cell.key, row, col, color });
    }));
    return { cells, width: EUROPE_COLS, height: EUROPE_ROWS };
  }, [cleared, isGold]);

  const count = cleared?.length ?? 0;
  const remaining = EUROPE_AT - count;
  const status = cleared === null
    ? 'Loading your progress...'
    : remaining > 0
      ? `${remaining} more ${remaining === 1 ? 'country' : 'countries'} to sweep. ${MILESTONES.find(m => !m.done(count, bossBeaten))?.label} is next.`
      : bossBeaten
        ? 'Every country swept and the final boss beaten. Europe is yours.'
        : 'Every country swept. The final boss awaits.';

  return (
    <div className="flex flex-col gap-4">
      <div className="p-4 bg-card rounded-lg shadow-md border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">
            Your Europe: <span className="text-foreground">{count} / {EUROPE_AT}</span>
          </h1>
          <p className="text-muted-foreground mt-1">{status}</p>
        </div>
        {bossBeaten ? (
          <Button variant="outline" onClick={() => setShowGold(prev => !prev)}>
            {showGold ? 'Show flags' : 'Show gold'}
          </Button>
        ) : count >= EUROPE_AT && (
          <Button asChild>
            <Link href="/europe">Face the final boss</Link>
          </Button>
        )}
      </div>

      <div className={cn('p-2 md:p-4 bg-card rounded-lg shadow-lg border', isGold && 'gold-map')}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          role="img"
          aria-label={`Map of the ${Object.keys(countries).length} EuroSweeper countries, ${count} swept`}
          onMouseLeave={() => setHovered(null)}
        >
          {cells.map(({ key, row, col, color }) => (
            <rect
              key={`${key}-${row}-${col}`}
              x={col + 0.06}
              y={row + 0.06}
              width={0.88}
              height={0.88}
              rx={0.12}
              fill={color}
              opacity={hovered && hovered !== key ? 0.55 : 1}
              onMouseEnter={() => setHovered(key)}
            >
              <title>{countries[key].name}</title>
            </rect>
          ))}
        </svg>
        <p className="text-center text-sm text-muted-foreground h-5">{hovered ? countries[hovered].name : ''}</p>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {MILESTONES.map(m => {
          const done = m.done(count, bossBeaten);
          return (
            <li
              key={m.goal}
              className={cn(
                'p-3 rounded-lg border bg-card text-sm',
                done ? 'border-primary text-foreground' : 'text-muted-foreground'
              )}
            >
              <span className="font-bold">{m.goal}</span>
              <br />
              {done ? 'Unlocked: ' : 'Locked: '}{m.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
