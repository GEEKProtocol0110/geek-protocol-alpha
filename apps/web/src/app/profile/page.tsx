"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/4 px-4 py-3">
      <div className="text-xs uppercase tracking-widest text-white/40">{label}</div>
      <div className="mt-1 text-lg font-bold text-white">{value}</div>
    </div>
  );
}

function AffinityBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-semibold text-white/60">{label}</span>
        <span className="text-white/40">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, status, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/login");
  }, [status, router]);

  if (status === "idle" || status === "loading") {
    return (
      <main className="flex min-h-[calc(100vh-72px)] items-center justify-center">
        <div className="text-white/40 animate-pulse text-sm">Loading profile…</div>
      </main>
    );
  }

  if (!user) return null;

  const xpForLevel = (lvl: number) => lvl * 1000;
  const xpProgress =
    user.xpProgress ??
    Math.min(
      100,
      Math.round(
        ((user.xp - xpForLevel(user.level)) /
          (xpForLevel(user.level + 1) - xpForLevel(user.level))) *
          100
      )
    );

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      {/* Avatar + headline */}
      <div className="mb-8 flex items-center gap-5">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/5 text-3xl">
          {user.favoriteCharacter === "GIGA" ? "🤖" : "🧠"}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{user.username}</h1>
          <p className="mt-0.5 text-sm text-white/40">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="badge-pill border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/5 text-[var(--brand-primary)]">
              {user.levelStage ?? `Level ${user.level}`}
            </span>
            {user.isAdmin && (
              <span className="badge-pill border-amber-400/20 bg-amber-400/5 text-amber-300">
                Admin
              </span>
            )}
            {user.role !== "player" && !user.isAdmin && (
              <span className="badge-pill border-white/10 bg-white/5 text-white/50">
                {user.role}
              </span>
            )}
            {user.walletAddress && (
              <span className="badge-pill border-emerald-400/20 bg-emerald-400/5 text-emerald-300">
                Wallet linked
              </span>
            )}
          </div>
        </div>
      </div>

      {/* XP progress bar */}
      <div className="layer-card mb-6 p-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-white/70">XP Progress</span>
          <span className="text-xs text-white/40">
            {user.xp.toLocaleString()} XP · {xpProgress}% to next level
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] transition-all duration-500"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Points" value={user.points.toLocaleString()} />
        <StatCard
          label="$GEEK Balance"
          value={user.geekBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        />
        <StatCard label="Current Streak" value={`${user.currentStreak}🔥`} />
        <StatCard label="Longest Streak" value={user.longestStreak} />
      </div>

      {/* Streak multiplier + character affinities */}
      <div className="layer-card mb-6 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/40">
          Affinity & Multipliers
        </h2>
        <div className="mb-4 flex items-center justify-between rounded-xl border border-white/8 bg-white/4 px-4 py-3">
          <span className="text-sm text-white/60">Streak Multiplier</span>
          <span className="font-bold text-[var(--brand-primary)]">
            ×{(user.streakMultiplier ?? user.streakBonusMultiplier).toFixed(2)}
          </span>
        </div>
        <div className="space-y-3">
          <AffinityBar
            label="GIGA Affinity"
            value={user.characterAffinities?.GIGA ?? user.characterAffinityGiga}
            color="bg-[var(--brand-primary)]"
          />
          <AffinityBar
            label="A.C.E Affinity"
            value={user.characterAffinities?.ACE ?? user.characterAffinityAce}
            color="bg-[var(--brand-secondary)]"
          />
        </div>
      </div>

      {/* Wallet */}
      {user.walletAddress && (
        <div className="layer-card mb-6 p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/40">
            Kaspa Wallet
          </h2>
          <p className="break-all font-mono text-xs text-white/60">{user.walletAddress}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/play"
          className="rounded-xl border border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/5 px-5 py-2.5 text-sm font-semibold text-[var(--brand-primary)] transition hover:bg-[var(--brand-primary)]/10"
        >
          Play Gauntlet
        </Link>
        <Link
          href="/leaderboard"
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/8"
        >
          Leaderboard
        </Link>
        <button
          onClick={() => signOut().then(() => router.push("/"))}
          className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
        >
          Sign Out
        </button>
      </div>
    </main>
  );
}
