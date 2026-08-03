"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { playSfx } from "@/lib/sfx";
import { speak } from "@/lib/voice";
import { stopMusic } from "@/lib/music";

/**
 * Rank tiers. Colour carries the verdict, so each tier names its own extrusion
 * shade — the headline is drawn with a hard offset text-shadow rather than a
 * glow, matching the flat/hard-shadow house style.
 */
function getRank(pct: number) {
  if (pct === 100)
    return { name: "PERFECT", color: "var(--gp-gold)", shade: "var(--gp-gold-dark)",
             bubble: "Flawless!", tagline: "Nobody's beating that today." };
  if (pct >= 80)
    return { name: "EXCELLENT", color: "var(--gp-cyan)", shade: "var(--gp-cyan-dark)",
             bubble: "Outstanding!", tagline: "You really know this stuff." };
  if (pct >= 60)
    return { name: "SOLID", color: "var(--gp-cyan)", shade: "var(--gp-cyan-dark)",
             bubble: "Nice work!", tagline: "Consistent. Keep the streak alive." };
  if (pct >= 40)
    return { name: "LEARNING", color: "var(--gp-violet)", shade: "var(--gp-violet-dark)",
             bubble: "Getting there…", tagline: "You're closing the gap. Run it back." };
  return { name: "TRY AGAIN", color: "var(--gp-violet)", shade: "var(--gp-violet-dark)",
           bubble: "…", tagline: "Every round makes you sharper." };
}

/** Fixed scatter so the field is identical on server and client. */
const SPECKS = [
  { x: "6%",  y: "12%", c: "var(--gp-pink)",   s: 7 },
  { x: "17%", y: "6%",  c: "var(--gp-cyan)",   s: 5 },
  { x: "11%", y: "34%", c: "var(--gp-white)",  s: 4 },
  { x: "4%",  y: "58%", c: "var(--gp-gold)",   s: 6 },
  { x: "14%", y: "78%", c: "var(--gp-pink)",   s: 5 },
  { x: "8%",  y: "88%", c: "var(--gp-cyan)",   s: 6 },
  { x: "22%", y: "52%", c: "var(--gp-violet)", s: 5 },
  { x: "31%", y: "9%",  c: "var(--gp-cyan)",   s: 4 },
  { x: "85%", y: "8%",  c: "var(--gp-pink)",   s: 6 },
  { x: "93%", y: "18%", c: "var(--gp-cyan)",   s: 5 },
  { x: "88%", y: "38%", c: "var(--gp-violet)", s: 6 },
  { x: "95%", y: "56%", c: "var(--gp-gold)",   s: 5 },
  { x: "82%", y: "72%", c: "var(--gp-cyan)",   s: 6 },
  { x: "91%", y: "86%", c: "var(--gp-pink)",   s: 5 },
  { x: "76%", y: "24%", c: "var(--gp-white)",  s: 4 },
  { x: "69%", y: "92%", c: "var(--gp-violet)", s: 5 },
];

function ResultsContent() {
  const params = useSearchParams();
  const correct = parseInt(params.get("correct") ?? "0");
  const total   = parseInt(params.get("total") ?? "10");
  const points  = parseInt(params.get("points") ?? "0");
  const xp      = parseInt(params.get("xp") ?? "0");
  const geek    = params.get("geek") ?? "0";
  const combo   = parseInt(params.get("combo") ?? "0");
  const theme   = params.get("theme") ?? "Daily Quiz";
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const rank = getRank(accuracy);

  useEffect(() => {
    // The quiz music belongs to the quiz; the results screen is quiet.
    stopMusic();
    playSfx("fanfare", { success: accuracy >= 60 });
    // The sign-off is spoken here rather than at submit — navigating away
    // mid-sentence cut the line off before the player ever heard it.
    const t = window.setTimeout(
      () => speak(accuracy >= 60 ? "finishStrong" : "finishWeak", "GIGA"),
      700
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const TILES = [
    { label: "Correct Answers", value: `${correct}/${total}`, color: "var(--text-1)" },
    { label: "Total Points",    value: points.toLocaleString(), color: "var(--text-1)" },
    { label: "XP Earned",       value: `+${xp} XP`, color: "var(--gp-cyan)" },
    { label: "$GEEK Earned",    value: `+${geek} GEEK`, color: "var(--gp-gold)" },
    { label: "Best Combo",      value: combo > 0 ? `🔥 ×${combo}` : "—", color: "var(--text-1)" },
    { label: "Accuracy",        value: `${accuracy}%`, color: "var(--text-1)", highlight: true },
  ];

  return (
    <div className="min-h-screen text-[var(--text-1)]">
      <Navbar />

      <div className="relative max-w-3xl mx-auto px-4 py-10 md:py-14">
        {/* Speck field — decorative */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {SPECKS.map((p, i) => (
            <span key={i} className="absolute rounded-[2px]"
                  style={{ left: p.x, top: p.y, width: p.s, height: p.s, background: p.c }} />
          ))}
        </div>

        <div className="relative">
          {/* Header pill */}
          <div className="flex justify-center mb-6">
            <span className="px-5 py-2 rounded-xl border-[3px] border-[var(--ink)] text-xs md:text-sm font-extrabold tracking-widest uppercase text-white text-center"
                  style={{ background: "var(--gp-violet)", boxShadow: "4px 4px 0 0 var(--ink)" }}>
              Daily Quiz Complete · {theme}
            </span>
          </div>

          {/* Mascot + reaction bubble */}
          <div className="relative flex justify-center mb-4 md:mb-3">
            <Image
              src="/mascot-quiz.png"
              alt=""
              width={236}
              height={306}
              priority
              aria-hidden="true"
              className="w-[150px] md:w-[190px] h-auto select-none"
            />
            <span
              className="absolute top-2 left-[calc(50%+58px)] md:left-[calc(50%+72px)] px-4 py-2 rounded-2xl border-[3px] border-[var(--ink)] bg-white text-[var(--ink)] font-extrabold text-base md:text-lg leading-none whitespace-nowrap"
              style={{ boxShadow: "4px 4px 0 0 var(--ink)" }}
            >
              {rank.bubble}
            </span>
          </div>

          {/* Verdict */}
          <h1
            className="text-center font-extrabold leading-none tracking-tight text-[clamp(2.75rem,11vw,6rem)]"
            style={{ color: rank.color, textShadow: `5px 5px 0 ${rank.shade}` }}
          >
            {rank.name}
          </h1>
          <p className="text-center text-[var(--text-2)] font-semibold mt-3 mb-8 text-lg">
            {accuracy}% accuracy
          </p>

          {/* Score breakdown */}
          <div className="rounded-[20px] border-[3px] border-[var(--ink)] bg-[#0B0B14] p-5 md:p-7 mb-5"
               style={{ boxShadow: "6px 6px 0 0 var(--ink)" }}>
            <div className="text-[11px] tracking-widest font-extrabold uppercase mb-4"
                 style={{ color: "var(--gp-pink)" }}>
              Score Breakdown
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {TILES.map((t) => (
                <div
                  key={t.label}
                  className="rounded-xl border-2 bg-[#12121D] px-3 py-4 text-center"
                  style={{ borderColor: t.highlight ? "var(--gp-pink)" : "var(--border-soft)" }}
                >
                  <div className="text-[10px] tracking-widest uppercase font-bold text-[var(--text-3)] mb-1.5">
                    {t.label}
                  </div>
                  <div className="font-extrabold text-2xl md:text-[26px] leading-none tabular-nums"
                       style={{ color: t.color }}>
                    {t.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {accuracy === 100 && (
            <div className="rounded-xl border-[3px] border-[var(--ink)] p-4 mb-5 text-center text-sm font-extrabold text-[var(--ink)]"
                 style={{ background: "var(--gp-gold)", boxShadow: "4px 4px 0 0 var(--gp-gold-dark)" }}>
              🏆 Perfect score — every single question correct.
            </div>
          )}

          <p className="text-center text-[var(--text-3)] font-semibold mb-6">{rank.tagline}</p>

          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <Link
              href="/quiz/daily"
              className="q-option flex items-center justify-center px-6 py-4 text-lg font-extrabold text-center"
              style={{ background: "var(--gp-cyan)", color: "var(--ink)", boxShadow: "5px 5px 0 0 var(--gp-cyan-dark)" }}
            >
              Play Again
            </Link>
            <Link
              href="/dashboard"
              className="q-option flex items-center justify-center px-6 py-4 text-lg font-extrabold text-center text-[var(--text-1)]"
            >
              Dashboard
            </Link>
            <Link
              href="/leaderboard"
              className="q-option flex items-center justify-center px-6 py-4 text-lg font-extrabold text-center"
              style={{ background: "#0B0B14", color: "var(--gp-cyan)", borderColor: "var(--gp-cyan)" }}
            >
              Leaderboard
            </Link>
          </div>
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
