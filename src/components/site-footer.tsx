import Link from 'next/link';
import { Github, Map as MapIcon, Bomb } from 'lucide-react';

export default function SiteFooter({ page }: { page: 'game' | 'map' | 'boss' }) {
  return (
    <footer className="flex-shrink-0 flex items-center justify-center gap-6 pt-3 text-sm text-muted-foreground">
      {page !== 'game' && (
        <Link href="/" className="flex items-center gap-1 hover:text-foreground">
          <Bomb className="w-4 h-4" /> Back to the game
        </Link>
      )}
      {page !== 'map' && (
        <Link href="/map" className="flex items-center gap-1 hover:text-foreground">
          <MapIcon className="w-4 h-4" /> Europe map
        </Link>
      )}
      <a
        href="https://github.com/diogodebastos/euro-sweeper"
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1 hover:text-foreground"
      >
        <Github className="w-4 h-4" /> GitHub
      </a>
    </footer>
  );
}
