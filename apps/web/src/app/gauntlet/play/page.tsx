"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { AudioControls } from "@/components/AudioControls";
import { playSfx } from "@/lib/sfx";
import { speak, cancelVoice, onVoiceDuck } from "@/lib/voice";
import { startMusic, stopMusic, duckMusic } from "@/lib/music";
import CanvasQuestion from "@/components/CanvasQuestion";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { createBehaviorTracker } from "@/lib/behaviorSignals";

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
  difficulty: string;
  topic: string;
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
  // Revealed by the server only after an answer is committed — the round
  // payload no longer contains the answer key.
  const [revealedCorrect, setRevealedCorrect] = useState<number | null>(null);
  const [revealedFact, setRevealedFact] = useState<string | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [hint, setHint] = useState("");
  const [reaction, setReaction] = useState("");
  const [serverResult, setServerResult] = useState<ServerRoundResult | null>(null);
  const [error, setError] = useState("");
  const startedAt = useRef(Date.now());
  const behavior = useRef(createBehaviorTracker());

  // Aggregate interaction telemetry for the duration of the run.
  useEffect(() => {
    const tracker = behavior.current;
    tracker.start();
    return () => tracker.stop();
  }, []);

  // Duck the music while the AI speaks and stop everything on the way out.
  useEffect(() => {
    onVoiceDuck(duckMusic);
    return () => {
      onVoiceDuck(null);
      stopMusic();
      cancelVoice();
    };
  }, []);

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
    // This click is the user gesture browsers require before audio may start.
    startMusic();
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

  /**
   * Commit the answer to the server and let it reveal whether it was right.
   * The round payload no longer carries the answer key, so this round trip is
   * what produces feedback — and the server records the choice write-once.
   */
  async function choose(idx: number) {
    if (phase !== "question" || chosen !== null || !current) return;
    if (idx !== -1) playSfx("click");
    const timeTaken = idx === -1 ? QUESTION_TIME : (Date.now() - startedAt.current) / 1000;
    setChosen(idx);

    let correctIndex = -1;
    let fact: string | null = null;
    try {
      const res = await fetch(`${API}/api/gauntlet/run/${runId}/round/${round}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token: payload?.token,
          questionIndex,
          answer: idx,
          timeTaken,
        }),
      });
      const json = await res.json();
      if (json.success) {
        correctIndex = json.data.correctIndex;
        fact = json.data.funFact ?? null;
      }
    } catch {
      // Score is recomputed server-side at submit regardless of what shows here.
    }
    setRevealedCorrect(correctIndex);
    setRevealedFact(fact);

    const isCorrect = idx === correctIndex;
    const nextCombo = isCorrect ? combo + 1 : 0;
    const mult = multiplierFor(isCorrect, nextCombo, current.topicAccuracy, timeTaken);
    const lineBank = COMBO_LINES[character];
    if (isCorrect) {
      playSfx("correct");
      const milestone = [3, 5, 7, 10].includes(nextCombo);
      if (milestone) playSfx("combo", { comboLevel: nextCombo });
      speak(milestone ? "streak" : "correct", character);
    } else {
      playSfx("wrong");
      speak(idx === -1 ? "timeout" : "wrong", character);
    }
    setChosen(idx);
    setAnswers((a) => [...a, idx]);
    setTimings((t) => [...t, Math.round(timeTaken * 1000)]);
    setResults((r) => [...r, { chosen: idx, correct: correctIndex, isCorrect, timeTaken, multiplier: mult }]);
    setCombo(nextCombo);
    setMaxCombo((m) => Math.max(m, nextCombo));
    setReaction(isCorrect ? lineBank[Math.min(lineBank.length - 1, Math.max(0, nextCombo - 2))] : "Combo broken. Rebuild clean.");
    setPhase("feedback");
  }

  function useHint() {
    if (!current || hintUsed || phase !== "question") return;
    playSfx("click");
    // The client no longer knows the answer, so the hint narrows the field
    // without revealing it — the server is the only holder of the key.
    const eliminable = Math.floor(Math.random() * current.options.length);
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
          behavior: behavior.current.snapshot(),
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
    setRevealedCorrect(null);
    setRevealedFact(null);
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
    const total = questions.length;
    const last = results[results.length - 1];
    const answered = phase === "feedback";
    const gotItRight = answered && last?.isCorrect;
    const lowTime = timeLeft <= 5 && !answered;
    const correctCount = results.filter((r) => r.isCorrect).length;

    const CHIPS = [
      { label: "TIME",  value: answered ? "0:00" : `0:${String(timeLeft).padStart(2, "0")}`,
        fill: lowTime ? "var(--gp-danger)" : "var(--gp-cyan)", icon: "🕐" },
      { label: "ROUND", value: `${round}/10`,
        fill: "var(--gp-violet)", icon: "🎯" },
      { label: "COMBO", value: `x${combo}`,
        fill: "var(--gp-pink)", icon: "⚡" },
      { label: "MULTI", value: `x${(user.streakBonusMultiplier ?? 1).toFixed(2)}`,
        fill: "var(--gp-gold)", icon: "🔥" },
    ];

    return (
      <Shell>
        <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">

          {/* ── HUD: stat chips + live GEEK ─────────────────────────────── */}
          <div className="flex flex-wrap items-start gap-3 md:gap-4 mb-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 flex-1 min-w-0">
              {CHIPS.map((c) => (
                <div key={c.label} className="q-chip flex items-center gap-2 px-3 py-2" style={{ background: c.fill }}>
                  <span className="q-chip-icon shrink-0 w-8 h-8 grid place-items-center text-base" aria-hidden="true">{c.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-extrabold tracking-widest leading-none">{c.label}</span>
                    <span className="block text-xl md:text-2xl font-extrabold leading-tight tabular-nums">{c.value}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="q-chip flex items-center gap-2 px-3 py-2"
                   style={{ background: "var(--gp-violet)", color: "#fff" }}>
                <span className="shrink-0 w-8 h-8 grid place-items-center rounded-full border-[2.5px] border-[var(--ink)] text-sm"
                      style={{ background: "var(--gp-gold)", color: "var(--ink)" }} aria-hidden="true">$</span>
                <span className="text-xl md:text-2xl font-extrabold tabular-nums">{money(totalLocalGeek)}</span>
              </div>
              <AudioControls className="mt-0.5" />
              {answered && last?.isCorrect && (
                <div className="q-float flex items-center gap-1.5 pr-1" aria-live="polite">
                  <span className="w-5 h-5 grid place-items-center rounded-full border-2 border-[var(--ink)] text-[10px] font-extrabold"
                        style={{ background: "var(--gp-gold)", color: "var(--ink)" }} aria-hidden="true">$</span>
                  <span className="font-extrabold text-[var(--gp-gold)]">
                    +{money(cfg.rewardPerCorrect * last.multiplier)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Segmented progress rail ────────────────────────────────── */}
          <div className="mb-1">
            <div className="q-rail flex h-7 overflow-hidden" role="progressbar"
                 aria-valuemin={1} aria-valuemax={total} aria-valuenow={questionIndex + 1}
                 aria-label={`Question ${questionIndex + 1} of ${total}`}>
              {Array.from({ length: total }).map((_, i) => (
                <div key={i} className={`q-seg flex-1 ${i < questionIndex ? "q-seg-done" : i === questionIndex ? "q-seg-now" : ""}`} />
              ))}
            </div>
            <div className="flex mt-1" aria-hidden="true">
              {Array.from({ length: total }).map((_, i) => (
                <div key={i} className={`flex-1 text-center text-xs font-extrabold ${i <= questionIndex ? "text-[var(--gp-cyan)]" : "text-[var(--text-3)]"}`}>
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* ── Question card ──────────────────────────────────────────── */}
          <div className="relative mt-4 rounded-[20px] border-[3px] border-[var(--ink)] bg-[#0B0B14] p-5 md:p-7"
               style={{ boxShadow: "6px 6px 0 0 var(--ink)" }}>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-lg border-[2.5px] border-[var(--ink)] text-[11px] font-extrabold tracking-widest uppercase"
                    style={{ background: "var(--gp-pink)", color: "var(--ink)" }}>
                {current.difficulty}
              </span>
              <span className="px-3 py-1 rounded-lg border-[2.5px] border-[var(--ink)] text-[11px] font-extrabold tracking-widest uppercase"
                    style={{ background: "var(--gp-cyan)", color: "var(--ink)" }}>
                {current.topic}
              </span>
              <span className="text-[10px] tracking-widest text-[var(--text-3)] font-bold uppercase ml-auto">
                {current.pastAccuracy == null ? "First serve" : `Past: ${current.pastAccuracy}%`}
              </span>
            </div>

            {/* Canvas-rendered rather than scrapeable DOM text; the accessible
                name still carries the question for screen readers. */}
            <CanvasQuestion
              text={current.question}
              seed={`${round}-${questionIndex}`}
              className="mb-6"
              onRendered={(ok) => behavior.current.markCanvasRendered(ok)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {current.options.map((option, index) => {
                const isChosen = chosen === index;
                const isRight = index === revealedCorrect;
                const showCorrect = answered && isRight;
                const showWrong = answered && isChosen && !isRight;

                return (
                  <button
                    key={option}
                    onClick={() => choose(index)}
                    disabled={answered || chosen !== null}
                    aria-label={`${String.fromCharCode(65 + index)}. ${option}`}
                    className={`q-option relative flex items-center gap-3 px-3.5 py-3.5 text-left ${
                      showCorrect ? "q-option-correct" : showWrong ? "q-option-wrong" : "text-[var(--text-1)]"
                    }`}
                  >
                    <span className="q-letter shrink-0 w-9 h-9 grid place-items-center font-extrabold text-sm">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1 font-bold text-[15px] leading-snug">{option}</span>
                    {showCorrect && (
                      <span className="shrink-0 w-7 h-7 grid place-items-center rounded-full bg-white border-2 border-[var(--ink)] text-[var(--gp-success-dark)] font-extrabold text-sm">✓</span>
                    )}
                    {showWrong && (
                      <span className="shrink-0 w-7 h-7 grid place-items-center rounded-full bg-white border-2 border-[var(--ink)] text-[var(--gp-danger-dark)] font-extrabold text-sm">✕</span>
                    )}
                  </button>
                );
              })}
            </div>

            {gotItRight && <ConfettiBurst className="rounded-[20px]" />}
          </div>

          {/* ── Hint ───────────────────────────────────────────────────── */}
          {phase === "question" && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={useHint}
                disabled={hintUsed}
                className="q-option px-5 py-3 font-extrabold disabled:opacity-40"
                style={{ background: "var(--gp-violet)", color: "#fff", boxShadow: "4px 4px 0 0 var(--gp-violet-dark)" }}
              >
                {hintUsed ? "Hint used" : "Use A.C.E. Hint Token"}
              </button>
              {hint && (
                <span className="text-sm font-semibold text-[var(--gp-cyan)]">{hint}</span>
              )}
            </div>
          )}

          {/* ── Mascot + verdict + next ────────────────────────────────── */}
          {answered && (
            <div className="mt-3 flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex items-end gap-3 flex-1 min-w-0">
                <Image
                  src="/mascot-quiz.png"
                  alt=""
                  width={236}
                  height={306}
                  priority
                  aria-hidden="true"
                  className="q-bob w-[130px] md:w-[172px] h-auto shrink-0 select-none -mb-1"
                />
                <div className="relative mb-4 flex-1 min-w-0 rounded-[18px] border-[3px] border-[var(--ink)] bg-white px-4 py-3 text-[var(--ink)]"
                     style={{ boxShadow: "5px 5px 0 0 var(--ink)" }}>
                  <span aria-hidden="true" className="absolute left-[-14px] bottom-6 w-0 h-0"
                        style={{ borderTop: "11px solid transparent", borderBottom: "11px solid transparent", borderRight: "14px solid var(--ink)" }} />
                  <span aria-hidden="true" className="absolute left-[-9px] bottom-[26px] w-0 h-0"
                        style={{ borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderRight: "10px solid #fff" }} />
                  <div className="font-extrabold text-lg leading-tight">
                    {gotItRight ? "Nice one!" : "Not this time."}
                  </div>
                  <div className="text-sm font-semibold text-[#3a3a4a]">{reaction}</div>
                  {last?.isCorrect && (
                    <div className="mt-2 pt-2 border-t-2 border-[#e6e6ee] font-extrabold text-[var(--gp-gold-dark)]">
                      +{money(cfg.rewardPerCorrect * last.multiplier)} GEEK · ×{last.multiplier.toFixed(2)}
                    </div>
                  )}
                  {revealedFact && (
                    <div className="mt-2 pt-2 border-t-2 border-[#e6e6ee] text-xs font-medium text-[#3a3a4a]">
                      💡 {revealedFact}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={nextQuestion}
                className="q-option w-full md:w-auto md:min-w-[280px] justify-center px-8 py-5 text-xl md:text-2xl font-extrabold"
                style={{ background: "var(--gp-cyan)", color: "var(--ink)", boxShadow: "6px 6px 0 0 var(--gp-cyan-dark)" }}
              >
                {questionIndex >= total - 1 ? "Complete Round" : "Next Question →"}
              </button>
            </div>
          )}

          <div className="mt-4 text-xs font-semibold text-[var(--text-3)]">
            Round {round} · {cfg.label}
            {results.length > 0 && ` · ${correctCount} of ${results.length} correct so far`}
          </div>
        </div>
      </Shell>
    );
  }


  if (phase === "roundComplete" && serverResult) {
    const allDone = round >= 10;
    const pct = serverResult.totalQuestions
      ? Math.round((serverResult.correctCount / serverResult.totalQuestions) * 100)
      : 0;
    const strong = pct >= 60;
    const verdict = allDone ? "GAUNTLET CLEARED" : strong ? "ROUND CLEARED" : "ROUND SURVIVED";
    const tint = strong ? "var(--gp-cyan)" : "var(--gp-violet)";
    const tintShade = strong ? "var(--gp-cyan-dark)" : "var(--gp-violet-dark)";

    const TILES = [
      { label: "Correct", value: `${serverResult.correctCount}/${serverResult.totalQuestions}`, color: "var(--text-1)" },
      { label: "GEEK Earned", value: `+${money(serverResult.geekEarned + serverResult.refund)}`, color: "var(--gp-gold)" },
      { label: "Run Total", value: `+${money(totalLocalGeek)}`, color: "var(--gp-gold)" },
      { label: "XP Gained", value: `+${serverResult.xpEarned}`, color: "var(--gp-cyan)" },
      { label: "Best Combo", value: maxCombo > 0 ? `🔥 ×${maxCombo}` : "—", color: "var(--text-1)" },
      { label: "Accuracy", value: `${pct}%`, color: "var(--text-1)", highlight: true },
    ];

    return (
      <Shell>
        <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
          <div className="flex justify-center mb-6">
            <span className="px-5 py-2 rounded-xl border-[3px] border-[var(--ink)] text-xs md:text-sm font-extrabold tracking-widest uppercase text-white text-center"
                  style={{ background: "var(--gp-violet)", boxShadow: "4px 4px 0 0 var(--ink)" }}>
              Round {round} Complete · {cfg.label}
            </span>
          </div>

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
            <span className="absolute top-2 left-[calc(50%+58px)] md:left-[calc(50%+72px)] px-4 py-2 rounded-2xl border-[3px] border-[var(--ink)] bg-white text-[var(--ink)] font-extrabold text-base md:text-lg leading-none whitespace-nowrap"
                  style={{ boxShadow: "4px 4px 0 0 var(--ink)" }}>
              {strong ? "Nice run!" : "Keep going…"}
            </span>
          </div>

          <h1 className="text-center font-extrabold leading-none tracking-tight text-[clamp(2.25rem,8vw,4.5rem)]"
              style={{ color: tint, textShadow: `5px 5px 0 ${tintShade}` }}>
            {verdict}
          </h1>
          <p className="text-center text-[var(--text-2)] font-semibold mt-3 mb-8 text-lg">{pct}% accuracy</p>

          <div className="rounded-[20px] border-[3px] border-[var(--ink)] bg-[#0B0B14] p-5 md:p-7 mb-5"
               style={{ boxShadow: "6px 6px 0 0 var(--ink)" }}>
            <div className="text-[11px] tracking-widest font-extrabold uppercase mb-4" style={{ color: "var(--gp-pink)" }}>
              Round Breakdown
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {TILES.map((t) => (
                <div key={t.label} className="rounded-xl border-2 bg-[#12121D] px-3 py-4 text-center"
                     style={{ borderColor: t.highlight ? "var(--gp-pink)" : "var(--border-soft)" }}>
                  <div className="text-[10px] tracking-widest uppercase font-bold text-[var(--text-3)] mb-1.5">{t.label}</div>
                  <div className="font-extrabold text-2xl md:text-[26px] leading-none tabular-nums" style={{ color: t.color }}>
                    {t.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-[var(--text-3)] font-semibold mb-6">
            {allDone
              ? "You reached the end of the Gauntlet. Cash out and take the win."
              : "Cash out to bank your run, or push deeper for bigger rewards."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {!allDone && (
              <button onClick={continueNext}
                      className="q-option flex items-center justify-center px-6 py-4 text-lg font-extrabold"
                      style={{ background: "var(--gp-cyan)", color: "var(--ink)", boxShadow: "5px 5px 0 0 var(--gp-cyan-dark)" }}>
                Continue to Round {round + 1}
              </button>
            )}
            <button onClick={cashOut}
                    className="q-option flex items-center justify-center px-6 py-4 text-lg font-extrabold"
                    style={{ background: "#0B0B14", color: "var(--gp-cyan)", borderColor: "var(--gp-cyan)" }}>
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
