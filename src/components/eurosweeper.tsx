"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { ThemeToggle, type ThemeToggleHandle } from '@/components/theme-toggle';

type GameStatus = 'playing' | 'won' | 'lost';

export default function EuroSweeper() {
  const [currentCountry, setCurrentCountry] = useState<Country>(countries.portugal);
  const [board, setBoard] = useState<Board>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [isFlagging, setIsFlagging] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [flagCount, setFlagCount] = useState(0);
  const themeToggleRef = useRef<ThemeToggleHandle>(null);
  
  const totalNonMineTiles = useMemo(() => {
    return currentCountry.shape.flat().filter(cell => cell === 1).length - currentCountry.mines;
  }, [currentCountry]);

  const startGame = useCallback((country: Country) => {
    setCurrentCountry(country);
    let newBoard = createBoard(country.shape, country.mines);
    setGameStatus('playing');
    setFlagCount(0);
    setIsFlagging(false);

    // Auto-reveal first safe square
    const safeTiles: { row: number, col: number }[] = [];
    const zeroMineTiles: { row: number, col: number }[] = [];

    newBoard.forEach((row, r) => {
      row.forEach((tile, c) => {
        if (tile.isVisible && !tile.isMine) {
          safeTiles.push({ row: r, col: c });
          if (tile.adjacentMines === 0) {
            zeroMineTiles.push({ row: r, col: c });
          }
        }
      });
    });

    let firstMove;
    if (zeroMineTiles.length > 0) {
      firstMove = zeroMineTiles[Math.floor(Math.random() * zeroMineTiles.length)];
    } else if (safeTiles.length > 0) {
      firstMove = safeTiles[Math.floor(Math.random() * safeTiles.length)];
    }

    if (firstMove) {
      const { row, col } = firstMove;
      // Since floodFill now returns the total revealed count for the whole board,
      // we can directly use its return values.
      const { board: revealedBoard, revealedCount: initialRevealed } = floodFill(newBoard, row, col);
      setBoard(revealedBoard);
      setRevealedCount(initialRevealed);
      checkWinCondition(initialRevealed);
    } else {
      // No safe tiles found (unlikely, but handle it)
      setBoard(newBoard);
      setRevealedCount(0);
    }
  }, []);

  useEffect(() => {
    startGame(countries.portugal);
  }, [startGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key.toLowerCase() === 'f') {
        setIsFlagging(prev => !prev);
      }
      if (e.key.toLowerCase() === 'd') {
        themeToggleRef.current?.toggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const checkWinCondition = useCallback((currentRevealedCount: number) => {
    if (currentRevealedCount === totalNonMineTiles) {
      setGameStatus('won');
    }
  }, [totalNonMineTiles]);
  
  const handleTileClick = (row: number, col: number) => {
    if (gameStatus !== 'playing') return;
  
    let newBoard = board.map(r => r.map(c => ({ ...c })));
    const tile = newBoard[row][col];
  
    // Flagging mode
    if (isFlagging) {
      if (!tile.isRevealed) {
        const isFlagged = !tile.isFlagged;
        newBoard[row][col].isFlagged = isFlagged;
        setFlagCount(prev => prev + (isFlagged ? 1 : -1));
        setBoard(newBoard);
      }
      return;
    }
  
    // If tile is already revealed, try chording
    if (tile.isRevealed && tile.adjacentMines > 0) {
      handleChord(row, col);
      return;
    }
  
    if (tile.isFlagged || tile.isRevealed) {
      return;
    }
  
    if (tile.isMine) {
      setGameStatus('lost');
      newBoard.forEach(r => r.forEach(c => {
        if (c.isMine) c.isRevealed = true;
      }));
      setBoard(newBoard);
      return;
    }
  
    if (tile.adjacentMines === 0) {
      const { board: floodedBoard, revealedCount: newTotalRevealed } = floodFill(newBoard, row, col);
      setBoard(floodedBoard);
      setRevealedCount(newTotalRevealed);
      checkWinCondition(newTotalRevealed);
    } else {
      newBoard[row][col].isRevealed = true;
      const newRevealed = revealedCount + 1;
      setBoard(newBoard);
      setRevealedCount(newRevealed);
      checkWinCondition(newRevealed);
    }
  };
  
  const handleChord = (row: number, col: number) => {
    const tile = board[row][col];
    if (!tile.isRevealed || tile.adjacentMines === 0) {
      return;
    }
  
    let adjacentFlags = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[0].length && board[nr][nc].isFlagged) {
          adjacentFlags++;
        }
      }
    }
  
    if (adjacentFlags !== tile.adjacentMines) {
      return;
    }
  
    let boardCopy = board.map(r => r.map(c => ({ ...c })));
    let newRevealedCount = revealedCount;
    let gameOver = false;
  
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
  
        if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[0].length) {
          const neighbor = boardCopy[nr][nc];
          if (!neighbor.isRevealed && !neighbor.isFlagged) {
            if (neighbor.isMine) {
              gameOver = true;
              boardCopy.forEach(r => r.forEach(c => { if (c.isMine) c.isRevealed = true; }));
              break;
            }
            if (neighbor.adjacentMines === 0) {
              // The floodFill result contains the entire updated board and count
              const { board: floodedBoard, revealedCount: totalRevealed } = floodFill(boardCopy, nr, nc);
              boardCopy = floodedBoard;
              newRevealedCount = totalRevealed;
            } else {
              if (!boardCopy[nr][nc].isRevealed) {
                boardCopy[nr][nc].isRevealed = true;
                newRevealedCount++;
              }
            }
          }
        }
      }
      if (gameOver) break;
    }
  
    if (gameOver) {
      setGameStatus('lost');
      setBoard(boardCopy);
    } else {
      setBoard(boardCopy);
      setRevealedCount(newRevealedCount);
      checkWinCondition(newRevealedCount);
    }
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
           <ThemeToggle ref={themeToggleRef} />
          <div className="flex items-center space-x-2">
            <Label htmlFor="flag-mode" className="flex items-center gap-2 cursor-pointer">
              <Flag className="w-5 h-5"/>
              <span>Flag Mode (F)</span>
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
