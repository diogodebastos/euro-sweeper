"use client";

import type { Board } from '@/lib/game';
import Tile from '@/components/tile';

interface GameBoardProps {
  board: Board;
  onTileClick: (row: number, col: number) => void;
  onTileDoubleClick: (row: number, col: number) => void;
}

export default function GameBoard({ board, onTileClick, onTileDoubleClick }: GameBoardProps) {
  if (!board.length) {
    return null;
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
              onDoubleClick={() => onTileDoubleClick(rowIndex, colIndex)}
            />
          ))
        )}
      </div>
    </div>
  );
}
