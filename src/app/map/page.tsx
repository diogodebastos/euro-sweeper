import type { Metadata } from 'next';
import EuropeMap from '@/components/europe-map';
import SiteFooter from '@/components/site-footer';

export const metadata: Metadata = {
  title: 'EuroSweeper: Europe map',
  description: 'Every EuroSweeper board put together on one map.',
};

export default function MapPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-4xl flex flex-col flex-1">
        <EuropeMap />
      </div>
      <SiteFooter page="map" />
    </main>
  );
}
