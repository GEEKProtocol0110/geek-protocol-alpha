"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

type Creator = {
  rank: number;
  id: number;
  username: string;
  level: number;
  questionsApproved: number;
  questionsSubmitted: number;
  approvalRate: number;
  totalEarnedGeek: number;
  reviewsCompleted: number;
};

export default function CCELeaderboard() {
  const { status, token, user } = useAuth();
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/login");
  }, [status, router]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/cce/leaderboard`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 403) { router.replace("/cce"); return; }
      const j = await res.json();
      setCreators(j.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    if (status === "authenticated") fetchLeaderboard();
  }, [status, fetchLeaderboard]);

  // Poll every 60s
  useEffect(() => {
    if (status !== "authenticated") return;
    const id = setInterval(fetchLeaderboard, 60_000);
    return () => clearInterval(id);
  }, [status, fetchLeaderboard]);

  const rankIcon = (r: number) => r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : `#${r}`;

  if (status === "idle" || status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[var(--text-1)]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12">

        <Link href="/cce" className="text-xs text-[var(--text-3)] hover:text-[var(--brand-primary)] transition mb-6 inline-block font-semibold">← CCE Dashboard</Link>

        <div className="badge-pill text-[var(--brand-accent)] mb-4">CCE Leaderboard</div>
        <h1 className="font-extrabold text-4xl text-[var(--text-1)] mb-1">Top Creators</h1>
        <p className="text-xs text-[var(--text-3)] mb-8">Ranked by total $GEEK earned from questions being played</p>

        {creators.length === 0 ? (
          <div className="soft-card p-12 text-center">
            <div className="text-4xl mb-4">🏆</div>
            <div className="font-extrabold text-xl text-[var(--text-1)] mb-2">No Creators Yet</div>
            <p className="text-xs text-[var(--text-3)] mb-6">Be the first to get a question approved!</p>
            <Link href="/cce/submit" className="pill-btn pill-btn-primary text-xl px-8">
              Submit Question
            </Link>
          </div>
        ) : (
          <>
            {/* Top 3 podium */}
            {creators.length >= 1 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {creators.slice(0, 3).map((c) => (
                  <div
                    key={c.id}
                    className={`soft-card p-5 text-center ${
                      c.rank === 1 ? "ring-2 ring-[var(--brand-accent)]/50" : c.rank === 2 ? "ring-2 ring-[var(--text-3)]/30" : "ring-2 ring-[#b87333]/30"
                    } ${c.id === user?.id ? "bg-[var(--brand-primary)]/5" : ""}`}
                  >
                    <div className="text-3xl mb-2">{rankIcon(c.rank)}</div>
                    <div className="font-extrabold text-xl text-[var(--text-1)] mb-1 truncate">{c.username}</div>
                    <div className="text-[10px] text-[var(--text-3)] mb-3 font-semibold">Lv. {c.level}</div>
                    <div className="font-extrabold text-2xl text-[var(--brand-accent)]">{c.totalEarnedGeek.toFixed(2)}</div>
                    <div className="text-[10px] text-[var(--text-3)] font-semibold">$GEEK EARNED</div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                      <div>
                        <div className="font-extrabold text-lg text-[var(--brand-secondary)]">{c.questionsApproved}</div>
                        <div className="text-[10px] text-[var(--text-3)] font-semibold">APPROVED</div>
                      </div>
                      <div>
                        <div className="font-extrabold text-lg text-[var(--brand-primary)]">{c.approvalRate}%</div>
                        <div className="text-[10px] text-[var(--text-3)] font-semibold">RATE</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Full table */}
            <div className="soft-card overflow-hidden">
              <div className="grid grid-cols-[40px_1fr_60px_80px_80px_80px] gap-0 bg-[var(--surface-2)] border-b border-[var(--border-soft)] px-4 py-2">
                {["#", "CREATOR", "LVL", "APPROVED", "RATE", "$GEEK"].map((h) => (
                  <div key={h} className="text-[10px] tracking-widest text-[var(--text-3)] font-semibold">{h}</div>
                ))}
              </div>
              {creators.map((c) => (
                <div
                  key={c.id}
                  className={`grid grid-cols-[40px_1fr_60px_80px_80px_80px] gap-0 items-center px-4 py-3 border-b border-[var(--border-soft)] last:border-0 hover:bg-[var(--surface-2)] transition ${
                    c.id === user?.id ? "bg-[var(--brand-primary)]/5" : ""
                  }`}
                >
                  <div className="text-sm text-[var(--text-3)] font-semibold">{rankIcon(c.rank)}</div>
                  <div className="text-sm text-[var(--text-1)] truncate font-medium">
                    {c.username}
                    {c.id === user?.id && <span className="text-[var(--brand-primary)] text-[10px] ml-1">(you)</span>}
                  </div>
                  <div className="text-xs text-[var(--text-3)]">{c.level}</div>
                  <div className="font-extrabold text-lg text-[var(--brand-secondary)]">{c.questionsApproved}</div>
                  <div className="text-xs text-[var(--text-2)] font-semibold">{c.approvalRate}%</div>
                  <div className="font-extrabold text-lg text-[var(--brand-accent)]">{c.totalEarnedGeek.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
