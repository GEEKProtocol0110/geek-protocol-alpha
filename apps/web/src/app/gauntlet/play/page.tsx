"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { AudioControls } from "@/components/AudioControls";
import { playSfx } from "@/lib/sfx";
import { startMusic, stopMusic } from "@/lib/music";
import CanvasQuestion from "@/components/CanvasQuestion";
import { createBehaviorTracker } from "@/lib/behaviorSignals";
import QuizBattle from "@/components/battle/QuizBattle";
import { getFighter, getGauntletBoss } from "@/lib/battle/roster";
import type { Question as BattleQuestion } from "@/lib/battle/types";

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
  const [answers, setAnswers] = useState<number[]>([]);
  const [timings, setTimings] = useState<number[]>([]);
  const [results, setResults] = useState<LocalResult[]>([]);
  const [maxCombo, setMaxCombo] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [hint, setHint] = useState("");
  const [serverResult, setServerResult] = useState<ServerRoundResult | null>(null);
  const [error, setError] = useState("");
  // The battle owns the on-screen index and combo; these mirrors keep scoring
  // synchronous and independent of render timing.
  const questionIndexRef = useRef(0);
  const comboRef = useRef(0);
  const behavior = useRef(createBehaviorTracker());

  // Aggregate interaction telemetry for the duration of the run.
  useEffect(() => {
    const tracker = behavior.current;
    tracker.start();
    return () => tracker.stop();
  }, []);

  // Duck the music while the AI speaks and stop everything on the way out.
  useEffect(() => {
    return () => {
      stopMusic();
    };
  }, []);

  const cfg = payload?.roundConfig ?? ROUND_CONFIG[round - 1];
  const character = payload?.character ?? (user?.favoriteCharacter === "ACE" ? "ACE" : "GIGA");
  const questions = useMemo(() => payload?.questions ?? [], [payload]);
  const current = questions[questionIndex];

  // A.C.E. players ride the technical glass cannon, GIGA players the all-rounder.
  const fighter = getFighter(character === "ACE" ? "vex" : "giga");
  const gauntletBoss = useMemo(() => getGauntletBoss(round), [round]);

  /**
   * Adapt round questions to the battle's shape. `correctIndex` stays -1 — the
   * key genuinely is not known here, and the fight resolves from the server's
   * verdict instead.
   */
  const battleQuestions: BattleQuestion[] = useMemo(
    () =>
      questions.map((q, i) => ({
        id: String(q.id ?? i),
        prompt: q.question,
        options: q.options,
        correctIndex: -1,
        explanation: "",
        category: q.topic,
      })),
    [questions]
  );
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


  const beginRound = useCallback(async () => {
    if (!user) return;
    playSfx("start");
    // This click is the user gesture browsers require before audio may start.
    startMusic();
    setPhase("loading");
    setError("");
    setQuestionIndex(0);
    setAnswers([]);
    setTimings([]);
    setResults([]);
    comboRef.current = 0;
    questionIndexRef.current = 0;
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
  async function commitToServer(idx: number, timeTaken: number) {
    const q = questions[questionIndexRef.current];
    if (!q) return { correct: false, correctIndex: null };

    let correctIndex = -1;
    let fact: string | null = null;
    try {
      const res = await fetch(`${API}/api/gauntlet/run/${runId}/round/${round}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token: payload?.token,
          questionIndex: questionIndexRef.current,
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
    const isCorrect = idx === correctIndex;
    // The battle shows the fight; these totals are what the round submit and
    // the results screen are scored from, so they are tracked independently.
    comboRef.current = isCorrect ? comboRef.current + 1 : 0;
    const mult = multiplierFor(isCorrect, comboRef.current, q.topicAccuracy, timeTaken);
    setAnswers((a) => [...a, idx]);
    setTimings((t) => [...t, Math.round(timeTaken * 1000)]);
    setResults((r) => [...r, { chosen: idx, correct: correctIndex, isCorrect, timeTaken, multiplier: mult }]);
    setMaxCombo((m) => Math.max(m, comboRef.current));
    questionIndexRef.current += 1;
    setQuestionIndex(questionIndexRef.current);
    return { correct: isCorrect, correctIndex: correctIndex < 0 ? null : correctIndex, explanation: fact };
  }

  /** Combo milestone cue. Impact audio belongs to the battle layer. */
  const handleFeedback = useCallback(
    (correct: boolean, comboNow: number) => {
      if (correct) {
        const next = comboNow + 1;
        if ([3, 5, 7, 10].includes(next)) playSfx("combo", { comboLevel: next });
      }
    },
    []
  );

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

  if (phase === "question" && questions.length > 0) {
    return (
      <Shell>
        <div className="mx-auto max-w-4xl px-2 pb-2 sm:px-4">
          <div className="flex items-center justify-between py-2">
            <span className="gp-pixel truncate text-[8px] text-[var(--gp-cyan)] sm:text-[9px]">
              GEEK GAUNTLET · ROUND {round}/10 · {cfg.label}
            </span>
            <AudioControls />
          </div>

          <QuizBattle
            fighter={fighter}
            questions={battleQuestions}
            boss={gauntletBoss}
            onCommit={commitToServer}
            onComplete={() => void submitRound()}
            onFeedback={handleFeedback}
            /* Prompts stay canvas-rendered so the question text is not
               scrapeable DOM, and the behaviour tracker keeps its signal. */
            renderPrompt={(q, i) => (
              <div className="mb-3">
                <div className="bf-quiz-chips mb-3 flex flex-wrap items-center gap-2">
                  <span
                    className="gp-pixel border-2 px-2 py-1 text-[9px]"
                    style={{ borderColor: "var(--ink)", background: "var(--gp-pink)", color: "var(--ink)" }}
                  >
                    {questions[i]?.difficulty ?? cfg.difficulty}
                  </span>
                  <span
                    className="gp-pixel border-2 px-2 py-1 text-[9px]"
                    style={{ borderColor: "var(--ink)", background: "var(--gp-cyan)", color: "var(--ink)" }}
                  >
                    {questions[i]?.topic}
                  </span>
                </div>
                <CanvasQuestion
                  text={q.prompt}
                  seed={`${round}-${i}-${questions[i]?.id ?? ""}`}
                  onRendered={(ok) => behavior.current.markCanvasRendered(ok)}
                />
              </div>
            )}
            footerSlot={
              <div className="mt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={useHint}
                  disabled={hintUsed}
                  className="gp-pixel border-2 px-3 py-1.5 text-[8px] transition-transform enabled:hover:-translate-y-[1px] disabled:opacity-40 sm:text-[9px]"
                  style={{
                    borderColor: "var(--ink)",
                    background: hintUsed ? "var(--surface-2)" : "var(--gp-gold)",
                    color: hintUsed ? "var(--text-3)" : "var(--ink)",
                  }}
                >
                  {hintUsed ? "HINT SPENT" : "A.C.E. HINT TOKEN"}
                </button>
                <span className="gp-pixel truncate text-[8px] text-[var(--text-3)]">
                  {hint || `${results.filter((r) => r.isCorrect).length}/${results.length} CORRECT · ${money(totalLocalGeek)} GEEK`}
                </span>
              </div>
            }
          />
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


  // Reaching here means a phase had no matching branch — surface it rather
  // than spinning forever.
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
