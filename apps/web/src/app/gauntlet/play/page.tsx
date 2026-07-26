"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { SfxToggle } from "@/components/SfxToggle";
import { playSfx } from "@/lib/sfx";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
const QUESTION_TIME = 20;

type Modifier = "standard" | "double_down" | "safety_net" | "hot_streak";
type Phase = "briefing" | "loading" | "question" | "feedback" | "roundComplete" | "submitting" | "error";

type RoundConfig = {
  round: number;
  fee: number;
  difficulty: string;
  rewardPerCorrect: number;
  label: string;
  chargedEntryFee?: number;
  modifier?: string | null;
};

type GauntletQuestion = {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: string;
  topic: string;
  funFact: string | null;
  seenCount?: number;
  pastAccuracy?: number | null;
  topicAccuracy?: number | null;
};

type RoundPayload = {
  roundConfig: RoundConfig;
  token: string;
  questions: GauntletQuestion[];
  tip: string;
  character: "GIGA" | "ACE";
  player?: {
    geekBalance: number;
    currentStreak: number;
    streakBonusMultiplier: number;
  };
};

type LocalResult = {
  chosen: number;
  correct: number;
  isCorrect: boolean;
  timeTaken: number;
  multiplier: number;
};

type ServerRoundResult = {
  correctCount: number;
  totalQuestions: number;
  geekEarned: number;
  xpEarned: number;
  refund: number;
  results: Array<{ isCorrect: boolean; reward: number; correctAnswer: number }>;
};

const ROUND_CONFIG: RoundConfig[] = [
  { round: 1, fee: 0, difficulty: "easy", rewardPerCorrect: 10, label: "INITIATION" },
  { round: 2, fee: 40, difficulty: "easy-medium", rewardPerCorrect: 20, label: "BASIC PROTOCOLS" },
  { round: 3, fee: 100, difficulty: "medium", rewardPerCorrect: 40, label: "NETWORK LAYER" },
  { round: 4, fee: 200, difficulty: "medium-hard", rewardPerCorrect: 80, label: "DATA STREAMS" },
  { round: 5, fee: 400, difficulty: "hard", rewardPerCorrect: 150, label: "GRID ACCESS" },
  { round: 6, fee: 750, difficulty: "hard", rewardPerCorrect: 280, label: "DEEP PROTOCOL" },
  { round: 7, fee: 1250, difficulty: "very-hard", rewardPerCorrect: 450, label: "CIPHER DESCENT" },
  { round: 8, fee: 2000, difficulty: "very-hard", rewardPerCorrect: 700, label: "CORE BREACH" },
  { round: 9, fee: 3500, difficulty: "expert", rewardPerCorrect: 1100, label: "OMNISCIENT GATE" },
  { round: 10, fee: 6000, difficulty: "expert", rewardPerCorrect: 1800, label: "APEX PROTOCOL" },
];

const MODIFIERS: Array<{ id: Modifier; label: string; text: string; fee: string }> = [
  { id: "standard", label: "Standard", text: "Normal entry fee and rewards.", fee: "1x fee" },
  { id: "double_down", label: "Double Down", text: "Pay twice the entry fee and double correct-answer rewards.", fee: "2x fee" },
  { id: "safety_net", label: "Safety Net", text: "Pay 10% extra and recover a partial refund if the round goes badly.", fee: "+10%" },
  { id: "hot_streak", label: "Hot Streak", text: "Earn a bonus multiplier if your opening answers stay perfect.", fee: "1x fee" },
];

const COMBO_LINES = {
  GIGA: ["Combo online.", "Heat rising.", "That chain is getting expensive.", "Sudden death energy."],
  ACE: ["Pattern confirmed.", "Accuracy trend improving.", "Bonus phase remains stable.", "Risk profile upgraded."],
};

function money(n: number) {
  return Math.round(n).toLocaleString();
}

function getEntryFee(cfg: RoundConfig, modifier: Modifier) {
  if (modifier === "double_down") return cfg.fee * 2;
  if (modifier === "safety_net") return Math.round(cfg.fee * 1.1);
  return cfg.fee;
}

function estimateConfidence(round: number, balance: number, streak: number) {
  const base = 78 - round * 4 + Math.min(10, streak * 2) + (balance > ROUND_CONFIG[round - 1].fee ? 4 : -8);
  return Math.max(24, Math.min(92, Math.round(base)));
}

function seasonMultiplier() {
  const q = Math.floor(new Date().getMonth() / 3) + 1;
  return q === 4 ? 1.15 : q === 2 ? 1.1 : 1.05;
}

function PlayContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, status, refreshUser } = useAuth();
  const runId = Number(params.get("runId"));
  const initialRound = Math.min(10, Math.max(1, Number(params.get("round") ?? "1")));

  const [round, setRound] = useState(initialRound);
  const [phase, setPhase] = useState<Phase>("briefing");
  const [modifier, setModifier] = useState<Modifier>("standard");
  const [payload, setPayload] = useState<RoundPayload | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [chosen, setChosen] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timings, setTimings] = useState<number[]>([]);
  const [results, setResults] = useState<LocalResult[]>([]);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [hint, setHint] = useState("");
  const [reaction, setReaction] = useState("");
  const [serverResult, setServerResult] = useState<ServerRoundResult | null>(null);
  const [error, setError] = useState("");
  const startedAt = useRef(Date.now());

  const cfg = payload?.roundConfig ?? ROUND_CONFIG[round - 1];
  const character = payload?.character ?? (user?.favoriteCharacter === "ACE" ? "ACE" : "GIGA");
  const questions = payload?.questions ?? [];
  const current = questions[questionIndex];
  const totalLocalGeek = useMemo(() => {
    return results.reduce((sum, r) => sum + (r.isCorrect ? Math.round(cfg.rewardPerCorrect * r.multiplier) : 0), 0);
  }, [cfg.rewardPerCorrect, results]);
  const confidence = estimateConfidence(round, user?.geekBalance ?? 0, user?.currentStreak ?? 0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/auth/login?callbackUrl=${encodeURIComponent(`/gauntlet/play?runId=${runId}&round=${round}`)}`);
    }
  }, [router, status, runId, round]);

  useEffect(() => {
    if (!runId || Number.isNaN(runId)) {
      router.replace("/gauntlet/setup");
    }
  }, [router, runId]);

  useEffect(() => {
    if (phase !== "question") return;
    setTimeLeft(QUESTION_TIME);
    startedAt.current = Date.now();
    const id = window.setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          choose(-1);
          return 0;
        }
        if (s <= 6) playSfx("tick");
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, questionIndex]);

  const beginRound = useCallback(async () => {
    if (!user) return;
    playSfx("start");
    setPhase("loading");
    setError("");
    setQuestionIndex(0);
    setChosen(null);
    setAnswers([]);
    setTimings([]);
    setResults([]);
    setCombo(0);
    setMaxCombo(0);
    setHintUsed(false);
    setHint("");
    setServerResult(null);
    try {
      const res = await fetch(`${API}/api/gauntlet/run/${runId}/round/${round}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: user.id,
          modifier: modifier === "standard" ? undefined : modifier,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to enter round");
      setPayload(json.data);
      setPhase("question");
      await refreshUser().catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to enter round");
      setPhase("error");
    }
  }, [modifier, refreshUser, round, runId, user]);

  function multiplierFor(isCorrect: boolean, nextCombo: number, topicAccuracy?: number | null, timeTaken = QUESTION_TIME) {
    if (!isCorrect) return 0;
    const streak = user?.streakBonusMultiplier ?? 1;
    const comboMult = nextCombo >= 7 ? 1.75 : nextCombo >= 5 ? 1.5 : nextCombo >= 3 ? 1.25 : 1;
    const speed = timeTaken <= 4 ? 1.25 : timeTaken <= 8 ? 1.12 : 1;
    const topic = topicAccuracy && topicAccuracy >= 80 ? 1.1 : topicAccuracy && topicAccuracy < 45 ? 0.95 : 1;
    const seasonal = seasonMultiplier();
    return Number((streak * comboMult * speed * topic * seasonal).toFixed(2));
  }

  function choose(idx: number) {
    if (phase !== "question" || chosen !== null || !current) return;
    if (idx !== -1) playSfx("click");
    const timeTaken = idx === -1 ? QUESTION_TIME : (Date.now() - startedAt.current) / 1000;
    const isCorrect = idx === current.correctIndex;
    const nextCombo = isCorrect ? combo + 1 : 0;
    const mult = multiplierFor(isCorrect, nextCombo, current.topicAccuracy, timeTaken);
    const lineBank = COMBO_LINES[character];
    if (isCorrect) {
      playSfx("correct");
      if ([3, 5, 7, 10].includes(nextCombo)) playSfx("combo", { comboLevel: nextCombo });
    } else {
      playSfx("wrong");
    }
    setChosen(idx);
    setAnswers((a) => [...a, idx]);
    setTimings((t) => [...t, Math.round(timeTaken * 1000)]);
    setResults((r) => [...r, { chosen: idx, correct: current.correctIndex, isCorrect, timeTaken, multiplier: mult }]);
    setCombo(nextCombo);
    setMaxCombo((m) => Math.max(m, nextCombo));
    setReaction(isCorrect ? lineBank[Math.min(lineBank.length - 1, Math.max(0, nextCombo - 2))] : "Combo broken. Rebuild clean.");
    setPhase("feedback");
  }

  function useHint() {
    if (!current || hintUsed || phase !== "question") return;
    playSfx("click");
    const eliminable = current.options.findIndex((_, i) => i !== current.correctIndex);
    setHint(`A.C.E. would eliminate option ${String.fromCharCode(65 + eliminable)} first.`);
    setHintUsed(true);
  }

  async function submitRound() {
    if (!payload || !user) return;
    setPhase("submitting");
    try {
      const res = await fetch(`${API}/api/gauntlet/run/${runId}/round/${round}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: user.id,
          token: payload.token,
          answers,
          timings,
          modifier: modifier === "standard" ? undefined : modifier,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to submit round");
      setServerResult(json.data);
      await refreshUser().catch(() => {});
      playSfx("complete");
      setPhase("roundComplete");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit round");
      setPhase("error");
    }
  }

  function nextQuestion() {
    if (questionIndex >= questions.length - 1) {
      submitRound();
      return;
    }
    setQuestionIndex((i) => i + 1);
    setChosen(null);
    setHint("");
    setPhase("question");
  }

  async function cashOut() {
    playSfx("cash");
    router.push(`/gauntlet/results?runId=${runId}&cashout=1`);
  }

  function continueNext() {
    playSfx("click");
    const next = round + 1;
    setRound(next);
    setPayload(null);
    setModifier("standard");
    setPhase("briefing");
    router.replace(`/gauntlet/play?runId=${runId}&round=${next}`);
  }

  if (status === "idle" || status === "loading" || !user) {
    return <Loading label="Syncing player session" />;
  }

  if (phase === "error") {
    return (
      <Shell>
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <div className="soft-card border border-[var(--brand-tertiary)]/30 p-8">
            <div className="font-extrabold text-3xl text-[var(--brand-tertiary)] mb-2">Gauntlet Interrupted</div>
            <p className="text-xs text-[var(--text-3)] mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setPhase("briefing")} className="pill-btn pill-btn-primary flex-1 text-xl py-3">Briefing</button>
              <Link href="/gauntlet/setup" className="flex-1 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-1)] font-semibold text-xl py-3 flex items-center justify-center transition">Setup</Link>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (phase === "briefing") {
    const entryFee = getEntryFee(cfg, modifier);
    const maxReward = cfg.rewardPerCorrect * 10 * (modifier === "double_down" ? 2 : modifier === "hot_streak" ? 1.5 : 1);
    return (
      <Shell>
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="mb-8">
            <div className="badge-pill text-[var(--brand-accent)] mb-4">Pre-Round Briefing</div>
            <h1 className="font-extrabold text-5xl text-[var(--text-1)]">Round {round}: {cfg.label}</h1>
            <p className="text-xs text-[var(--text-3)] mt-2">{cfg.difficulty.toUpperCase()} · 10 questions · rewards settle when you cash out.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            {[
              ["Entry Fee", `${money(entryFee)} GEEK`],
              ["Perfect Reward", `${money(maxReward)} GEEK`],
              ["Balance", `${money(user.geekBalance)} GEEK`],
              ["AI Confidence", `${confidence}%`],
              ["Season Bonus", `x${seasonMultiplier().toFixed(2)}`],
            ].map(([label, value]) => (
              <div key={label} className="soft-card p-4 text-center">
                <div className="text-[10px] tracking-widest text-[var(--text-3)] uppercase font-semibold">{label}</div>
                <div className="font-extrabold text-2xl text-[var(--brand-primary)]">{value}</div>
              </div>
            ))}
          </div>

          <div className="soft-card p-5 mb-6">
            <div className="text-[10px] tracking-widest text-[var(--brand-accent)] font-bold uppercase mb-2">{character} Tip</div>
            <div className="text-sm text-[var(--text-2)]">{payload?.tip ?? "A.C.E. says: protect your combo early, then chase speed once the pattern is stable."}</div>
          </div>

          <div className="grid md:grid-cols-4 gap-3 mb-8">
            {MODIFIERS.map((m) => {
              const active = modifier === m.id;
              return (
                <button key={m.id} onClick={() => setModifier(m.id)} className={`text-left rounded-2xl p-4 min-h-36 transition border-[3px] border-[var(--ink)] ${active ? "bg-[var(--brand-primary)] text-white shadow-[var(--shadow-brand)]" : "bg-[var(--surface-1)] shadow-[var(--shadow-soft)] hover:bg-[var(--surface-2)]"}`}>
                  <div className="font-extrabold text-xl">{m.label}</div>
                  <div className={`text-[10px] mb-2 font-semibold ${active ? "text-white/80" : "text-[var(--brand-accent)]"}`}>{m.fee}</div>
                  <p className={`text-xs leading-relaxed ${active ? "text-white/80" : "text-[var(--text-3)]"}`}>{m.text}</p>
                </button>
              );
            })}
          </div>

          <button onClick={beginRound} disabled={user.geekBalance < entryFee} className="pill-btn pill-btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed text-3xl py-5">
            {user.geekBalance < entryFee ? "Not Enough GEEK" : "Enter Round"}
          </button>
        </div>
      </Shell>
    );
  }

  if (phase === "loading" || phase === "submitting") {
    return <Loading label={phase === "loading" ? "Locking round state" : "Saving round results"} />;
  }

  if ((phase === "question" || phase === "feedback") && current) {
    const progress = ((questionIndex + 1) / questions.length) * 100;
    const timerPct = (timeLeft / QUESTION_TIME) * 100;
    const last = results[results.length - 1];
    return (
      <Shell>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-3)] mb-3">
            <span>Round {round} · Q {questionIndex + 1}/{questions.length}</span>
            <span className="text-[var(--brand-accent)]">{current.topic}</span>
            <span className="text-[var(--brand-primary)]">{money(totalLocalGeek)} GEEK live</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--surface-2)] mb-2 overflow-hidden"><div className="h-full rounded-full bg-[var(--brand-primary)]" style={{ width: `${progress}%` }} /></div>
          <div className="h-1.5 rounded-full bg-[var(--surface-2)] mb-5 overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 5 ? "bg-[var(--brand-tertiary)]" : "bg-[var(--brand-secondary)]"}`} style={{ width: `${phase === "feedback" ? 100 : timerPct}%` }} /></div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
            {[
              ["Time", phase === "feedback" ? "Locked" : `${timeLeft}s`],
              ["Combo", combo ? `x${combo}` : "-"],
              ["Streak", `x${user.streakBonusMultiplier.toFixed(2)}`],
              ["Topic Acc", current.topicAccuracy == null ? "New" : `${current.topicAccuracy}%`],
              ["Seen", String(current.seenCount ?? 0)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-[var(--surface-1)] border-[3px] border-[var(--ink)] shadow-[var(--shadow-soft)] p-3 text-center">
                <div className="text-[9px] tracking-widest text-[var(--text-3)] uppercase font-semibold">{label}</div>
                <div className="font-extrabold text-xl text-[var(--text-1)]">{value}</div>
              </div>
            ))}
          </div>

          <div className="soft-card p-6 mb-4">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="badge-pill text-[var(--brand-accent)]">{current.difficulty}</span>
              <span className="text-[10px] tracking-widest text-[var(--text-3)] font-semibold uppercase">Past accuracy: {current.pastAccuracy == null ? "First serve" : `${current.pastAccuracy}%`}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold leading-relaxed mb-6 text-[var(--text-1)]">{current.question}</h2>
            <div className="grid gap-3">
              {current.options.map((option, index) => {
                const show = phase === "feedback";
                const good = index === current.correctIndex;
                const picked = chosen === index;
                let cls = "border-[var(--border-soft)] bg-[var(--surface-2)] hover:border-[var(--brand-primary)]/50 text-[var(--text-2)]";
                if (show && good) cls = "border-[var(--brand-secondary)] bg-[var(--brand-secondary)]/10 text-[var(--brand-secondary)]";
                else if (show && picked && !good) cls = "border-[var(--brand-tertiary)] bg-[var(--brand-tertiary)]/10 text-[var(--brand-tertiary)]";
                else if (picked) cls = "border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]";
                return (
                  <button key={option} onClick={() => choose(index)} disabled={phase === "feedback"} className={`border rounded-2xl px-5 py-4 text-left text-sm font-medium transition ${cls}`}>
                    <span className="text-[var(--text-3)] mr-3 font-bold">{String.fromCharCode(65 + index)}.</span>{option}
                  </button>
                );
              })}
            </div>
          </div>

          {hint && <div className="rounded-2xl border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/10 p-3 mb-4 text-xs text-[var(--brand-primary)] font-medium">{hint}</div>}

          {phase === "question" && (
            <button onClick={useHint} disabled={hintUsed} className="rounded-full border border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/5 hover:bg-[var(--brand-primary)]/10 disabled:opacity-40 text-[var(--brand-primary)] font-bold text-lg px-5 py-3 transition">
              Use A.C.E. Hint Token
            </button>
          )}

          {phase === "feedback" && (
            <div className="soft-card p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] tracking-widest text-[var(--brand-accent)] font-bold">{character}</div>
                  <div className="font-bold text-[var(--text-1)]">{reaction}</div>
                  {current.funFact && <div className="text-xs text-[var(--text-3)] mt-2">{current.funFact}</div>}
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[var(--text-3)] font-semibold">Bonus multiplier</div>
                  <div className="font-extrabold text-3xl text-[var(--brand-primary)]">x{last?.multiplier.toFixed(2) ?? "0.00"}</div>
                </div>
              </div>
              <button onClick={nextQuestion} className="pill-btn pill-btn-primary w-full mt-5 text-xl py-3">
                {questionIndex >= questions.length - 1 ? "Complete Round" : "Next Question"}
              </button>
            </div>
          )}
        </div>
      </Shell>
    );
  }

  if (phase === "roundComplete" && serverResult) {
    const allDone = round >= 10;
    return (
      <Shell>
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="badge-pill text-[var(--brand-accent)] mb-4">Round Complete</div>
            <h1 className="font-extrabold text-5xl text-[var(--text-1)]">Round {round} Cleared</h1>
            <p className="text-xs text-[var(--text-3)]">Best combo x{maxCombo}. Sudden death phases survived by accuracy, mostly.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              ["Correct", `${serverResult.correctCount}/${serverResult.totalQuestions}`],
              ["GEEK Earned", `+${money(serverResult.geekEarned + serverResult.refund)}`],
              ["Run GEEK", `+${money(totalLocalGeek)}`],
              ["XP Gained", `+${serverResult.xpEarned}`],
            ].map(([label, value]) => (
              <div key={label} className="soft-card p-5 text-center">
                <div className="text-[10px] tracking-widest text-[var(--text-3)] uppercase font-semibold">{label}</div>
                <div className="font-extrabold text-3xl text-[var(--brand-primary)]">{value}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {!allDone && <button onClick={continueNext} className="pill-btn pill-btn-primary flex-1 text-2xl py-4">Continue to Round {round + 1}</button>}
            <button onClick={cashOut} className="flex-1 rounded-full border border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/5 hover:bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-bold text-2xl py-4 transition">
              {allDone ? "Final Results" : "Cash Out"}
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  return <Loading label="Assembling gauntlet" />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-[var(--text-1)]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-4 flex justify-end">
        <SfxToggle />
      </div>
      {children}
    </div>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <Shell>
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[var(--brand-accent)] text-xs font-bold tracking-widest mb-4 animate-pulse uppercase">{label}</div>
          <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    </Shell>
  );
}

export default function GauntletPlayPage() {
  return (
    <Suspense fallback={<Loading label="Loading gauntlet" />}>
      <PlayContent />
    </Suspense>
  );
}
