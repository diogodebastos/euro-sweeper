
"use client";

import { Bomb, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tile as TileType } from '@/lib/game';

interface TileProps extends TileType {
  onClick: () => void;
}

const numberColors = [
  'text-primary', // 1
  'text-green-600', // 2
  'text-red-600', // 3
  'text-purple-700', // 4
  'text-maroon-700', // 5
  'text-teal-600', // 6
  'text-black', // 7
  'text-gray-500', // 8
];

export default function Tile({ isVisible, isRevealed, isMine, isFlagged, adjacentMines, onClick }: TileProps) {
  if (!isVisible) {
    return <div className="aspect-square invisible" />;
  }

  const renderContent = () => {
    if (isFlagged) {
      return <Flag className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />;
    }
    if (isRevealed) {
      if (isMine) {
        return <Bomb className="w-4 h-4 sm:w-5 sm:h-5 text-white" />;
      }
      if (adjacentMines > 0) {
        return <span className={cn('font-bold text-lg', numberColors[adjacentMines - 1])}>{adjacentMines}</span>;
      }
    }
    return null;
  };

  return (
    <button
      onClick={onClick}
      disabled={isRevealed && isFlagged}
      className={cn(
        'aspect-square flex items-center justify-center rounded-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:z-10',
        {
          'bg-secondary hover:bg-muted cursor-pointer': !isRevealed,
          'bg-background border border-muted': isRevealed && !isMine && !isFlagged,
          'bg-destructive': isRevealed && isMine,
          'cursor-pointer': isRevealed && !isFlagged, // Allow clicking on revealed numbers
          'cursor-default': isRevealed && isFlagged,
        }
      )}
      aria-label={`Tile at row, col. Status: ${isRevealed ? 'Revealed' : 'Hidden'}`}
    >
      {renderContent()}
    </button>
  );
}
