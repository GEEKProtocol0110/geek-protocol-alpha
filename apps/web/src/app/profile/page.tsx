"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWallet } from "@/components/WalletProvider";
import { getCurrentUser, getUserStats } from "@/lib/api";
import { shortAddr } from "@/lib/kasware";

type UserStats = {
  id: string;
  walletAddress: string;
  xp: number;
  level: number;
  streak: number;
  totalAttempts: number;
  avgScore: number;
  recentAttempts: Array<{
    id: string;
    score: number;
    scorePct: number;
    category: string;
    createdAt: string;
  }>;
};

export default function ProfilePage() {
  const { address, sessionVersion } = useWallet();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!address) {
      setStats(null);
      setError("Please connect your wallet to view profile");
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const user = await getCurrentUser();
        if (cancelled) return;
        if (!user) {
          setError("Complete the KasWare signature to view your profile");
          setStats(null);
          return;
        }
        const data = await getUserStats(user.id);
        if (cancelled) return;
        setStats(data as UserStats);
      } catch (err) {
        if (cancelled) return;
        setStats(null);
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address, sessionVersion]);

  return (
    <main className="min-h-dvh bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Profile</h1>
          <Link href="/" className="text-sm text-white/70 hover:text-white">
            ← Home
          </Link>
        </div>

        {!address ? (
          <div className="rounded-lg border border-white/20 bg-white/5 px-6 py-8 text-center">
            <p className="mb-4 text-white/60">Connect your wallet to view your profile</p>
            <Link href="/" className="text-cyan-400 hover:text-cyan-300">
              Return to home and connect
            </Link>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-6 py-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : loading ? (
          <div className="text-center text-white/60">Loading profile...</div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Wallet Info */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold mb-4">Wallet</h2>
              <p className="font-mono text-white/80">
                {shortAddr(stats.walletAddress)}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="XP" value={stats.xp.toString()} />
              <StatCard label="Level" value={stats.level.toString()} />
              <StatCard label="Streak" value={stats.streak.toString()} />
              <StatCard label="Attempts" value={stats.totalAttempts.toString()} />
            </div>

            {/* Recent Attempts */}
            {stats.recentAttempts.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-xl font-semibold mb-4">Recent Attempts</h3>
                <div className="space-y-3">
                  {stats.recentAttempts.map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{attempt.category}</p>
                        <p className="text-xs text-white/60">{new Date(attempt.createdAt).toLocaleDateString()}</p>
                      </div>
                      <p className="font-semibold text-emerald-400">{attempt.scorePct.toFixed(0)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-6 text-center">
      <p className="text-sm font-medium text-white/60">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
