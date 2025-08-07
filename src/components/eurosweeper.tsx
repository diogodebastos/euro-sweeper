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
import { Flag, Bomb, RefreshCw, Zap } from 'lucide-react';
import { ThemeToggle, type ThemeToggleHandle } from '@/components/theme-toggle';

type GameStatus = 'playing' | 'won' | 'lost';

export default function EuroSweeper() {
  const [currentCountryKey, setCurrentCountryKey] = useState<string>('portugal');
  const [board, setBoard] = useState<Board>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [isFlagging, setIsFlagging] = useState(false);
  const [isChording, setIsChording] = useState(true);
  const [revealedCount, setRevealedCount] = useState(0);
  const [flagCount, setFlagCount] = useState(0);
  const [beatenCountries, setBeatenCountries] = useState<string[]>([]);
  const themeToggleRef = useRef<ThemeToggleHandle>(null);

  const currentCountry = useMemo(() => countries[currentCountryKey], [currentCountryKey]);
  
  const totalNonMineTiles = useMemo(() => {
    return currentCountry.shape.flat().filter(cell => cell === 1).length - currentCountry.mines;
  }, [currentCountry]);

  const startGame = useCallback((countryKey: string) => {
    const country = countries[countryKey];
    setCurrentCountryKey(countryKey);
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
      const { board: revealedBoard, revealedCount: initialRevealed } = floodFill(newBoard, row, col);
      setBoard(revealedBoard);
      setRevealedCount(initialRevealed);
      checkWinCondition(initialRevealed);
    } else {
      setBoard(newBoard);
      setRevealedCount(0);
    }
  }, []);

  useEffect(() => {
    startGame('portugal');
  }, [startGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus === 'lost' && e.key === ' ') {
        e.preventDefault();
        startGame(currentCountryKey);
        return;
      }
      
      if (gameStatus !== 'playing') return;

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key.toLowerCase() === 'f') {
        setIsFlagging(prev => !prev);
      }
      if (e.key.toLowerCase() === 'c') {
        setIsChording(prev => !prev);
      }
      if (e.key.toLowerCase() === 'd') {
        themeToggleRef.current?.toggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameStatus, startGame, currentCountryKey]);

  const checkWinCondition = useCallback((currentRevealedCount: number) => {
    if (currentRevealedCount > 0 && currentRevealedCount === totalNonMineTiles) {
      setGameStatus('won');
      if (!beatenCountries.includes(currentCountryKey)) {
        setBeatenCountries(prev => [...prev, currentCountryKey]);
      }
    }
  }, [totalNonMineTiles, beatenCountries, currentCountryKey]);
  
  const handleTileClick = (row: number, col: number) => {
    if (gameStatus !== 'playing') return;
  
    const currentTile = board[row][col];
    
    if (isFlagging) {
      if (!currentTile.isRevealed) {
        const newBoard = board.map(r => r.map(c => ({ ...c })));
        const tileToUpdate = newBoard[row][col];
        const isNowFlagged = !tileToUpdate.isFlagged;
        tileToUpdate.isFlagged = isNowFlagged;
        setFlagCount(prev => prev + (isNowFlagged ? 1 : -1));
        setBoard(newBoard);
      }
      return;
    }
    
    if (currentTile.isFlagged) {
      return;
    }
    
    if (currentTile.isRevealed) {
      if (isChording && currentTile.adjacentMines > 0) {
        handleChord(row, col);
      }
      return;
    }
  
    if (currentTile.isMine) {
      setGameStatus('lost');
      const newBoard = board.map(r => r.map(c => ({...c})));
      newBoard.forEach(r => r.forEach(c => {
        if (c.isMine) c.isRevealed = true;
      }));
      setBoard(newBoard);
      return;
    }
  
    let { board: newBoard, revealedCount: newTotalRevealed } = floodFill(board, row, col);
    setBoard(newBoard);
    setRevealedCount(newTotalRevealed);
    checkWinCondition(newTotalRevealed);
  };
  
  const handleChord = (row: number, col: number) => {
    const tile = board[row][col];
    let adjacentFlags = 0;
    const neighborsToReveal: {r: number, c: number}[] = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[0].length && board[nr][nc].isVisible) {
          if (board[nr][nc].isFlagged) {
            adjacentFlags++;
          } else if (!board[nr][nc].isRevealed) {
            neighborsToReveal.push({r: nr, c: nc});
          }
        }
      }
    }

    if (adjacentFlags !== tile.adjacentMines) {
      return;
    }
    
    let newBoard = board.map(r => r.map(c => ({ ...c })));
    let hitMine = false;
    let finalRevealedCount = revealedCount;

    for (const neighbor of neighborsToReveal) {
        const { r, c } = neighbor;
        if (newBoard[r][c].isMine) {
            hitMine = true;
            break;
        }
    }
    
    if (hitMine) {
      newBoard.forEach(r => r.forEach(tile => {
        if (tile.isMine) tile.isRevealed = true;
      }));
      setBoard(newBoard);
      setGameStatus('lost');
      return;
    }
    
    let intermediateBoard = newBoard;

    for (const neighbor of neighborsToReveal) {
      if (!intermediateBoard[neighbor.r][neighbor.c].isRevealed) {
        const { board: floodedBoard, revealedCount: updatedCount } = floodFill(intermediateBoard, neighbor.r, neighbor.c);
        intermediateBoard = floodedBoard;
        finalRevealedCount = updatedCount;
      }
    }

    setBoard(intermediateBoard);
    setRevealedCount(finalRevealedCount);
    checkWinCondition(finalRevealedCount);
  };


  const handleNextCountry = (countryKey: string) => {
    startGame(countryKey);
  };

  const renderNextCountryButtons = () => {
    const adjacentUnbeaten = currentCountry.adjacent.filter(key => !beatenCountries.includes(key));
    const allUnbeaten = Object.keys(countries).filter(key => !beatenCountries.includes(key) && key !== currentCountryKey);
    const allCountriesBeaten = Object.keys(countries).length === beatenCountries.length;

    if (allCountriesBeaten) {
       return null;
    }

    if (adjacentUnbeaten.length > 0) {
      return adjacentUnbeaten.map(key => (
        <AlertDialogAction key={key} onClick={() => handleNextCountry(key)}>
          Proceed to {countries[key].name}
        </AlertDialogAction>
      ));
    }
    
    if (allUnbeaten.length > 0) {
      return (
        <>
          <AlertDialogDescription>
            You've cleared all adjacent countries! Choose your next destination.
          </AlertDialogDescription>
          {allUnbeaten.map(key => (
            <AlertDialogAction key={key} onClick={() => handleNextCountry(key)}>
              Travel to {countries[key].name}
            </AlertDialogAction>
          ))}
        </>
      );
    }
    
    return null;
  }
  
  const getDialogContent = () => {
    if (gameStatus === 'lost') {
      return {
        title: 'Game Over!',
        description: 'You clicked on a mine. Better luck next time! Press Space to try again.',
        actions: <AlertDialogAction onClick={() => startGame(currentCountryKey)}>Try Again</AlertDialogAction>
      };
    }

    if (gameStatus === 'won') {
      const allCountriesBeaten = Object.keys(countries).length === beatenCountries.length;
      if (allCountriesBeaten) {
        return {
          title: "Congratulations! You've swept the entire Europe!",
          description: "You are a true EuroSweeper champion!",
          actions: <AlertDialogAction onClick={() => setBeatenCountries([])}>Play Again</AlertDialogAction>
        };
      }
      return {
        title: `You've cleared ${currentCountry.name}!`,
        description: 'Ready for your next challenge? Choose an adjacent country to continue your European tour.',
        actions: renderNextCountryButtons()
      };
    }
    
    return { title: '', description: '', actions: null };
  }

  const { title, description, actions } = getDialogContent();

  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex flex-col sm:flex-row justify-between items-center mb-4 p-4 bg-card rounded-lg shadow-md border gap-4">
        <div className="flex-shrink-0">
          <h2 className="text-2xl font-bold font-headline text-primary">{currentCountry.name}</h2>
          <div className="flex items-center gap-4 text-muted-foreground mt-1">
            <div className="flex items-center gap-1"><Bomb className="w-4 h-4" /><span>{currentCountry.mines}</span></div>
            <div className="flex items-center gap-1"><Flag className="w-4 h-4" /><span>{flagCount}</span></div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="flag-mode" className="flex items-center gap-2 cursor-pointer">
              <Flag className="w-5 h-5"/>
              <span>Flag (F)</span>
            </Label>
            <Switch
              id="flag-mode"
              checked={isFlagging}
              onCheckedChange={setIsFlagging}
            />
          </div>
           <div className="flex items-center space-x-2">
            <Label htmlFor="chord-mode" className="flex items-center gap-2 cursor-pointer">
              <Zap className="w-5 h-5"/>
              <span>Chord (C)</span>
            </Label>
            <Switch
              id="chord-mode"
              checked={isChording}
              onCheckedChange={setIsChording}
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => startGame(currentCountryKey)} aria-label="Restart Game">
            <RefreshCw className="w-5 h-5" />
          </Button>
          <ThemeToggle ref={themeToggleRef} />
        </div>
      </div>
      
      <GameBoard board={board} onTileClick={handleTileClick} />
      
      <AlertDialog open={gameStatus === 'won' || gameStatus === 'lost'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {actions}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
