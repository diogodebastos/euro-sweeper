"use client";

import { useEffect, useMemo, useState } from 'react';
import { countries } from '@/lib/countries';
import { flagColor } from '@/lib/flags';
import { CLASSIC_AT, EUROPE_AT, FLAGS_AT, loadProgress } from '@/lib/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const GOLDS = ['#D4AF37', '#E8C547', '#C49A2C'];

const MILESTONES = [
  { at: CLASSIC_AT, label: 'Classic theme' },
  { at: FLAGS_AT, label: 'Flag tiles' },
  { at: EUROPE_AT, label: 'Gold map, Hard mode and travel anywhere' },
];

interface Cell {
  key: string;
  row: number;
  col: number;
  color: string;
}

export default function EuropeMap() {
  const [cleared, setCleared] = useState<string[] | null>(null);
  const [showGold, setShowGold] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    setCleared(loadProgress().cleared);
  }, []);

  const isGold = cleared !== null && cleared.length >= EUROPE_AT && showGold;

  const { cells, width, height } = useMemo(() => {
    const entries = Object.entries(countries);
    const top = Math.min(...entries.map(([, c]) => c.position[0]));
    const left = Math.min(...entries.map(([, c]) => c.position[1]));
    const done = new Set(cleared ?? []);
    // Neighbouring boards share their border cells: draw cleared countries over
    // uncleared ones, and small countries over big ones so they don't vanish.
    const size = (shape: number[][]) => shape.flat().filter(Boolean).length;
    const order = [...entries].sort(([a, ca], [b, cb]) =>
      Number(done.has(a)) - Number(done.has(b)) || size(cb.shape) - size(ca.shape));
    const cells: Cell[] = [];
    let width = 0, height = 0;
    order.forEach(([key, country]) => {
      const rows = country.shape.length, cols = country.shape[0].length;
      const gold = GOLDS[entries.findIndex(([k]) => k === key) % GOLDS.length];
      country.shape.forEach((line, r) => line.forEach((cell, c) => {
        if (!cell) return;
        const row = country.position[0] - top + r, col = country.position[1] - left + c;
        width = Math.max(width, col + 1);
        height = Math.max(height, row + 1);
        const color = isGold ? gold : done.has(key) ? flagColor(key, r, c, rows, cols) ?? '#3498db' : 'hsl(var(--muted))';
        cells.push({ key, row, col, color });
      }));
    });
    return { cells, width, height };
  }, [cleared, isGold]);

  const count = cleared?.length ?? 0;
  const next = MILESTONES.find(m => count < m.at);

  return (
    <div className="flex flex-col gap-4">
      <div className="p-4 bg-card rounded-lg shadow-md border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">
            Your Europe: <span className="text-foreground">{count} / {EUROPE_AT}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            {cleared === null
              ? 'Loading your progress...'
              : next
                ? `${next.at - count} more ${next.at - count === 1 ? 'country' : 'countries'} to unlock: ${next.label}.`
                : 'Every country swept. Europe is yours.'}
          </p>
        </div>
        {count >= EUROPE_AT && (
          <Button variant="outline" onClick={() => setShowGold(prev => !prev)}>
            {showGold ? 'Show flags' : 'Show gold'}
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

      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {MILESTONES.map(m => (
          <li
            key={m.at}
            className={cn(
              'p-3 rounded-lg border bg-card text-sm',
              count >= m.at ? 'border-primary text-foreground' : 'text-muted-foreground'
            )}
          >
            <span className="font-bold">{m.at} countries</span>
            <br />
            {count >= m.at ? 'Unlocked: ' : 'Locked: '}{m.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
