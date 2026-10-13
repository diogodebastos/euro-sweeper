import type { Metadata } from 'next';
import FinalBoss from '@/components/final-boss';
import SiteFooter from '@/components/site-footer';

export const metadata: Metadata = {
  title: 'EuroSweeper: Final boss',
  description: 'Every EuroSweeper country on a single board, with three lives.',
};

export default function EuropePage() {
  return (
    <main className="flex h-screen flex-col items-center p-4 sm:p-8 md:p-12 overflow-hidden">
      <div className="w-full max-w-7xl flex flex-col flex-1 min-h-0">
        <FinalBoss />
      </div>
      <SiteFooter page="boss" />
    </main>
  );
}
