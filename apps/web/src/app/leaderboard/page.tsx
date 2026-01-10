"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLeaderboard } from "@/lib/api";

type LeaderboardEntry = {
  id: string;
  walletAddress: string;
  xp: number;
  level: number;
  streak: number;
  rank: number;
};

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getLeaderboard(100);
        setEntries(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <main className="min-h-dvh bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Leaderboard</h1>
            <p className="mt-1 text-white/60">Top players by XP</p>
          </div>
          <Link href="/" className="text-sm text-white/70 hover:text-white">
            ← Home
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center text-white/60">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-8 text-center">
            <p className="text-white/60">No leaderboard data yet</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-white/60">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-white/60">Wallet</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-white/60">XP</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase text-white/60">Level</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase text-white/60">Streak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-white/5">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-white">#{entry.rank}</span>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs text-white/80">
                          {entry.walletAddress.slice(0, 8)}...{entry.walletAddress.slice(-4)}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-emerald-400">{entry.xp}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block rounded-full bg-blue-500/20 px-3 py-1 text-sm font-semibold text-blue-400">
                          {entry.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-white">{entry.streak}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
