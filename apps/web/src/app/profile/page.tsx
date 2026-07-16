"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] px-4 py-3">
      <div className="text-xs uppercase tracking-widest text-[var(--text-3)] font-semibold">{label}</div>
      <div className="mt-1 text-lg font-bold text-[var(--text-1)]">{value}</div>
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
        <span className="font-semibold text-[var(--text-2)]">{label}</span>
        <span className="text-[var(--text-3)]">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
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
      <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[var(--surface-0)]">
        <div className="text-[var(--text-3)] animate-pulse text-sm">Loading profile…</div>
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
    <div className="min-h-screen bg-[var(--surface-0)]">
      <main className="mx-auto max-w-2xl px-4 py-12">
        {/* Avatar + headline */}
        <div className="mb-8 flex items-center gap-5">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-[var(--brand-primary)]/10 text-3xl">
            {user.favoriteCharacter === "GIGA" ? "🤖" : "🧠"}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-1)]">{user.username}</h1>
            <p className="mt-0.5 text-sm text-[var(--text-3)]">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="badge-pill text-[var(--brand-primary)]">
                {user.levelStage ?? `Level ${user.level}`}
              </span>
              {user.isAdmin && (
                <span className="badge-pill text-[var(--brand-accent)]">
                  Admin
                </span>
              )}
              {user.role !== "player" && !user.isAdmin && (
                <span className="badge-pill text-[var(--text-2)]">
                  {user.role}
                </span>
              )}
              {user.walletAddress && (
                <span className="badge-pill text-[var(--brand-secondary)]">
                  Wallet linked
                </span>
              )}
            </div>
          </div>
        </div>

        {/* XP progress bar */}
        <div className="layer-card mb-6 p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--text-2)]">XP Progress</span>
            <span className="text-xs text-[var(--text-3)]">
              {user.xp.toLocaleString()} XP · {xpProgress}% to next level
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full bg-[var(--brand-secondary)] transition-all duration-500"
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
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--text-3)]">
            Affinity & Multipliers
          </h2>
          <div className="mb-4 flex items-center justify-between rounded-xl bg-[var(--surface-2)] px-4 py-3">
            <span className="text-sm text-[var(--text-2)]">Streak Multiplier</span>
            <span className="font-bold text-[var(--brand-primary)]">
              ×{(user.streakMultiplier ?? user.streakBonusMultiplier).toFixed(2)}
            </span>
          </div>
          <div className="space-y-3">
            <AffinityBar
              label="GIGA Affinity"
              value={user.characterAffinities?.GIGA ?? user.characterAffinityGiga}
              color="bg-[var(--brand-accent)]"
            />
            <AffinityBar
              label="A.C.E Affinity"
              value={user.characterAffinities?.ACE ?? user.characterAffinityAce}
              color="bg-[var(--brand-primary)]"
            />
          </div>
        </div>

        {/* Wallet */}
        {user.walletAddress && (
          <div className="layer-card mb-6 p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--text-3)]">
              Kaspa Wallet
            </h2>
            <p className="break-all text-xs text-[var(--text-2)]">{user.walletAddress}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/play"
            className="pill-btn pill-btn-primary"
          >
            Play Gauntlet
          </Link>
          <Link
            href="/leaderboard"
            className="rounded-full bg-[var(--surface-2)] px-5 py-2.5 text-sm font-semibold text-[var(--text-2)] transition hover:bg-[var(--surface-3)]"
          >
            Leaderboard
          </Link>
          <button
            onClick={() => signOut().then(() => router.push("/"))}
            className="rounded-full bg-[var(--brand-tertiary)]/10 px-5 py-2.5 text-sm font-semibold text-[var(--brand-tertiary)] transition hover:bg-[var(--brand-tertiary)]/15"
          >
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
}

