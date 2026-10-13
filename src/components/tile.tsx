
"use client";

import { memo } from 'react';
import { Bomb, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tile as TileType } from '@/lib/game';

interface TileProps extends TileType {
  row: number;
  col: number;
  // Stable across renders, so memo only redraws tiles that changed.
  onClick: (row: number, col: number) => void;
  isClassicMode: boolean;
  flagColor?: string;
  compact?: boolean;
  title?: string;
}

// Each number has a lighter shade for the dark theme, so 4, 5 and 7 stay readable.
const numberColors = [
  'text-blue-600 dark:text-blue-400',      // 1
  'text-green-700 dark:text-green-500',    // 2
  'text-red-600 dark:text-red-500',        // 3
  'text-blue-900 dark:text-indigo-300',    // 4
  'text-red-900 dark:text-rose-300',       // 5
  'text-teal-600 dark:text-teal-400',      // 6
  'text-black dark:text-slate-100',        // 7
  'text-gray-500 dark:text-gray-400',      // 8
];

const classicNumberColors = [
  'text-blue-700',      // 1
  'text-green-800',     // 2
  'text-red-700',       // 3
  'text-purple-900',    // 4
  'text-red-900',       // 5
  'text-cyan-700',      // 6
  'text-black',         // 7
  'text-gray-600',      // 8
];

function Tile({ isVisible, isRevealed, isMine, isFlagged, adjacentMines, row, col, onClick, isClassicMode, flagColor, compact, title }: TileProps) {
  if (!isVisible) {
    return <div className={cn("aspect-square invisible", compact && "w-6 h-6")} />;
  }

  const showFlag = !!flagColor && isRevealed && !isMine && !isFlagged;

  const iconSize = compact ? "w-3.5 h-3.5" : "w-4 h-4 sm:w-5 sm:h-5";
  const textSize = compact ? "text-sm" : "text-lg";

  const renderContent = () => {
    if (isFlagged) {
      return <Flag className={cn(iconSize, "text-destructive")} />;
    }
    if (isRevealed) {
      if (isMine) {
        return <Bomb className={cn(iconSize, isClassicMode ? "text-black" : "text-white")} />;
      }
      if (adjacentMines > 0) {
        if (showFlag) {
          return <span className={cn('font-bold flag-number', textSize)}>{adjacentMines}</span>;
        }
        const colors = isClassicMode ? classicNumberColors : numberColors;
        return <span className={cn('font-bold', textSize, colors[adjacentMines - 1])}>{adjacentMines}</span>;
      }
    }
    return null;
  };

  const modernClasses = {
    'bg-tile-hidden hover:bg-tile-hover cursor-pointer shadow-[var(--tile-highlight)]': !isRevealed,
    'bg-tile-revealed border border-tile-border': isRevealed && !isMine && !isFlagged,
    'bg-destructive': isRevealed && isMine,
    'cursor-pointer': !isRevealed || (isRevealed && !isFlagged),
    'cursor-default': isRevealed && isFlagged,
    'rounded-sm': true,
  };

  const classicClasses = {
    'tile-classic-hidden': !isRevealed,
    'tile-classic-revealed': isRevealed && !isMine,
     'bg-red-500': isRevealed && isMine,
  };

  return (
    <button
      onClick={() => onClick(row, col)}
      disabled={isRevealed && isFlagged}
      className={cn(
        compact ? 'w-6 h-6' : 'w-8 h-8 sm:w-10 sm:h-10',
        'flex items-center justify-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:z-10',
        isClassicMode ? classicClasses : modernClasses
      )}
      style={showFlag ? { backgroundColor: flagColor, borderColor: 'rgba(0, 0, 0, 0.25)' } : undefined}
      title={title}
      aria-label={`Tile at row ${row + 1}, column ${col + 1}. Status: ${isRevealed ? 'Revealed' : 'Hidden'}`}
    >
      {renderContent()}
    </button>
  );
}

export default memo(Tile);
