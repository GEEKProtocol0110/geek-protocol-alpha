"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { SfxToggle } from "@/components/SfxToggle";
import { playSfx } from "@/lib/sfx";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

// Must match the active topic names in the database — a mismatch silently
// falls back to serving questions from every topic.
const TOPICS = [
  { name: "Kaspa Origins",            icon: "📜" },
  { name: "GHOSTDAG & BlockDAG",      icon: "🕸️" },
  { name: "Mining & Consensus",       icon: "⛏️" },
  { name: "Tokenomics",               icon: "🪙" },
  { name: "Wallets & Addresses",      icon: "🔑" },
  { name: "KRC-20 & Smart Contracts", icon: "📦" },
  { name: "Kaspa Ecosystem",          icon: "🌐" },
  { name: "Crypto Fundamentals",      icon: "🧠" },
];

const ROUND_FEES = [0, 40, 100, 200, 400, 750, 1250, 2000, 3500, 6000];

export default function GauntletSetupPage() {
  const { user, status } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [resumeRun, setResumeRun] = useState<{ id: number; activeRound: number } | null>(null);
  const [checking, setChecking] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/auth/login?callbackUrl=${encodeURIComponent("/gauntlet/setup")}`);
    }
  }, [status, router]);

  // Load saved topics and check for active run
  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem("gauntlet_topics");
    if (saved) {
      try { setSelected(JSON.parse(saved)); } catch {}
    }
    (async () => {
      try {
        const res = await fetch(`${API}/api/gauntlet/run/active?userId=${user.id}`, { credentials: "include" });
        const json = await res.json();
        if (json.success && json.data) {
          const active = { id: json.data.id, activeRound: json.data.activeRound ?? 1 };
          setResumeRun(active);
          router.replace(`/gauntlet/play?runId=${active.id}&round=${active.activeRound}`);
        }
      } catch {}
      setChecking(false);
    })();
  }, [router, user]);

  function toggle(topic: string) {
    playSfx("click");
    setSelected((prev) => prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]);
  }

  async function startRun() {
    if (!user || selected.length < 2) return;
    playSfx("start");
    setStarting(true);
    localStorage.setItem("gauntlet_topics", JSON.stringify(selected));
    try {
      const res = await fetch(`${API}/api/gauntlet/run/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: user.id, selectedTopics: selected }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      router.push(`/gauntlet/play?runId=${json.data.id}&round=1`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to start");
      setStarting(false);
    }
  }

  if (status === "idle" || status === "loading" || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[var(--text-1)]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex justify-end mb-2">
          <SfxToggle />
        </div>

        {/* Neon banner */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-[var(--gp-cyan)] mb-8 h-40 shadow-[6px_6px_0px_0px_var(--gp-cyan-dark)]">
          <img
            src="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1400&q=80"
            alt="Neon arcade"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[rgba(10,10,18,0.55)]" aria-hidden />
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="badge-pill mb-4">Geek Gauntlet · Setup</div>
          <h1 className="font-extrabold text-5xl"><span className="glow-cyan text-[var(--text-1)]">Geek</span> <span className="neon-text">Gauntlet</span></h1>
          <p className="text-sm text-[var(--text-3)] mt-2">10 rounds. Progressive difficulty. Real stakes.</p>
        </div>

        {/* Resume banner */}
        {resumeRun && (
          <div className="rounded-3xl bg-[var(--brand-accent)] border-[3px] border-[var(--ink)] p-5 mb-8 flex items-center justify-between shadow-[var(--shadow-soft)]">
            <div>
              <div className="text-[10px] tracking-widest text-white/80 font-bold uppercase mb-1">Unfinished Run Detected</div>
              <div className="font-extrabold text-xl text-white">
                You have an active run — Round {resumeRun.activeRound} / 10
              </div>
              <div className="text-xs text-white/80 mt-0.5">Resume where you left off or start fresh below.</div>
            </div>
            <button
              onClick={() => router.push(`/gauntlet/play?runId=${resumeRun.id}&round=${resumeRun.activeRound}`)}
              className="pill-btn pill-btn-white shrink-0 text-lg px-6"
            >
              Resume →
            </button>
          </div>
        )}

        {/* Round overview */}
        <div className="soft-card p-6 mb-8">
          <div className="text-[10px] tracking-widest text-[var(--brand-primary)] font-bold uppercase mb-4">Round Overview</div>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {ROUND_FEES.map((fee, i) => (
              <div key={i} className="rounded-xl bg-[var(--surface-2)] p-2 text-center">
                <div className="text-[9px] text-[var(--text-3)] font-semibold">R{i + 1}</div>
                <div className="font-extrabold text-sm text-[var(--brand-primary)]">{fee === 0 ? "FREE" : fee}</div>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-[var(--text-3)] mt-2">Entry fees in $GEEK · Round 1 is always free</div>
        </div>

        {/* Topic picker */}
        <div className="soft-card p-6 mb-8">
          <div className="text-[10px] tracking-widest text-[var(--brand-accent)] font-bold uppercase mb-1">Select Topics</div>
          <div className="text-xs text-[var(--text-3)] mb-4">
            Pick at least 2. Questions will be drawn from your selection.{" "}
            <span className={selected.length < 2 ? "text-[var(--brand-tertiary)]" : "text-[var(--brand-secondary)]"}>
              {selected.length} selected
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TOPICS.map((t) => {
              const active = selected.includes(t.name);
              return (
                <button
                  key={t.name}
                  onClick={() => toggle(t.name)}
                  className={`rounded-2xl p-4 text-center transition border-[3px] border-[var(--ink)] ${
                    active
                      ? "bg-[var(--brand-primary)] text-white shadow-[var(--shadow-brand)]"
                      : "bg-[var(--surface-2)] text-[var(--text-2)] hover:bg-[var(--surface-3)]"
                  }`}
                >
                  <div className="text-2xl mb-1">{t.icon}</div>
                  <div className="text-[10px] tracking-widest font-bold">{t.name.toUpperCase()}</div>
                  {active && <div className="text-[9px] mt-1 font-semibold">✓ Selected</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={startRun}
          disabled={selected.length < 2 || starting}
          className="pill-btn pill-btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed text-2xl py-5"
        >
          {starting ? "Entering the Gauntlet…" : "Enter the Gauntlet →"}
        </button>
        {selected.length < 2 && (
          <div className="text-xs text-[var(--text-3)] text-center mt-2">Select at least 2 topics to continue</div>
        )}
      </div>
    </div>
  );
}
