
"use client";

import type { Board } from '@/lib/game';
import Tile from '@/components/tile';
import { Skeleton } from '@/components/ui/skeleton';
import { countries } from '@/lib/countries';

interface GameBoardProps {
  board: Board;
  onTileClick: (row: number, col: number) => void;
}

const PortugalSkeleton = () => {
  const portugalShape = countries.portugal.shape;
  const rows = portugalShape.length;
  const cols = portugalShape[0].length;
  const gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

  return (
    <div className="p-2 md:p-4 bg-card rounded-lg shadow-lg border w-full overflow-auto">
      <div 
        className="grid gap-1 mx-auto"
        style={{ 
          gridTemplateColumns,
          maxWidth: `${cols * 2.5}rem`,
        }}
      >
        {portugalShape.map((row, rowIndex) =>
          row.map((cell, colIndex) =>
            cell === 1 ? (
              <Skeleton key={`${rowIndex}-${colIndex}`} className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-sm" />
            ) : (
              <div key={`${rowIndex}-${colIndex}`} className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 invisible" />
            )
          )
        )}
      </div>
    </div>
  );
};


export default function GameBoard({ board, onTileClick }: GameBoardProps) {
  if (!board.length) {
    return <PortugalSkeleton />;
  }

  const gridTemplateColumns = `repeat(${board[0].length}, minmax(0, 1fr))`;

  return (
    <div className="p-2 md:p-4 bg-card rounded-lg shadow-lg border w-full overflow-auto">
      <div 
        className="grid gap-1 mx-auto"
        style={{ 
          gridTemplateColumns,
          maxWidth: `${board[0].length * 2.5}rem`,
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((tile, colIndex) => (
            <Tile
              key={`${rowIndex}-${colIndex}`}
              {...tile}
              onClick={() => onTileClick(rowIndex, colIndex)}
            />
          ))
        )}
      </div>
    </div>
  );
}
