import EuroSweeper from '@/components/eurosweeper';
import SiteFooter from '@/components/site-footer';

export default function Home() {
  return (
    <main className="flex h-screen flex-col items-center p-4 sm:p-8 md:p-12 overflow-hidden">
      <div className="w-full max-w-7xl flex flex-col flex-1 min-h-0">
        <EuroSweeper />
      </div>
      <SiteFooter page="game" />
    </main>
  );
}
