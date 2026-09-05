"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

// Must stay in step with getDailyTheme() in apps/api/src/routes/quiz.ts —
// this is only a preview label; the server decides the real theme.
const THEMES = [
  "Kaspa Origins", "GHOSTDAG & BlockDAG", "Mining & Consensus",
  "Tokenomics", "Wallets & Addresses", "KRC-20 & Smart Contracts",
  "Kaspa Ecosystem", "Crypto Fundamentals",
];
function getTodayTheme() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000);
  return THEMES[dayOfYear % THEMES.length];
}

const TILE_COLORS = ["var(--brand-primary)", "var(--brand-secondary)", "var(--brand-accent)", "var(--brand-tertiary)", "var(--brand-primary-light)"];

export default function DashboardPage() {
  const { user, status } = useAuth();
  const router = useRouter();
  const todayTheme = getTodayTheme();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/login");
  }, [status, router]);

  useEffect(() => {
    fetch(`${API}/health`, { credentials: "include" })
      .then((r) => r.json())
      .catch(() => null);
  }, []);

  if (status === "idle" || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  const xpForLevel = (lvl: number) => lvl * 1000;
  const xpPct = Math.min(100, Math.round(
    ((user.xp - xpForLevel(user.level)) / (xpForLevel(user.level + 1) - xpForLevel(user.level))) * 100
  ));

  return (
    <div className="min-h-screen text-[var(--text-1)]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Welcome */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--text-3)] mb-1">Good to see you!</p>
            <h1 className="font-extrabold text-4xl text-[var(--text-1)]">
              Hey, <span className="text-[var(--brand-primary)]">{user.username}</span>
            </h1>
            <p className="text-sm text-[var(--text-3)] mt-1">
              Level {user.level} · {user.xp.toLocaleString()} XP · 🔥 {user.currentStreak} day streak
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-[var(--surface-2)] border-2 border-[var(--ink)] px-4 py-2 text-white font-bold text-sm shadow-[var(--shadow-hard-sm)] gp-mono">
            💎 {user.points.toLocaleString()}
          </div>
        </div>

        {/* XP bar */}
        <div className="soft-card p-5 mb-8">
          <div className="flex justify-between text-xs font-semibold text-[var(--text-3)] mb-2">
            <span>LEVEL {user.level}</span>
            <span>{xpPct}% TO LEVEL {user.level + 1}</span>
          </div>
          <div className="h-2.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
            <div className="h-full rounded-full bg-[var(--brand-secondary)] transition-all" style={{ width: `${xpPct}%` }} />
          </div>
        </div>

        {/* Geek Gauntlet — the headline mode. A quiz you fight your way through,
            so it leads the dashboard and the Daily Quiz sits under it. Kept
            deliberately tight on mobile: the card sells the mode, it does not
            need to explain it twice. */}
        <div
          className="relative mb-6 overflow-hidden rounded-3xl border-2 p-4 sm:p-7"
          style={{
            borderColor: "var(--gp-cyan)",
            background: "var(--surface-1)",
            boxShadow: "6px 6px 0px 0px var(--gp-cyan-dark)",
          }}
        >
          <div className="gp-dot-grid" aria-hidden />

          <div className="relative flex items-center gap-3 sm:gap-6">
            <div className="min-w-0 flex-1">
              <div
                className="gp-pixel mb-2 inline-block rounded-lg border-2 px-2 py-1 text-[7px] sm:px-2.5 sm:py-1 sm:text-[9px]"
                style={{ borderColor: "var(--ink)", background: "var(--gp-pink)", color: "var(--ink)" }}
              >
                FIGHTING QUIZ · 10 ROUNDS
              </div>
              <h2
                className="gp-arcade text-xl leading-none sm:text-4xl"
                style={{
                  color: "var(--gp-white)",
                  textShadow: "2px 2px 0 var(--gp-cyan-dark), 4px 4px 0 var(--ink)",
                }}
              >
                THE GEEK GAUNTLET
              </h2>
              <p className="mt-2 text-xs font-semibold leading-snug text-[var(--text-2)] sm:text-base">
                Answer to attack. Fast hits harder, wrong gives the Wraith an opening.
              </p>

              <Link
                href="/gauntlet/setup"
                className="gp-arcade mt-3 inline-flex rounded-xl border-2 px-4 py-2.5 text-xs transition-transform hover:-translate-y-[2px] active:translate-y-[1px] sm:mt-5 sm:px-8 sm:py-3.5 sm:text-base"
                style={{
                  borderColor: "var(--ink)",
                  background: "var(--gp-cyan)",
                  color: "var(--ink)",
                  boxShadow: "4px 4px 0 0 var(--gp-cyan-dark)",
                }}
              >
                ENTER THE ARENA →
              </Link>
            </div>

            {/* The combatants, so the mode sells itself without more copy. */}
            <div className="flex shrink-0 items-end justify-center gap-1 sm:gap-3">
              <Image
                src="/game/giga-portrait.webp"
                alt="Giga"
                width={160}
                height={230}
                unoptimized
                className="h-16 w-auto sm:h-36"
              />
              <span className="gp-arcade pb-3 text-[10px] sm:text-2xl" style={{ color: "var(--gp-danger)" }}>
                VS
              </span>
              <Image
                src="/game/wraith-portrait.webp"
                alt="The Hype Wraith"
                width={186}
                height={230}
                unoptimized
                className="h-[4.5rem] w-auto sm:h-40"
              />
            </div>
          </div>
        </div>

        {/* Daily Quiz — Hero CTA */}
        <div className="relative rounded-3xl border-2 border-[var(--gp-pink)] bg-[var(--surface-1)] p-8 mb-8 overflow-hidden shadow-[6px_6px_0px_0px_var(--gp-pink-dark)]">
          <img
            src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1400&q=80"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-[rgba(10,10,18,0.55)]" aria-hidden />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="text-xs font-bold tracking-wide text-white/80 mb-2 uppercase">
                Today · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              </div>
              <h2 className="font-extrabold text-4xl text-white mb-1 glow-cyan">Daily Quiz</h2>
              <div className="font-bold text-xl text-white/90 mb-3">Theme: {todayTheme}</div>
              <div className="flex flex-wrap gap-3 text-xs text-white/80 font-semibold">
                <span>10 Questions</span>
                <span>·</span>
                <span>15s per question</span>
                <span>·</span>
                <span>Speed + combo bonuses</span>
              </div>
            </div>
            <Link
              href="/quiz/daily"
              className="pill-btn pill-btn-white shrink-0 text-lg px-8 py-3"
            >
              Play Now →
            </Link>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Points",       value: user.points.toLocaleString(), color: "var(--brand-primary)" },
            { label: "$GEEK Balance", value: user.geekBalance.toFixed(2), color: "var(--brand-secondary)" },
            { label: "Streak",       value: `${user.currentStreak}🔥`, color: "var(--brand-accent)" },
            { label: "Multiplier",   value: `×${user.streakBonusMultiplier.toFixed(2)}`, color: "var(--brand-tertiary)" },
          ].map((s) => (
            <div key={s.label} className="stat-tile p-5" style={{ background: s.color }}>
              <div className="text-[11px] tracking-wide text-white/80 uppercase mb-1 font-semibold">{s.label}</div>
              <div className="font-extrabold text-2xl text-white">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { href: "/leaderboard",  label: "Leaderboard", icon: "🏆", desc: "See global rankings" },
            { href: "/profile",     label: "Profile",     icon: "👤", desc: "Your stats & achievements" },
            { href: "/token",        label: "$GEEK Market", icon: "💱", desc: "Buy, sell & trade tokens" },
            { href: "/cce",         label: "CCE",         icon: "✍️", desc: user.level >= 10 ? "Create & review questions" : `Unlocks at Level 10 (you: ${user.level})` },
          ].map((l, i) => (
            <Link key={l.href} href={l.href} className="soft-card p-5 transition hover:-translate-y-0.5 group">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl mb-3"
                style={{ background: TILE_COLORS[i % TILE_COLORS.length] }}
              >
                {l.icon}
              </div>
              <div className="font-extrabold text-lg text-[var(--text-1)] group-hover:text-[var(--brand-primary)] transition">{l.label}</div>
              <div className="text-xs text-[var(--text-3)] mt-1">{l.desc}</div>
            </Link>
          ))}
        </div>

        {/* Character affinities */}
        <div className="soft-card p-6">
          <div className="text-xs font-bold tracking-wide text-[var(--text-3)] uppercase mb-4">Character Affinities</div>
          <div className="space-y-4">
            {[
              { name: "GIGA", value: user.characterAffinityGiga, color: "var(--brand-accent)", icon: "🤖" },
              { name: "A.C.E", value: user.characterAffinityAce, color: "var(--brand-primary)", icon: "🧠" },
            ].map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[var(--text-2)]">{c.icon} {c.name}</span>
                  <span className="text-[var(--text-3)]">{Math.round(c.value)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${c.value}%`, background: c.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
