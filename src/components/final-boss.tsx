"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Board } from '@/lib/game';
import { boardWithMines, createBoard, floodFill, openingMove } from '@/lib/game';
import { countries } from '@/lib/countries';
import { EUROPE_COLS, europeGrid, europeMines } from '@/lib/europe';
import { BOSS_LIVES, EUROPE_AT, loadBossRun, loadProgress, saveBossRun, saveProgress } from '@/lib/progress';
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
import { Flag, Bomb, Zap, Heart, RefreshCw } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

type BossStatus = 'loading' | 'locked' | 'playing' | 'won' | 'lost';

// The final boss: every country on one board, with three lives.
const grid = europeGrid();
const shape = grid.map(line => line.map(cell => (cell ? 1 : 0)));
const totalCells = shape.flat().filter(Boolean).length;
const totalMines = europeMines(totalCells);
const totalSafe = totalCells - totalMines;

const cellIndex = (r: number, c: number) => r * EUROPE_COLS + c;
const cellColor = (r: number, c: number) => grid[r][c]?.flag;
const cellTitle = (r: number, c: number) => {
  const cell = grid[r][c];
  return cell ? countries[cell.key].name : undefined;
};

function countSafeRevealed(board: Board) {
  return board.reduce((sum, line) => sum + line.filter(t => t.isRevealed && !t.isMine).length, 0);
}

function newRun(): Board {
  return openingMove(createBoard(shape, totalMines)).board;
}

function restoreRun(): { board: Board; lives: number } | null {
  const run = loadBossRun();
  if (!run) return null;
  const board = boardWithMines(shape, new Set(run.mines));
  const revealed = new Set(run.revealed), flagged = new Set(run.flagged);
  board.forEach((line, r) => line.forEach((tile, c) => {
    tile.isRevealed = tile.isVisible && revealed.has(cellIndex(r, c));
    tile.isFlagged = tile.isVisible && !tile.isRevealed && flagged.has(cellIndex(r, c));
  }));
  return { board, lives: run.lives };
}

function toRun(board: Board, lives: number) {
  const mines: number[] = [], revealed: number[] = [], flagged: number[] = [];
  board.forEach((line, r) => line.forEach((tile, c) => {
    if (tile.isMine) mines.push(cellIndex(r, c));
    if (tile.isRevealed) revealed.push(cellIndex(r, c));
    if (tile.isFlagged) flagged.push(cellIndex(r, c));
  }));
  return { mines, revealed, flagged, lives };
}

export default function FinalBoss() {
  const [board, setBoard] = useState<Board>([]);
  const [lives, setLives] = useState(BOSS_LIVES);
  const [status, setStatus] = useState<BossStatus>('loading');
  const [isFlagging, setIsFlagging] = useState(true);
  const [isChording, setIsChording] = useState(true);
  const [isClassicMode, setIsClassicMode] = useState(false);
  const [clearedCount, setClearedCount] = useState(0);

  useEffect(() => {
    const progress = loadProgress();
    setClearedCount(progress.cleared.length);
    setIsClassicMode(progress.classic && progress.cleared.length >= 5);
    if (progress.cleared.length < EUROPE_AT) {
      setStatus('locked');
      return;
    }
    const saved = restoreRun();
    setBoard(saved?.board ?? newRun());
    setLives(saved?.lives ?? BOSS_LIVES);
    setStatus('playing');
  }, []);

  useEffect(() => {
    document.body.classList.toggle('classic', isClassicMode);
    return () => document.body.classList.remove('classic');
  }, [isClassicMode]);

  // Keep the run saved while it's being played.
  useEffect(() => {
    if (status === 'playing') saveBossRun(toRun(board, lives));
  }, [status, board, lives]);

  const safeRevealed = useMemo(() => countSafeRevealed(board), [board]);
  const exploded = useMemo(() => board.flat().filter(t => t.isRevealed && t.isMine).length, [board]);
  const flags = useMemo(() => board.flat().filter(t => t.isFlagged).length, [board]);

  const startNewRun = () => {
    setBoard(newRun());
    setLives(BOSS_LIVES);
    setStatus('playing');
  };

  const finish = (result: 'won' | 'lost', finalBoard: Board) => {
    saveBossRun(null);
    if (result === 'won') {
      saveProgress({ ...loadProgress(), bossBeaten: true });
    } else {
      finalBoard.forEach(line => line.forEach(tile => {
        if (tile.isMine) tile.isRevealed = true;
      }));
    }
    setBoard(finalBoard);
    setStatus(result);
  };

  // Reveals the given cells; every mine hit costs a life instead of ending the run.
  const reveal = (cells: { r: number; c: number }[]) => {
    let next = board.map(line => line.map(tile => ({ ...tile })));
    let hits = 0;
    for (const { r, c } of cells) {
      const tile = next[r][c];
      if (tile.isRevealed || tile.isFlagged) continue;
      if (tile.isMine) {
        tile.isRevealed = true;
        hits++;
      } else {
        next = floodFill(next, r, c).board;
      }
    }
    const livesLeft = lives - hits;
    setLives(Math.max(0, livesLeft));
    if (livesLeft <= 0) return finish('lost', next);
    if (countSafeRevealed(next) === totalSafe) return finish('won', next);
    setBoard(next);
  };

  const neighbours = (r: number, c: number) => {
    const list: { r: number; c: number }[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if ((dr || dc) && board[nr]?.[nc]?.isVisible) list.push({ r: nr, c: nc });
      }
    }
    return list;
  };

  const handleTileClick = (r: number, c: number) => {
    if (status !== 'playing') return;
    const tile = board[r][c];

    if (tile.isRevealed) {
      if (!isChording || tile.isMine || tile.adjacentMines === 0) return;
      const around = neighbours(r, c);
      // Mines that already cost a life count as flags.
      const marked = around.filter(n => board[n.r][n.c].isFlagged || (board[n.r][n.c].isRevealed && board[n.r][n.c].isMine)).length;
      if (marked === tile.adjacentMines) reveal(around);
      return;
    }

    if (isFlagging) {
      setBoard(board.map((line, lr) => line.map((t, lc) => (lr === r && lc === c ? { ...t, isFlagged: !t.isFlagged } : t))));
      return;
    }

    if (!tile.isFlagged) reveal([{ r, c }]);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key.toLowerCase() === 'f') setIsFlagging(prev => !prev);
    if (e.key.toLowerCase() === 'c') setIsChording(prev => !prev);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const confirmNewRun = () => {
    if (window.confirm('Start a new board? This run will be lost.')) startNewRun();
  };

  if (status === 'locked') {
    return (
      <div className="flex flex-col items-center justify-center flex-grow gap-4 text-center">
        <h1 className="text-3xl font-bold font-headline text-primary">Final boss: <span className="text-foreground">Europe</span></h1>
        <p className="text-muted-foreground max-w-md">
          All of Europe on a single board. Sweep every country first: {clearedCount} of {EUROPE_AT} done.
        </p>
      </div>
    );
  }

  const percent = Math.floor((safeRevealed / totalSafe) * 100);

  return (
    <div className="flex flex-col items-center flex-grow min-h-0">
      <div className={cn(
        "w-full flex flex-col sm:flex-row justify-between items-center mb-4 p-4 bg-card rounded-lg shadow-md border gap-4 flex-shrink-0",
        isClassicMode && "controls-classic"
      )}>
        <div className="flex-shrink-0">
          <h1 className="text-3xl font-bold font-headline text-primary">Final boss: <span className="text-foreground">Europe</span></h1>
          <div className="flex items-center gap-4 text-muted-foreground mt-1">
            <div className="flex items-center gap-1" aria-label={`${lives} of ${BOSS_LIVES} lives left`}>
              {Array.from({ length: BOSS_LIVES }, (_, i) => (
                <Heart key={i} className={cn("w-4 h-4", i < lives ? "fill-destructive text-destructive" : "")} />
              ))}
            </div>
            <div className="flex items-center gap-1" title="Mines left"><Bomb className="w-4 h-4" /><span>{totalMines - flags - exploded}</span></div>
            <div className="flex items-center gap-1" title="Flags placed"><Flag className="w-4 h-4" /><span>{flags}</span></div>
            <span>{percent}% swept</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="boss-flag-mode" className="flex items-center gap-2 cursor-pointer">
              <Flag className="w-5 h-5" />
              <span>Flag (F)</span>
            </Label>
            <Switch id="boss-flag-mode" checked={isFlagging} onCheckedChange={setIsFlagging} />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="boss-chord-mode" className="flex items-center gap-2 cursor-pointer">
              <Zap className="w-5 h-5" />
              <span>Chord (C)</span>
            </Label>
            <Switch id="boss-chord-mode" checked={isChording} onCheckedChange={setIsChording} />
          </div>
          <Button variant="outline" size="icon" onClick={confirmNewRun} aria-label="New board" title="New board">
            <RefreshCw className="w-6 h-6" />
          </Button>
          <ThemeToggle />
        </div>
      </div>

      <GameBoard
        board={board}
        onTileClick={handleTileClick}
        isClassicMode={isClassicMode}
        cellColor={cellColor}
        cellTitle={cellTitle}
        compact
      />

      <AlertDialog open={status === 'won' || status === 'lost'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{status === 'won' ? 'Europe is yours!' : 'Europe wins this time'}</AlertDialogTitle>
            <AlertDialogDescription>
              {status === 'won'
                ? `You beat the final boss with ${lives} ${lives === 1 ? 'life' : 'lives'} left. Your map is now gold, and Hard mode and travel anywhere are unlocked.`
                : `Out of lives with ${percent}% of Europe swept. Every board is new, so try again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {status === 'won' ? (
              <>
                <AlertDialogAction asChild><Link href="/map">See your gold map</Link></AlertDialogAction>
                <AlertDialogAction asChild><Link href="/">Back to the game</Link></AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction onClick={startNewRun}>Try again</AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
