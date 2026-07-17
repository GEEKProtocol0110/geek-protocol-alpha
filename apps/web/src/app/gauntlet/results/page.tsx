"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { playSfx } from "@/lib/sfx";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

type RoundResult = {
  round: number;
  correctCount: number;
  geekEarned: number;
  xpEarned: number;
};

type Summary = {
  totalGeekEarned: number;
  totalXpEarned: number;
  highestRound: number;
  totalCorrect: number;
  totalQuestions: number;
  roundResults: RoundResult[];
};

function money(n: number) {
  return Math.round(n).toLocaleString();
}

function achievementNames(summary: Summary) {
  const names = [];
  if (summary.highestRound >= 10) names.push("Apex Protocol Finisher");
  if (summary.totalQuestions > 0 && summary.totalCorrect / summary.totalQuestions >= 0.8) names.push("Precision Operator");
  if (summary.totalGeekEarned >= 1000) names.push("GEEK Whale Runner");
  if (!names.length) names.push("Gauntlet Initiate");
  return names;
}

function ResultsContent() {
  const params = useSearchParams();
  const { user, refreshUser } = useAuth();
  const runId = Number(params.get("runId"));
  const shouldCashout = params.get("cashout") === "1";
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const firedForRunId = useRef<number | null>(null);

  useEffect(() => {
    if (!user || !runId) return;
    // Guard against double-firing (React Strict Mode re-runs effects in dev,
    // and cashout is not safe to call twice - the second call 404s because
    // the run is already marked completed after the first).
    if (shouldCashout) {
      if (firedForRunId.current === runId) return;
      firedForRunId.current = runId;
    }
    const currentUser = user;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const url = shouldCashout
          ? `${API}/api/gauntlet/run/${runId}/cashout`
          : `${API}/api/gauntlet/run/${runId}/summary`;
        const res = await fetch(url, {
          method: shouldCashout ? "POST" : "GET",
          headers: shouldCashout ? { "Content-Type": "application/json" } : undefined,
          credentials: "include",
          body: shouldCashout ? JSON.stringify({ userId: currentUser.id }) : undefined,
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Failed to load Gauntlet summary");
        if (!cancelled) {
          setSummary(json.data);
          const acc = json.data.totalQuestions ? json.data.totalCorrect / json.data.totalQuestions : 0;
          playSfx("fanfare", { success: acc >= 0.6 });
          refreshUser().catch(() => {});
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load Gauntlet summary");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshUser, runId, shouldCashout, user]);

  if (loading) {
    return (
      <Shell>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      </Shell>
    );
  }

  if (error || !summary) {
    return (
      <Shell>
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <div className="soft-card border border-[var(--brand-tertiary)]/30 p-8">
            <div className="font-extrabold text-3xl text-[var(--brand-tertiary)] mb-2">Summary Failed</div>
            <p className="text-xs text-[var(--text-3)] mb-6">{error || "No summary found."}</p>
            <Link href="/dashboard" className="pill-btn pill-btn-primary text-xl px-8">Dashboard</Link>
          </div>
        </div>
      </Shell>
    );
  }

  const accuracy = summary.totalQuestions ? Math.round((summary.totalCorrect / summary.totalQuestions) * 100) : 0;
  const achievements = achievementNames(summary);

  return (
    <Shell>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="badge-pill text-[var(--brand-accent)] mb-4">Gauntlet Run Complete</div>
          <h1 className="font-extrabold text-5xl text-[var(--text-1)]">Cashout Confirmed</h1>
          <p className="text-xs text-[var(--text-3)] mt-2">Run #{runId} has been saved to your profile.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            ["Total Correct", `${summary.totalCorrect}/${summary.totalQuestions}`],
            ["GEEK Earned", `+${money(summary.totalGeekEarned)}`],
            ["Highest Round", String(summary.highestRound)],
            ["XP Earned", `+${summary.totalXpEarned}`],
          ].map(([label, value]) => (
            <div key={label} className="soft-card p-5 text-center">
              <div className="text-[10px] tracking-widest text-[var(--text-3)] uppercase font-semibold">{label}</div>
              <div className="font-extrabold text-3xl text-[var(--brand-primary)]">{value}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-[1.3fr_0.7fr] gap-6 mb-8">
          <div className="soft-card p-6">
            <div className="text-[10px] tracking-widest text-[var(--brand-accent)] font-bold uppercase mb-4">Round Ledger</div>
            <div className="space-y-2">
              {summary.roundResults.length ? summary.roundResults.map((r) => (
                <div key={r.round} className="grid grid-cols-4 gap-2 rounded-2xl bg-[var(--surface-2)] p-3 text-xs font-semibold">
                  <span className="text-[var(--text-1)]">R{r.round}</span>
                  <span className="text-[var(--text-3)]">{r.correctCount}/10</span>
                  <span className="text-[var(--brand-primary)]">+{money(r.geekEarned)} GEEK</span>
                  <span className="text-[var(--brand-accent)]">+{r.xpEarned} XP</span>
                </div>
              )) : (
                <div className="text-xs text-[var(--text-3)]">No completed rounds were recorded.</div>
              )}
            </div>
          </div>

          <div className="soft-card p-6">
            <div className="text-[10px] tracking-widest text-[var(--brand-accent)] font-bold uppercase mb-4">Unlocks</div>
            <div className="font-extrabold text-4xl text-[var(--text-1)] mb-1">{accuracy}%</div>
            <div className="text-xs text-[var(--text-3)] mb-5">Final accuracy</div>
            <div className="space-y-2">
              {achievements.map((name) => (
                <div key={name} className="rounded-xl border border-[var(--brand-accent)]/30 bg-[var(--brand-accent)]/10 px-3 py-2 text-xs font-semibold text-[var(--brand-accent)]">{name}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/gauntlet/setup" className="pill-btn pill-btn-primary flex-1 text-2xl py-4">Run Again</Link>
          <Link href="/dashboard" className="flex-1 text-center rounded-full soft-card hover:bg-[var(--surface-2)] text-[var(--text-1)] font-semibold text-2xl py-4 transition">Dashboard</Link>
          <Link href="/leaderboard" className="flex-1 text-center rounded-full border border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/5 hover:bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-semibold text-2xl py-4 transition">Leaderboard</Link>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-[var(--text-1)]">
      <Navbar />
      {children}
    </div>
  );
}

export default function GauntletResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--surface-0)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
