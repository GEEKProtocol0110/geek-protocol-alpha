import PlayClient from "./PlayClient";

export default function PlayPage() {
  return (
    <main className="relative min-h-[calc(100vh-56px)] overflow-hidden bg-[var(--surface-0)] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
        <div className="grid-overlay" />
      </div>
      <div className="relative z-10 mx-auto max-w-4xl px-6 py-10">
        <PlayClient />
      </div>
    </main>
  );
}
