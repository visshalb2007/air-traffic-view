export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-radar-bg text-radar-text">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold font-mono tracking-wider text-radar-primary">
          SKYWATCH ATC
        </h1>
        <p className="text-radar-muted font-mono text-sm">
          Air Traffic Monitoring System Initializing...
        </p>
      </div>
    </main>
  );
}
