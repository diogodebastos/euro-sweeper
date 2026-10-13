"use client";

import type { ReactNode } from 'react';
import { Flag, Zap, RefreshCw, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Menu items with an icon put it in the same left slot as a checkbox's check,
// so all labels line up.
export const MENU_ICON_ITEM = 'relative pl-8';
export const MENU_ICON = 'absolute left-2 w-4 h-4';

// The compact header for phones: title and stats on one row, the controls you
// use while playing on the next, and everything else in a menu.
interface MobileBarProps {
  title: string;
  stats: ReactNode;
  isFlagging: boolean;
  onFlaggingChange: (on: boolean) => void;
  isChording: boolean;
  onChordingChange: (on: boolean) => void;
  onRestart: () => void;
  restartLabel?: string;
  // DropdownMenu items for the ⋯ menu.
  menu: ReactNode;
  className?: string;
}

export default function MobileBar({
  title, stats, isFlagging, onFlaggingChange, isChording, onChordingChange, onRestart, restartLabel = 'Restart', menu, className,
}: MobileBarProps) {
  return (
    <div className={cn('sm:hidden w-full mb-3 px-3 py-2 bg-card rounded-lg shadow-md border flex-shrink-0', className)}>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold font-headline truncate">{title}</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-shrink-0">{stats}</div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Button
          variant={isFlagging ? 'default' : 'outline'}
          size="icon"
          className="h-9 w-9"
          onClick={() => onFlaggingChange(!isFlagging)}
          aria-pressed={isFlagging}
          aria-label="Flag mode"
        >
          <Flag className="w-5 h-5" />
        </Button>
        <Button
          variant={isChording ? 'default' : 'outline'}
          size="icon"
          className="h-9 w-9"
          onClick={() => onChordingChange(!isChording)}
          aria-pressed={isChording}
          aria-label="Chord mode"
        >
          <Zap className="w-5 h-5" />
        </Button>
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={onRestart} aria-label={restartLabel}>
          <RefreshCw className="w-5 h-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9 ml-auto" aria-label="More options">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {menu}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
