"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Result = {
  score: number;
  total: number;
  rewardAmount: number;
  txStatus: string;
  message?: string;
};

export default function ResultPage() {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("gp:lastResult");
      if (raw) setResult(JSON.parse(raw) as Result);
    } catch {
      // ignore
    }
  }, []);

  return (
    <main className="min-h-dvh bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-sm text-white/70 hover:text-white">
            ← Home
          </Link>
          <span className="text-xs text-white/50">Geek Protocol MVP</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h1 className="text-2xl font-semibold">Round Complete</h1>

          {result ? (
            <div className="mt-4 space-y-3">
              <p className="text-white/80">
                Score: <span className="font-semibold text-white">{result.score}</span> / {result.total}
              </p>
              <p className="text-white/80">
                Reward: <span className="font-semibold text-white">{result.rewardAmount}</span> $GEEK (testnet stub)
              </p>
              <p className="text-xs text-white/60">TX Status: {result.txStatus}</p>
              {result.message ? <p className="text-xs text-white/60">{result.message}</p> : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-white/70">
              No result found. Play a round first.
            </p>
          )}

          <div className="mt-8 flex gap-3">
            <Link
              href="/play"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
            >
              Play Again
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80"
            >
              Back to Home
            </Link>
          </div>
        </div>

        <p className="mt-6 text-xs text-white/50">
          Next step: wire Kaspa Testnet wallet connect + backend reward send.
        </p>
      </div>
    </main>
  );
}
