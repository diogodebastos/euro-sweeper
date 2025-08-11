
"use client";

import { Bomb, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tile as TileType } from '@/lib/game';

interface TileProps extends TileType {
  onClick: () => void;
  isClassicMode: boolean;
}

const numberColors = [
  'text-blue-600',   // 1
  'text-green-700',  // 2
  'text-red-600',    // 3
  'text-blue-900', // 4
  'text-red-900',  // 5
  'text-teal-600',   // 6
  'text-black',      // 7
  'text-gray-500',   // 8
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

export default function Tile({ isVisible, isRevealed, isMine, isFlagged, adjacentMines, onClick, isClassicMode }: TileProps) {
  if (!isVisible) {
    return <div className="aspect-square invisible" />;
  }

  const renderContent = () => {
    if (isFlagged) {
      return <Flag className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />;
    }
    if (isRevealed) {
      if (isMine) {
        return <Bomb className={cn("w-4 h-4 sm:w-5 sm:h-5", isClassicMode ? "text-black" : "text-white")} />;
      }
      if (adjacentMines > 0) {
        const colors = isClassicMode ? classicNumberColors : numberColors;
        return <span className={cn('font-bold text-lg', colors[adjacentMines - 1])}>{adjacentMines}</span>;
      }
    }
    return null;
  };

  const modernClasses = {
    'bg-secondary hover:bg-muted cursor-pointer': !isRevealed,
    'bg-background border border-muted': isRevealed && !isMine && !isFlagged,
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
      onClick={onClick}
      disabled={isRevealed && isFlagged}
      className={cn(
        'w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:z-10',
        isClassicMode ? classicClasses : modernClasses
      )}
      aria-label={`Tile at row, col. Status: ${isRevealed ? 'Revealed' : 'Hidden'}`}
    >
      {renderContent()}
    </button>
  );
}
