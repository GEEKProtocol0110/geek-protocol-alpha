import Link from "next/link";
import PlayClient from "./PlayClient";
import { getMvpRound } from "@/lib/questions";

export default function PlayPage() {
  const questions = getMvpRound();

  return (
    <main className="min-h-dvh bg-black text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-sm text-white/70 hover:text-white">
            ← Back to Home
          </Link>
          <span className="text-xs text-white/50">All hope. No hype.</span>
        </div>
        <PlayClient questions={questions} />
      </div>
    </main>
  );
}
