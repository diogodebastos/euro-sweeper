"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Board, Tile as TileType } from '@/lib/game';
import { createBoard, floodFill } from '@/lib/game';
import { countries, Country } from '@/lib/countries';
import GameBoard from '@/components/game-board';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Flag, Bomb, RefreshCw } from 'lucide-react';

type GameStatus = 'playing' | 'won' | 'lost';

export default function EuroSweeper() {
  const [currentCountry, setCurrentCountry] = useState<Country>(countries.portugal);
  const [board, setBoard] = useState<Board>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [isFlagging, setIsFlagging] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [flagCount, setFlagCount] = useState(0);
  
  const totalNonMineTiles = useMemo(() => {
    return currentCountry.shape.flat().filter(cell => cell === 1).length - currentCountry.mines;
  }, [currentCountry]);

  const startGame = useCallback((country: Country) => {
    setCurrentCountry(country);
    const newBoard = createBoard(country.shape, country.mines);
    setBoard(newBoard);
    setGameStatus('playing');
    setRevealedCount(0);
    setFlagCount(0);
    setIsFlagging(false);
  }, []);

  useEffect(() => {
    startGame(countries.portugal);
  }, [startGame]);

  const checkWinCondition = useCallback((newRevealedCount: number) => {
    if (newRevealedCount === totalNonMineTiles) {
      setGameStatus('won');
    }
  }, [totalNonMineTiles]);
  
  const handleTileClick = (row: number, col: number) => {
    if (gameStatus !== 'playing') return;

    const tile = board[row][col];
    if (tile.isRevealed) return;

    const newBoard = board.map(r => r.map(c => ({ ...c })));

    if (isFlagging) {
      if (!tile.isRevealed) {
        newBoard[row][col].isFlagged = !tile.isFlagged;
        setFlagCount(prev => prev + (newBoard[row][col].isFlagged ? 1 : -1));
      }
      setBoard(newBoard);
      return;
    }

    if (tile.isFlagged) return;

    if (tile.isMine) {
      setGameStatus('lost');
      // Reveal all mines
      newBoard.forEach(r => r.forEach(c => {
        if (c.isMine) c.isRevealed = true;
      }));
      setBoard(newBoard);
      return;
    }
    
    let newRevealedCount = revealedCount;

    if (tile.adjacentMines === 0) {
      const { board: floodedBoard, revealedCount: newlyRevealed } = floodFill(newBoard, row, col);
      setBoard(floodedBoard);
      newRevealedCount += newlyRevealed;
    } else {
      if (!newBoard[row][col].isRevealed) {
        newBoard[row][col].isRevealed = true;
        newRevealedCount += 1;
      }
      setBoard(newBoard);
    }
    
    setRevealedCount(newRevealedCount);
    checkWinCondition(newRevealedCount);
  };

  const handleNextCountry = (countryKey: string) => {
    const nextCountry = countries[countryKey];
    if (nextCountry) {
      startGame(nextCountry);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex flex-col sm:flex-row justify-between items-center mb-4 p-4 bg-card rounded-lg shadow-md border">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-2xl font-bold font-headline text-primary">{currentCountry.name}</h2>
          <div className="flex items-center gap-4 text-muted-foreground mt-1">
            <div className="flex items-center gap-1"><Bomb className="w-4 h-4" /><span>{currentCountry.mines}</span></div>
            <div className="flex items-center gap-1"><Flag className="w-4 h-4" /><span>{flagCount}</span></div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="flag-mode" className="flex items-center gap-2 cursor-pointer">
              <Flag className="w-5 h-5"/>
              <span>Flag Mode</span>
            </Label>
            <Switch
              id="flag-mode"
              checked={isFlagging}
              onCheckedChange={setIsFlagging}
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => startGame(currentCountry)}>
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      <GameBoard board={board} onTileClick={handleTileClick} />
      
      <AlertDialog open={gameStatus === 'won' || gameStatus === 'lost'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {gameStatus === 'won' ? `Congratulations! You've cleared ${currentCountry.name}!` : 'Game Over!'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {gameStatus === 'won' ? 'Ready for your next challenge? Choose an adjacent country to continue your European tour.' : 'You clicked on a mine. Better luck next time!'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {gameStatus === 'won' ? (
              currentCountry.adjacent.map(key => (
                <AlertDialogAction key={key} onClick={() => handleNextCountry(key)}>
                  Proceed to {countries[key].name}
                </AlertDialogAction>
              ))
            ) : (
               <AlertDialogAction onClick={() => startGame(currentCountry)}>Try Again</AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
