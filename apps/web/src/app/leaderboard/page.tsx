"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
const POLL_MS = 15_000;

type SortKey = "xp" | "points" | "currentStreak";

type LeaderboardEntry = {
  rank: number;
  id: number;
  username: string;
  walletAddress: string | null;
  xp: number;
  level: number;
  points: number;
  currentStreak: number;
  geekBalance: number;
  favoriteCharacter: string;
};

const SORT_TABS: { key: SortKey; label: string }[] = [
  { key: "xp",            label: "XP"      },
  { key: "points",        label: "Points"  },
  { key: "currentStreak", label: "Streak"  },
];

function medal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

function rankColor(rank: number) {
  if (rank === 1) return "text-[var(--brand-accent)]";
  if (rank === 2) return "text-[var(--text-3)]";
  if (rank === 3) return "text-[#b87333]";
  return "text-[var(--text-3)]";
}

function shortWallet(addr: string | null) {
  if (!addr) return null;
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-[10px] tracking-widest text-[var(--text-3)] uppercase font-semibold">{label}</div>
      <div className="font-extrabold text-lg text-[var(--text-1)]">{value}</div>
    </div>
  );
}

export default function LeaderboardPage() {
  const { user: me } = useAuth();
  const [entries, setEntries]     = useState<LeaderboardEntry[]>([]);
  const [sort, setSort]           = useState<SortKey>("xp");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [pulse, setPulse]         = useState(false);
  const timerRef                  = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLeaderboard = useCallback(async (s: SortKey, silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/leaderboard/top?limit=50&sort=${s}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setEntries(json.data ?? []);
      setUpdatedAt(new Date());
      if (silent) {
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
      }
    } catch {
      setError("Could not load leaderboard. Retrying…");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + re-fetch when sort changes
  useEffect(() => {
    fetchLeaderboard(sort);
  }, [sort, fetchLeaderboard]);

  // Real-time polling
  useEffect(() => {
    timerRef.current = setInterval(() => fetchLeaderboard(sort, true), POLL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sort, fetchLeaderboard]);

  const myRank = me ? entries.findIndex((e) => e.id === me.id) + 1 : 0;

  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-[var(--text-1)]">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-8">
          <div className="badge-pill text-[var(--brand-accent)] mb-4">Global Rankings</div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <h1 className="font-extrabold text-5xl text-[var(--text-1)]">
              Leader<span className="text-[var(--brand-primary)]">board</span>
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-[var(--text-3)] font-semibold">
              <span
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                  pulse ? "bg-[var(--brand-primary)]" : "bg-[var(--brand-secondary)] animate-pulse"
                }`}
              />
              LIVE · updates every {POLL_MS / 1000}s
              {updatedAt && (
                <span className="text-[var(--text-3)]">
                  · last {updatedAt.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* My rank banner */}
        {me && myRank > 0 && (
          <div className="rounded-2xl border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/5 px-5 py-3 mb-6 flex items-center justify-between text-sm font-semibold">
            <span className="text-[var(--brand-primary)]">Your rank</span>
            <span className="text-[var(--text-1)] font-bold">#{myRank}</span>
          </div>
        )}

        {/* Sort tabs */}
        <div className="flex gap-1 mb-6 rounded-full bg-[var(--surface-2)] p-1">
          {SORT_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setSort(t.key)}
              className={`flex-1 py-2.5 rounded-full text-xs font-bold tracking-wide transition ${
                sort === t.key
                  ? "bg-[var(--brand-primary)] text-white shadow-[var(--shadow-brand)]"
                  : "text-[var(--text-3)] hover:text-[var(--text-1)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-[var(--brand-tertiary)]/30 bg-[var(--brand-tertiary)]/10 px-4 py-3 text-xs text-[var(--brand-tertiary)] mb-4 font-semibold">
            ✗ {error}
          </div>
        )}

        {/* Table */}
        <div className="soft-card overflow-hidden">

          {/* Column headers */}
          <div className="grid grid-cols-[48px_1fr_80px_80px_80px] gap-0 border-b border-[var(--border-soft)] px-4 py-2">
            {["#", "PLAYER", "XP", "PTS", sort === "currentStreak" ? "STREAK" : "LVL"].map((h) => (
              <div key={h} className="text-[10px] tracking-widest text-[var(--text-3)] text-center first:text-left font-semibold">
                {h}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center text-[var(--text-3)] text-sm py-20">
              No players yet. Be the first!
            </div>
          ) : (
            <div>
              {entries.map((entry, idx) => {
                const isMe = me?.id === entry.id;
                const m = medal(entry.rank);
                return (
                  <div
                    key={entry.id}
                    className={`grid grid-cols-[48px_1fr_80px_80px_80px] gap-0 px-4 py-3 border-b border-[var(--border-soft)] last:border-0 transition-colors ${
                      isMe
                        ? "bg-[var(--brand-primary)]/5 border-l-2 border-l-[var(--brand-primary)]"
                        : idx % 2 === 0
                        ? "bg-transparent hover:bg-[var(--surface-2)]"
                        : "bg-[var(--surface-2)]/40 hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    {/* Rank */}
                    <div className={`font-extrabold text-xl flex items-center ${rankColor(entry.rank)}`}>
                      {m ?? `#${entry.rank}`}
                    </div>

                    {/* Player */}
                    <div className="flex flex-col justify-center min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-lg truncate ${isMe ? "text-[var(--brand-primary)]" : "text-[var(--text-1)]"}`}>
                          {entry.username}
                          {isMe && <span className="ml-1 text-[10px] text-[var(--brand-primary)]/60 font-semibold">(you)</span>}
                        </span>
                        {entry.favoriteCharacter === "GIGA" ? (
                          <span className="text-[10px] hidden sm:block">🤖</span>
                        ) : (
                          <span className="text-[10px] hidden sm:block">🧠</span>
                        )}
                      </div>
                      {entry.walletAddress && (
                        <span className="text-[10px] text-[var(--text-3)] truncate hidden sm:block">
                          {shortWallet(entry.walletAddress)}
                        </span>
                      )}
                    </div>

                    {/* XP */}
                    <div className="flex items-center justify-center">
                      <StatCell label="" value={entry.xp.toLocaleString()} />
                    </div>

                    {/* Points */}
                    <div className="flex items-center justify-center">
                      <StatCell label="" value={entry.points.toLocaleString()} />
                    </div>

                    {/* Level or Streak */}
                    <div className="flex items-center justify-center">
                      {sort === "currentStreak" ? (
                        <span className="font-extrabold text-lg text-[var(--brand-accent)]">
                          {entry.currentStreak}🔥
                        </span>
                      ) : (
                        <span className="font-extrabold text-lg text-[var(--brand-primary)]">
                          Lv.{entry.level}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-[10px] text-[var(--text-3)] text-center mt-4">
          Top 50 players · sorted by {sort === "currentStreak" ? "streak" : sort.toUpperCase()} · auto-refreshes every {POLL_MS / 1000}s
        </p>
      </div>

      <Footer />
    </div>
  );
}
