import EuroSweeper from '@/components/eurosweeper';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-7xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">EuroSweeper</h1>
          <p className="text-muted-foreground mt-2 text-lg">Uncover Europe, one tile at a time. Click to reveal, or toggle flagging mode to mark mines.</p>
        </header>
        <EuroSweeper />
      </div>
    </main>
  );
}
