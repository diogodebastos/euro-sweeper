
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Board, Tile as TileType } from '@/lib/game';
import { createBoard, floodFill, openingMove } from '@/lib/game';
import Link from 'next/link';
import { countries } from '@/lib/countries';
import { CLASSIC_AT, FLAGS_AT, NEW_PROGRESS, loadProgress, mineCount, saveProgress, unlocks } from '@/lib/progress';
import { useToast } from '@/hooks/use-toast';
import { flagColor } from '@/lib/flags';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flag, Bomb, RefreshCw, Zap, Smile, Frown, Award, VenetianMask, PaintBucket, Skull, Plane, Crown } from 'lucide-react';
import { ThemeMenuItem, ThemeToggle } from '@/components/theme-toggle';
import MobileBar, { MENU_ICON, MENU_ICON_ITEM } from '@/components/mobile-bar';
import { toggleTheme } from '@/lib/theme';
import {
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type GameStatus = 'playing' | 'won' | 'lost';

export default function EuroSweeper() {
  const [currentCountryKey, setCurrentCountryKey] = useState<string>('portugal');
  const [board, setBoard] = useState<Board>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [isFlagging, setIsFlagging] = useState(true);
  const [isChording, setIsChording] = useState(true);
  const [revealedCount, setRevealedCount] = useState(0);
  const [flagCount, setFlagCount] = useState(0);
  const [beatenCountries, setBeatenCountries] = useState<string[]>([]);
  const [clearedCountries, setClearedCountries] = useState<string[]>([]);
  const [isClassicMode, setIsClassicMode] = useState(false);
  const [isFlagTiles, setIsFlagTiles] = useState(false);
  const [isHardMode, setIsHardMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  const currentCountry = useMemo(() => countries[currentCountryKey], [currentCountryKey]);
  const currentMines = mineCount(currentCountryKey, isHardMode);
  const [isBossBeaten, setIsBossBeaten] = useState(false);
  const unlocked = unlocks(clearedCountries, isBossBeaten);
  // Countries still to sweep on this tour; the current one is where you already are.
  const travelDestinations = Object.keys(countries).filter(key => key !== currentCountryKey && !beatenCountries.includes(key));

  const totalNonMineTiles = useMemo(() => {
    return currentCountry.shape.flat().filter(cell => cell === 1).length - currentMines;
  }, [currentCountry, currentMines]);

  useEffect(() => {
    if (!isLoaded) return;
    saveProgress({
      beaten: beatenCountries,
      cleared: clearedCountries,
      current: currentCountryKey,
      classic: isClassicMode,
      flags: isFlagTiles,
      hard: isHardMode,
      bossBeaten: isBossBeaten,
    });
  }, [isLoaded, beatenCountries, clearedCountries, currentCountryKey, isClassicMode, isFlagTiles, isHardMode, isBossBeaten]);

  useEffect(() => {
    if (isClassicMode) {
      document.body.classList.add('classic');
    } else {
      document.body.classList.remove('classic');
    }
    return () => document.body.classList.remove('classic');
  }, [isClassicMode]);

  const startGame = useCallback((countryKey: string, hard: boolean) => {
    const country = countries[countryKey];
    setCurrentCountryKey(countryKey);
    const newBoard = createBoard(country.shape, mineCount(countryKey, hard));
    setGameStatus('playing');
    setFlagCount(0);

    const { board: revealedBoard, revealedCount: initialRevealed } = openingMove(newBoard);
    setBoard(revealedBoard);
    setRevealedCount(initialRevealed);
    if (initialRevealed > 0) checkWinCondition(initialRevealed);
  }, []);

  useEffect(() => {
    const saved = loadProgress();
    const open = unlocks(saved.cleared, saved.bossBeaten);
    setBeatenCountries(saved.beaten);
    setClearedCountries(saved.cleared);
    setIsClassicMode(open.classic && saved.classic);
    setIsFlagTiles(open.flags && saved.flags);
    setIsHardMode(open.champion && saved.hard);
    setIsBossBeaten(saved.bossBeaten);
    setIsLoaded(true);
    startGame(saved.current, open.champion && saved.hard);
  }, [startGame]);

  const restart = (countryKey = currentCountryKey) => startGame(countryKey, isHardMode);

  const celebrateUnlocks = (before: number, after: number) => {
    if (before < CLASSIC_AT && after >= CLASSIC_AT) {
      setIsClassicMode(true);
      toast({ title: 'Classic theme unlocked!', description: `${CLASSIC_AT} countries swept. Toggle it any time with the smiley button.` });
    }
    if (before < FLAGS_AT && after >= FLAGS_AT) {
      setIsFlagTiles(true);
      toast({ title: 'Flag tiles unlocked!', description: `${FLAGS_AT} countries swept. Cleared squares now paint each country's flag.` });
    }
  };
  
  const checkWinCondition = useCallback((currentRevealedCount: number) => {
    if (currentRevealedCount > 0 && currentRevealedCount === totalNonMineTiles) {
      const newBeatenCountries = beatenCountries.includes(currentCountryKey) ? beatenCountries : [...beatenCountries, currentCountryKey];
      setBeatenCountries(newBeatenCountries);
      const newClearedCountries = clearedCountries.includes(currentCountryKey) ? clearedCountries : [...clearedCountries, currentCountryKey];
      setClearedCountries(newClearedCountries);
      celebrateUnlocks(clearedCountries.length, newClearedCountries.length);

      if (Object.keys(countries).length === newBeatenCountries.length) {
        setGameStatus('won');
        return;
      }

      const adjacentUnbeaten = currentCountry.adjacent.filter(key => !newBeatenCountries.includes(key));

      if (adjacentUnbeaten.length === 1) {
        handleNextCountry(adjacentUnbeaten[0]);
      } else {
        setGameStatus('won');
      }
    }
  }, [totalNonMineTiles, beatenCountries, clearedCountries, currentCountryKey, currentCountry.adjacent]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        restart();
        return;
      }
      
      if (gameStatus === 'lost' && e.key === ' ') {
        e.preventDefault();
        restart();
        return;
      }
      
      if (gameStatus !== 'playing') return;

      if (e.key.toLowerCase() === 'f') {
        setIsFlagging(prev => !prev);
      }
      if (e.key.toLowerCase() === 'c') {
        setIsChording(prev => !prev);
      }
      if (e.key.toLowerCase() === 'd') {
        toggleTheme();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameStatus, startGame, currentCountryKey, isHardMode]);
  
  const handleTileClick = (row: number, col: number) => {
    if (gameStatus !== 'playing') return;

    const currentTile = board[row][col];

    if (currentTile.isRevealed) {
      if (isChording && currentTile.adjacentMines > 0) {
        handleChord(row, col);
      }
      return;
    }

    if (isFlagging) {
      const newBoard = board.map(r => r.map(c => ({ ...c })));
      const tileToUpdate = newBoard[row][col];
      const isNowFlagged = !tileToUpdate.isFlagged;
      tileToUpdate.isFlagged = isNowFlagged;
      setFlagCount(prev => prev + (isNowFlagged ? 1 : -1));
      setBoard(newBoard);
      return;
    }

    if (currentTile.isFlagged) {
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
        if (newBoard[r][c].isMine && !newBoard[r][c].isFlagged) {
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
      if (!intermediateBoard[neighbor.r][neighbor.c].isRevealed && !intermediateBoard[neighbor.r][neighbor.c].isFlagged) {
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
    restart(countryKey);
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
        actions: <AlertDialogAction onClick={() => restart()}>Try Again</AlertDialogAction>
      };
    }

    if (gameStatus === 'won') {
      const allCountriesBeaten = Object.keys(countries).length === beatenCountries.length;
      if (allCountriesBeaten) {
        return {
          title: "Congratulations! You've swept the entire Europe!",
          description: isBossBeaten
            ? "Another tour of Europe complete. You are a true EuroSweeper champion!"
            : "Every country is swept. One challenge is left: all of Europe on a single board. Three lives, about 590 mines.",
          actions: (
            <>
              <AlertDialogAction asChild>
                {isBossBeaten ? <Link href="/map">See your gold map</Link> : <Link href="/europe">Face the final boss</Link>}
              </AlertDialogAction>
              <AlertDialogAction onClick={() => { setBeatenCountries([]); restart('portugal'); }}>Play Again</AlertDialogAction>
            </>
          )
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
  
  const renderSmiley = () => {
    const allCountriesBeaten = Object.keys(countries).length === beatenCountries.length;
    if (gameStatus === 'lost') {
      return <Frown className="w-6 h-6" />;
    }
    if (gameStatus === 'won' && allCountriesBeaten) {
      return <Award className="w-6 h-6" />;
    }
    if (gameStatus !== 'playing') {
      return <Smile className="w-6 h-6" />;
    }
    return <VenetianMask className="w-6 h-6" />;
  };


  return (
    <div className="flex flex-col items-center flex-grow min-h-0">
      <MobileBar
        title={currentCountry.name}
        stats={
          <>
            <span className="flex items-center gap-1"><Bomb className="w-4 h-4" />{currentMines}</span>
            <span className="flex items-center gap-1"><Flag className="w-4 h-4" />{flagCount}</span>
          </>
        }
        isFlagging={isFlagging}
        onFlaggingChange={setIsFlagging}
        isChording={isChording}
        onChordingChange={setIsChording}
        onRestart={() => restart()}
        className={cn(isClassicMode && "controls-classic")}
        menu={
          <>
            <ThemeMenuItem />
            {unlocked.classic && (
              <DropdownMenuCheckboxItem checked={isClassicMode} onCheckedChange={setIsClassicMode}>
                Classic theme
              </DropdownMenuCheckboxItem>
            )}
            {unlocked.flags && (
              <DropdownMenuCheckboxItem checked={isFlagTiles} onCheckedChange={setIsFlagTiles}>
                Flag tiles
              </DropdownMenuCheckboxItem>
            )}
            {unlocked.champion && (
              <DropdownMenuCheckboxItem
                checked={isHardMode}
                onCheckedChange={hard => { setIsHardMode(hard); startGame(currentCountryKey, hard); }}
              >
                Hard mode
              </DropdownMenuCheckboxItem>
            )}
            {(unlocked.champion || unlocked.boss) && <DropdownMenuSeparator />}
            {unlocked.champion && travelDestinations.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className={MENU_ICON_ITEM}>
                  <Plane className={MENU_ICON} /> Travel to…
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-72 overflow-y-auto">
                  {travelDestinations.map(key => (
                    <DropdownMenuItem key={key} onSelect={() => restart(key)}>
                      {countries[key].name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            {unlocked.boss && (
              <DropdownMenuItem asChild className={MENU_ICON_ITEM}>
                <Link href="/europe"><Crown className={MENU_ICON} /> Final boss</Link>
              </DropdownMenuItem>
            )}
          </>
        }
      />
      <div className={cn(
        "w-full hidden sm:flex flex-row justify-between items-center mb-4 p-4 bg-card rounded-lg shadow-md border gap-4 flex-shrink-0",
        isClassicMode && "controls-classic"
        )}>
        <div className="flex-shrink-0">
          <h1 className="text-3xl font-bold font-headline text-primary">EuroSweeper: <span className="text-foreground">{currentCountry.name}</span></h1>
          <div className="flex items-center gap-4 text-muted-foreground mt-1">
            <div className="flex items-center gap-1"><Bomb className="w-4 h-4" /><span>{currentMines}</span></div>
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
          <Button variant="outline" size="icon" onClick={() => restart()} aria-label="Restart Game (R)">
            <RefreshCw className="w-6 h-6" />
          </Button>
          <ThemeToggle />
          {unlocked.boss && (
            <Button variant="outline" size="icon" asChild title="Final boss: all of Europe">
              <Link href="/europe" aria-label="Final boss: all of Europe">
                <Crown className="w-6 h-6" />
              </Link>
            </Button>
          )}
          {unlocked.classic && (
            <Button variant={isClassicMode ? 'default' : 'outline'} size="icon" onClick={() => setIsClassicMode(prev => !prev)} aria-label="Toggle Classic Mode" title="Classic theme">
              <Smile className="w-6 h-6" />
            </Button>
          )}
          {unlocked.flags && (
            <Button variant={isFlagTiles ? 'default' : 'outline'} size="icon" onClick={() => setIsFlagTiles(prev => !prev)} aria-label="Toggle Flag Tiles" title="Flag tiles">
              <PaintBucket className="w-6 h-6" />
            </Button>
          )}
          {unlocked.champion && (
            <Button
              variant={isHardMode ? 'destructive' : 'outline'}
              size="icon"
              onClick={() => { const hard = !isHardMode; setIsHardMode(hard); startGame(currentCountryKey, hard); }}
              aria-label="Toggle Hard Mode"
              title="Hard mode: more mines (restarts the board)"
            >
              <Skull className="w-6 h-6" />
            </Button>
          )}
          {unlocked.champion && (
            <Select value={currentCountryKey} onValueChange={key => restart(key)}>
              <SelectTrigger className="w-44" aria-label="Travel anywhere">
                <Plane className="w-4 h-4 mr-2 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[currentCountryKey, ...travelDestinations].map(key => (
                  <SelectItem key={key} value={key}>
                    {countries[key].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      
      <GameBoard board={board} onTileClick={handleTileClick} isClassicMode={isClassicMode} cellColor={isFlagTiles ? (r, c) => flagColor(currentCountryKey, r, c, board.length, board[0].length) : undefined} />
      
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
