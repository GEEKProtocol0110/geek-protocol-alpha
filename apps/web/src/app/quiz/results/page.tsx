"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { playSfx } from "@/lib/sfx";

function getRankBadge(pct: number) {
  if (pct === 100) return { badge: "🏆", name: "PERFECT", color: "text-[var(--brand-accent)]", bg: "bg-[var(--brand-accent)]" };
  if (pct >= 80)  return { badge: "⭐", name: "EXCELLENT", color: "text-[var(--brand-primary)]", bg: "bg-[var(--brand-primary)]" };
  if (pct >= 60)  return { badge: "✅", name: "SOLID", color: "text-[var(--brand-secondary)]", bg: "bg-[var(--brand-secondary)]" };
  if (pct >= 40)  return { badge: "📈", name: "LEARNING", color: "text-[var(--brand-primary-light)]", bg: "bg-[var(--brand-primary-light)]" };
  return { badge: "💀", name: "TRY AGAIN", color: "text-[var(--brand-tertiary)]", bg: "bg-[var(--brand-tertiary)]" };
}

function ResultsContent() {
  const params = useSearchParams();
  const correct = parseInt(params.get("correct") ?? "0");
  const total   = parseInt(params.get("total") ?? "10");
  const points  = parseInt(params.get("points") ?? "0");
  const xp      = parseInt(params.get("xp") ?? "0");
  const geek    = params.get("geek") ?? "0";
  const combo   = parseInt(params.get("combo") ?? "0");
  const theme   = params.get("theme") ?? "Daily Quiz";
  const accuracy = Math.round((correct / total) * 100);
  const rank = getRankBadge(accuracy);

  useEffect(() => {
    playSfx("fanfare", { success: accuracy >= 60 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen text-[var(--text-1)]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="badge-pill text-[var(--brand-accent)] mb-6">
            Daily Quiz Complete · {theme}
          </div>

          <div className={`${rank.bg} rounded-3xl border-[3px] border-[var(--ink)] shadow-[var(--shadow-soft)] w-28 h-28 flex items-center justify-center text-4xl mx-auto`}>
            {rank.badge}
          </div>
          <div className={`font-extrabold text-4xl ${rank.color} mb-1 mt-4`}>{rank.name}</div>
          <div className="text-sm text-[var(--text-3)] font-semibold">{accuracy}% accuracy</div>
        </div>

        {/* Score card */}
        <div className="soft-card p-8 mb-6">
          <div className="text-[10px] tracking-widest text-[var(--brand-accent)] font-bold uppercase mb-4">Score Breakdown</div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Correct Answers", value: `${correct} / ${total}` },
              { label: "Total Points",    value: points.toLocaleString() },
              { label: "XP Earned",       value: `+${xp} XP` },
              { label: "$GEEK Earned",    value: `+${geek} GEEK` },
              { label: "Best Combo",      value: combo > 0 ? `🔥 ×${combo}` : "—" },
              { label: "Accuracy",        value: `${accuracy}%` },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-[var(--surface-2)] p-4 text-center">
                <div className="text-[10px] tracking-widest text-[var(--text-3)] uppercase mb-1 font-semibold">{s.label}</div>
                <div className="font-extrabold text-2xl text-[var(--text-1)]">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Perfect bonus */}
        {accuracy === 100 && (
          <div className="rounded-2xl border border-[var(--brand-accent)]/30 bg-[var(--brand-accent)]/10 p-4 mb-6 text-center text-sm font-semibold text-[var(--brand-accent)]">
            🏆 Perfect score bonus: +50 pts — you answered every question correctly!
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/quiz/daily" className="pill-btn pill-btn-primary flex-1 text-lg py-4">
            Play Again
          </Link>
          <Link href="/dashboard" className="flex-1 text-center rounded-full soft-card hover:bg-[var(--surface-2)] text-[var(--text-1)] font-semibold text-lg py-4 transition">
            Dashboard
          </Link>
          <Link href="/leaderboard" className="flex-1 text-center rounded-full border border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/5 hover:bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-semibold text-lg py-4 transition">
            Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
