import PlayClient from "./PlayClient";

export default function PlayPage() {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <PlayClient />
      </div>
    </main>
  );
}
