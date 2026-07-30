"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { SfxToggle } from "@/components/SfxToggle";
import { playSfx } from "@/lib/sfx";
import CanvasQuestion from "@/components/CanvasQuestion";
import { createBehaviorTracker } from "@/lib/behaviorSignals";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
const QUESTION_TIME = 15;

type Question = {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: string;
  topic: string;
  funFact: string | null;
};

type QuizData = {
  theme: string;
  token: string;
  questions: Question[];
};

type AnswerResult = {
  chosen: number;
  correct: number;
  isCorrect: boolean;
  timeTaken: number;
  points: number;
  speedBonus: number;
};

type Phase = "loading" | "error" | "intro" | "question" | "feedback" | "submitting" | "done";

const GIGA_CORRECT = ["⚡ LIGHTNING FAST!", "🎯 NAILED IT!", "🔥 ON FIRE!", "🌟 BRILLIANT!", "💪 CORRECT!"];
const GIGA_WRONG   = ["💀 Not quite!", "🤔 Close, but no!", "😬 Oops!", "💭 Almost there!"];
const ACE_CORRECT  = ["✅ Signal confirmed.", "🧠 Knowledge verified.", "📡 Proof recorded.", "🎯 Precision strike."];
const ACE_WRONG    = ["❌ Incorrect signal.", "📊 Recalibrating…", "🔄 Try again next time.", "⚠️ Wrong answer logged."];

function randomFrom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getComboMultiplier(combo: number) {
  if (combo >= 10) return 3.0;
  if (combo >= 7)  return 2.5;
  if (combo >= 5)  return 2.0;
  if (combo >= 3)  return 1.5;
  return 1.0;
}

export default function DailyQuizPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [error, setError] = useState("");

  const [qIndex, setQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [chosen, setChosen] = useState<number | null>(null);
  const [results, setResults] = useState<AnswerResult[]>([]);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [reaction, setReaction] = useState("");
  const [character] = useState<"GIGA" | "ACE">(user?.favoriteCharacter === "ACE" ? "ACE" : "GIGA");
  const [timings, setTimings] = useState<number[]>([]);
  const questionStartRef = useRef<number>(Date.now());
  const behavior = useRef(createBehaviorTracker());

  // Interaction telemetry runs for the length of the attempt. Aggregates only —
  // no coordinates or keystrokes leave the browser.
  useEffect(() => {
    const tracker = behavior.current;
    tracker.start();
    return () => tracker.stop();
  }, []);

  // Load quiz
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/quiz/daily`, { credentials: "include" });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        setQuiz(json.data);
        setPhase("intro");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load quiz");
        setPhase("error");
      }
    };
    load();
  }, []);

  // Per-question countdown
  useEffect(() => {
    if (phase !== "question") return;
    setTimeLeft(QUESTION_TIME);
    questionStartRef.current = Date.now();
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          handleTimeout();
          return 0;
        }
        if (s <= 6) playSfx("tick");
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, qIndex]);

  const handleTimeout = useCallback(() => {
    if (!quiz) return;
    const q = quiz.questions[qIndex];
    const timeTaken = QUESTION_TIME;
    recordAnswer(-1, q.correctIndex, timeTaken);
  }, [quiz, qIndex]); // eslint-disable-line

  function recordAnswer(chosenIdx: number, correctIdx: number, timeTaken: number) {
    const isCorrect = chosenIdx === correctIdx;
    const speedBonus = isCorrect && timeTaken < 5 ? 5 : 0;
    const basePoints = isCorrect ? 10 : 0;
    const streakMultiplier = user?.streakBonusMultiplier ?? 1;
    const newCombo = isCorrect ? combo + 1 : 0;
    const comboMult = getComboMultiplier(newCombo);
    const points = Math.round((basePoints + speedBonus) * streakMultiplier * comboMult);

    const char = character;
    setReaction(
      isCorrect
        ? randomFrom(char === "GIGA" ? GIGA_CORRECT : ACE_CORRECT)
        : randomFrom(char === "GIGA" ? GIGA_WRONG : ACE_WRONG)
    );
    if (isCorrect) {
      playSfx("correct");
      if (newCombo >= 3 && [3, 5, 7, 10].includes(newCombo)) playSfx("combo", { comboLevel: newCombo });
    } else {
      playSfx("wrong");
    }
    setChosen(chosenIdx);
    setCombo(newCombo);
    setMaxCombo((m) => Math.max(m, newCombo));
    setTotalScore((s) => s + points);
    setTimings((t) => [...t, Math.round(timeTaken * 1000)]);
    setResults((r) => [...r, { chosen: chosenIdx, correct: correctIdx, isCorrect, timeTaken, points, speedBonus }]);
    setPhase("feedback");
  }

  function choose(idx: number) {
    if (phase !== "question" || chosen !== null) return;
    playSfx("click");
    const timeTaken = (Date.now() - questionStartRef.current) / 1000;
    const q = quiz!.questions[qIndex];
    recordAnswer(idx, q.correctIndex, timeTaken);
  }

  async function nextQuestion() {
    const isLast = qIndex >= quiz!.questions.length - 1;
    if (isLast) {
      await submitQuiz();
      return;
    }
    setQIndex((i) => i + 1);
    setChosen(null);
    setPhase("question");
  }

  async function submitQuiz() {
    if (!quiz) return;
    setPhase("submitting");
    try {
      const answers = results.map((r) => r.chosen === -1 ? -1 : r.chosen);
      const res = await fetch(`${API}/api/quiz/daily/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token: quiz.token,
          answers,
          timings,
          userId: user?.id,
          behavior: behavior.current.snapshot(),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      // Navigate to results with params
      const params = new URLSearchParams({
        correct:   String(json.data.correctCount),
        total:     String(json.data.totalQuestions),
        points:    String(json.data.totalPoints),
        xp:        String(json.data.xpEarned),
        geek:      String(json.data.geekEarned),
        combo:     String(maxCombo),
        theme:     quiz.theme,
      });
      router.push(`/quiz/results?${params}`);
    } catch {
      const correctN = results.filter((r) => r.isCorrect).length;
      // Navigate to results with local scores anyway
      const params = new URLSearchParams({
        correct: String(correctN),
        total:   String(quiz.questions.length),
        points:  String(totalScore),
        xp:      String(correctN * 8),
        geek:    String((correctN * 0.5).toFixed(2)),
        combo:   String(maxCombo),
        theme:   quiz.theme,
      });
      router.push(`/quiz/results?${params}`);
    }
  }

  // ── Render phases ─────────────────────────────────────────────────────────

  if (phase === "loading") return (
    <div className="min-h-screen text-[var(--text-1)]">
      <Navbar />
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <div className="text-[var(--brand-accent)] text-xs font-bold tracking-widest mb-4 animate-pulse uppercase">Loading Daily Quiz</div>
          <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    </div>
  );

  if (phase === "error") return (
    <div className="min-h-screen text-[var(--text-1)]">
      <Navbar />
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="soft-card border border-[var(--brand-tertiary)]/20 p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="font-extrabold text-2xl text-[var(--brand-tertiary)] mb-2">Failed to Load</h2>
          <p className="text-xs text-[var(--text-3)] mb-6">{error}</p>
          <p className="text-xs text-[var(--text-3)] mb-4">Make sure the API is running: <span className="text-[var(--brand-primary)]">cd apps/api && npm run dev</span></p>
          <button onClick={() => window.location.reload()} className="pill-btn pill-btn-primary px-6">
            Retry
          </button>
        </div>
      </div>
    </div>
  );

  if (phase === "intro" && quiz) return (
    <div className="min-h-screen text-[var(--text-1)]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="flex justify-end mb-2">
          <SfxToggle />
        </div>
        <div className="text-center mb-10">
          <div className="badge-pill text-[var(--brand-primary)] mb-6">
            <span className="w-1.5 h-1.5 bg-[var(--brand-primary)] rounded-full animate-pulse" />
            Daily Quiz · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <h1 className="font-extrabold text-5xl text-[var(--text-1)] mb-2">Today&apos;s Theme</h1>
          <div className="font-extrabold text-4xl text-[var(--brand-primary)]">{quiz.theme}</div>
        </div>

        <div className="soft-card p-8 mb-8">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { label: "Questions", value: "10" },
              { label: "Time per Q", value: "15s" },
              { label: "Base pts/correct", value: "10" },
              { label: "Speed bonus", value: "+5 pts" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-[var(--surface-2)] p-3 text-center">
                <div className="text-[10px] tracking-widest text-[var(--text-3)] uppercase font-semibold">{s.label}</div>
                <div className="font-extrabold text-2xl text-[var(--brand-primary)]">{s.value}</div>
              </div>
            ))}
          </div>

          {isAuthenticated && user && (
            <div className="border-t border-[var(--border-soft)] pt-4 flex items-center justify-between">
              <div className="text-xs text-[var(--text-3)]">Your streak bonus</div>
              <div className="text-sm font-bold text-[var(--brand-accent)]">×{user.streakBonusMultiplier.toFixed(2)}</div>
            </div>
          )}
          {!isAuthenticated && (
            <div className="border-t border-[var(--border-soft)] pt-4 text-xs text-[var(--text-3)] text-center">
              <a href="/auth/login" className="text-[var(--brand-primary)] hover:underline">Sign in</a> to track your score and earn $GEEK
            </div>
          )}
        </div>

        <button
          onClick={() => { playSfx("start"); setQIndex(0); setChosen(null); setResults([]); setTotalScore(0); setCombo(0); setTimings([]); setPhase("question"); }}
          className="pill-btn pill-btn-primary w-full text-xl py-4"
        >
          Start Quiz
        </button>
      </div>
    </div>
  );

  if ((phase === "question" || phase === "feedback") && quiz) {
    const q = quiz.questions[qIndex];
    const progress = ((qIndex + 1) / quiz.questions.length) * 100;
    const timerPct = (timeLeft / QUESTION_TIME) * 100;
    const correctCount = results.filter((r) => r.isCorrect).length;

    return (
      <div className="min-h-screen text-[var(--text-1)]">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">

          {/* Header bar */}
          <div className="flex items-center justify-between mb-4 text-xs font-semibold text-[var(--text-3)]">
            <span>Q {qIndex + 1} / {quiz.questions.length}</span>
            <span className="text-[var(--brand-accent)]">{quiz.theme}</span>
            <div className="flex items-center gap-3">
              <span className="text-[var(--brand-primary)]">{totalScore} pts</span>
              <SfxToggle />
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-[var(--surface-2)] mb-2 overflow-hidden">
            <div className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          {/* Timer bar */}
          <div className="h-1.5 rounded-full bg-[var(--surface-2)] mb-6 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 5 ? "bg-[var(--brand-tertiary)]" : timeLeft <= 10 ? "bg-[var(--brand-accent)]" : "bg-[var(--brand-secondary)]"}`}
              style={{ width: `${phase === "feedback" ? 100 : timerPct}%` }}
            />
          </div>

          {/* Stats row */}
          <div className="flex gap-3 mb-6">
            {[
              { label: "TIME", value: phase === "feedback" ? "✓" : `${timeLeft}s`, alert: timeLeft <= 5 },
              { label: "CORRECT", value: `${correctCount}/${qIndex + (phase === "feedback" ? 1 : 0)}` },
              { label: "COMBO", value: combo > 0 ? `🔥×${combo}` : "—" },
              { label: "STREAK", value: `×${user?.streakBonusMultiplier?.toFixed(1) ?? "1.0"}` },
            ].map((s) => (
              <div key={s.label} className={`flex-1 rounded-2xl p-2 text-center border-[3px] border-[var(--ink)] ${s.alert ? "bg-[var(--brand-tertiary)]/10" : "bg-[var(--surface-1)] shadow-[var(--shadow-soft)]"}`}>
                <div className="text-[9px] tracking-widest text-[var(--text-3)] font-semibold">{s.label}</div>
                <div className={`font-extrabold text-lg ${s.alert ? "text-[var(--brand-tertiary)]" : "text-[var(--text-1)]"}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Question card */}
          <div className="soft-card p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="badge-pill text-[var(--brand-accent)]">{q.difficulty}</span>
              <span className="text-[10px] tracking-widest text-[var(--text-3)] font-semibold uppercase">{q.topic}</span>
            </div>

            {/* Rendered to canvas rather than as scrapeable DOM text. The real
                text stays available to screen readers via aria-label. */}
            <CanvasQuestion
              text={q.question}
              seed={`${qIndex}-${q.id}`}
              className="mb-6"
              onRendered={(ok) => behavior.current.markCanvasRendered(ok)}
            />

            <div className="grid grid-cols-1 gap-3">
              {q.options.map((opt, i) => {
                const isChosen = chosen === i;
                const isCorrect = i === q.correctIndex;
                const showResult = phase === "feedback";

                let cls = "border border-[var(--border-soft)] bg-[var(--surface-2)] hover:border-[var(--brand-primary)]/50 text-[var(--text-2)]";
                if (showResult && isCorrect)          cls = "border-[var(--brand-secondary)] bg-[var(--brand-secondary)]/10 text-[var(--brand-secondary)]";
                else if (showResult && isChosen && !isCorrect) cls = "border-[var(--brand-tertiary)] bg-[var(--brand-tertiary)]/10 text-[var(--brand-tertiary)]";
                else if (isChosen)                    cls = "border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]";

                return (
                  <button
                    key={i}
                    onClick={() => choose(i)}
                    disabled={phase === "feedback" || chosen !== null}
                    className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-medium transition ${cls} ${phase === "question" ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <span className="text-[var(--text-3)] mr-3 font-bold">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                    {showResult && isCorrect  && <span className="float-right text-[var(--brand-secondary)] font-semibold">✓ Correct</span>}
                    {showResult && isChosen && !isCorrect && <span className="float-right text-[var(--brand-tertiary)] font-semibold">✗ Wrong</span>}
                    {showResult && chosen === -1 && isCorrect && <span className="float-right text-[var(--brand-accent)] font-semibold">← Answer</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback */}
          {phase === "feedback" && (
            <div className="soft-card p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{character === "GIGA" ? "🤖" : "🧠"}</span>
                  <div>
                    <div className="text-[10px] tracking-widest text-[var(--brand-accent)] font-bold">{character}</div>
                    <div className="font-bold text-[var(--text-1)]">{reaction}</div>
                  </div>
                </div>
                {results[results.length - 1] && (
                  <div className="text-right">
                    <div className="text-[10px] text-[var(--text-3)] font-semibold">POINTS EARNED</div>
                    <div className="font-extrabold text-2xl text-[var(--brand-primary)]">
                      +{results[results.length - 1].points}
                    </div>
                  </div>
                )}
              </div>
              {q.funFact && (
                <div className="mt-3 border-t border-[var(--border-soft)] pt-3 text-xs text-[var(--text-3)]">
                  💡 {q.funFact}
                </div>
              )}
              <button
                onClick={nextQuestion}
                className="pill-btn pill-btn-primary w-full mt-4 text-lg py-3"
              >
                {qIndex >= quiz.questions.length - 1 ? "See Results" : "Next Question →"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === "submitting") return (
    <div className="min-h-screen text-[var(--text-1)] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">{character === "GIGA" ? "🤖" : "🧠"}</div>
        <div className="font-extrabold text-2xl text-[var(--text-1)] mb-2">Calculating Results</div>
        <div className="text-xs text-[var(--text-3)] animate-pulse">Submitting to server…</div>
      </div>
    </div>
  );

  return null;
}
