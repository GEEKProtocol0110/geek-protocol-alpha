"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { getRewardStatus } from "@/lib/api";

type ResultData = {
  correct: number;
  total: number;
  score: number;
  time: number;
  attempt: string;
};

type RewardStatus = {
  status: "PENDING" | "SENT" | "CONFIRMED" | "FAILED";
  txId?: string;
  error?: string;
};

function ResultPageContent() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<ResultData | null>(null);
  const [reward, setReward] = useState<RewardStatus | null>(null);
  const [polling, setPolling] = useState(true);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
  const [workerAlive, setWorkerAlive] = useState<boolean | null>(null);

  useEffect(() => {
    const correct = searchParams.get("correct");
    const total = searchParams.get("total");
    const score = searchParams.get("score");
    const time = searchParams.get("time");
    const attempt = searchParams.get("attempt");

    if (correct && total && score && attempt) {
      setResult({
        correct: parseInt(correct),
        total: parseInt(total),
        score: parseInt(score),
        time: time ? parseInt(time) : 0,
        attempt,
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!result?.attempt || !polling) return;

    const poll = async () => {
      try {
        const status = await getRewardStatus(result.attempt);
        setReward(status);
        if (status.status === "CONFIRMED" || status.status === "FAILED") {
          setPolling(false);
        }
      } catch (error) {
        console.error("Failed to fetch reward status:", error);
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    const timeout = setTimeout(() => setPolling(false), 60000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [result?.attempt, polling]);

  useEffect(() => {
    let mounted = true;
    const fetchHealth = async () => {
      try {
        const r = await fetch(`${API_BASE}/health/worker`);
        if (r.ok) {
          const j = await r.json();
          if (mounted) setWorkerAlive(Boolean(j.alive));
        }
      } catch {}
    };
    fetchHealth();
    const id = setInterval(fetchHealth, 15000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [API_BASE]);

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
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-white/80">
                  Score:{" "}
                  <span className="font-semibold text-white">
                    {result.correct} / {result.total} ({Math.round((result.correct / result.total) * 100)}%)
                  </span>
                </p>
                <p className="text-sm text-white/60">Time: {result.time}s</p>
              </div>

              <div
                className={`rounded-lg border px-4 py-3 ${
                  reward?.status === "CONFIRMED"
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : reward?.status === "FAILED"
                      ? "border-red-500/50 bg-red-500/10"
                      : "border-white/20 bg-white/5"
                }`}
              >
                <p className="text-white/80">
                  Reward Status:{" "}
                  <span
                    className={`font-semibold ${
                      reward?.status === "CONFIRMED"
                        ? "text-emerald-400"
                        : reward?.status === "FAILED"
                          ? "text-red-400"
                          : "text-white"
                    }`}
                  >
                    {reward?.status || "PENDING"}
                  </span>
                </p>
                {reward?.txId && (
                  <p className="mt-1 text-xs text-white/60">TX: {reward.txId.slice(0, 16)}...</p>
                )}
                {reward?.error && <p className="mt-1 text-xs text-red-400">{reward.error}</p>}
                {workerAlive === null ? (
                  <p className="mt-1 text-xs text-white/60">Worker: Checking…</p>
                ) : (
                  <p className="mt-1 text-xs text-white/60">
                    Worker: {" "}
                    <span className={workerAlive ? "text-emerald-400" : "text-yellow-300"}>
                      {workerAlive ? "Alive" : "Idle"}
                    </span>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-white/70">No result data found.</p>
          )}

          <div className="mt-8 flex gap-3">
            <Link
              href="/play"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
            >
              Play Again
            </Link>
            <Link href="/" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
              Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-black flex items-center justify-center">Loading...</div>}>
      <ResultPageContent />
    </Suspense>
  );
}
