"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { AudioControls } from "@/components/AudioControls";
import { playSfx } from "@/lib/sfx";
import { speak, cancelVoice, onVoiceDuck } from "@/lib/voice";
import { startMusic, stopMusic, duckMusic } from "@/lib/music";
import CanvasQuestion from "@/components/CanvasQuestion";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { createBehaviorTracker } from "@/lib/behaviorSignals";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
const QUESTION_TIME = 15;

type Question = {
  id: number;
  question: string;
  options: string[];
  difficulty: string;
  topic: string;
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
  // Revealed by the server only after an answer is committed — the question list
  // no longer carries the answer key.
  const [revealedCorrect, setRevealedCorrect] = useState<number | null>(null);
  const [funFact, setFunFact] = useState<string | null>(null);
  const questionStartRef = useRef<number>(Date.now());
  const behavior = useRef(createBehaviorTracker());

  // Interaction telemetry runs for the length of the attempt. Aggregates only —
  // no coordinates or keystrokes leave the browser.
  useEffect(() => {
    const tracker = behavior.current;
    tracker.start();
    return () => tracker.stop();
  }, []);

  // Duck the music whenever the AI speaks, and make sure nothing keeps playing
  // after the player navigates away.
  useEffect(() => {
    onVoiceDuck(duckMusic);
    return () => {
      onVoiceDuck(null);
      stopMusic();
      cancelVoice();
    };
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
    void commitAnswer(-1, QUESTION_TIME);
  }, [quiz, qIndex]); // eslint-disable-line

  /**
   * Commit the answer to the server, which replies with whether it was correct.
   * The answer key is no longer shipped with the question list, so this round
   * trip is what produces feedback — and the server records the choice
   * write-once, so it can't be revised after the result is shown.
   */
  async function commitAnswer(chosenIdx: number, timeTaken: number) {
    if (!quiz) return;
    setChosen(chosenIdx);
    try {
      const res = await fetch(`${API}/api/quiz/daily/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token: quiz.token,
          questionIndex: qIndex,
          answer: chosenIdx,
          timeTaken,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Could not record answer");
      setFunFact(json.data.funFact ?? null);
      setRevealedCorrect(json.data.correctIndex);
      recordAnswer(chosenIdx, json.data.correctIndex, timeTaken);
    } catch {
      // Network failure shouldn't strand the player mid-quiz; score is
      // recomputed server-side at submit regardless of what is shown here.
      setFunFact(null);
      setRevealedCorrect(null);
      recordAnswer(chosenIdx, -1, timeTaken);
    }
  }

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
      const milestone = newCombo >= 3 && [3, 5, 7, 10].includes(newCombo);
      if (milestone) playSfx("combo", { comboLevel: newCombo });
      // A streak call-out beats a generic "nice one" — it acknowledges the run.
      speak(milestone ? "streak" : "correct", character);
    } else {
      playSfx("wrong");
      speak(chosenIdx === -1 ? "timeout" : "wrong", character);
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
    void commitAnswer(idx, timeTaken);
  }

  async function nextQuestion() {
    const isLast = qIndex >= quiz!.questions.length - 1;
    if (isLast) {
      await submitQuiz();
      return;
    }
    setQIndex((i) => i + 1);
    setChosen(null);
    setRevealedCorrect(null);
    setFunFact(null);
    setPhase("question");
  }

  async function submitQuiz() {
    if (!quiz) return;
    // The sign-off line is spoken on the results screen instead — saying it
    // here got cut off the moment we navigated.
    stopMusic();
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
          <AudioControls />
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
          onClick={() => {
            playSfx("start");
            // This click is the user gesture browsers require before audio may
            // start — the music cannot be kicked off any earlier than here.
            startMusic();
            speak("quizStart", character);
            setQIndex(0); setChosen(null); setResults([]); setTotalScore(0);
            setCombo(0); setTimings([]); setPhase("question");
          }}
          className="pill-btn pill-btn-primary w-full text-xl py-4"
        >
          Start Quiz
        </button>
      </div>
    </div>
  );

  if ((phase === "question" || phase === "feedback") && quiz) {
    const q = quiz.questions[qIndex];
    const total = quiz.questions.length;
    const correctCount = results.filter((r) => r.isCorrect).length;
    const last = results[results.length - 1];
    const answered = phase === "feedback";
    const gotItRight = answered && last?.isCorrect;
    const lowTime = timeLeft <= 5 && !answered;

    const CHIPS = [
      { label: "TIME",    value: answered ? "0:00" : `0:${String(timeLeft).padStart(2, "0")}`,
        fill: lowTime ? "var(--gp-danger)" : "var(--gp-cyan)", icon: "🕐" },
      { label: "CORRECT", value: String(correctCount).padStart(2, "0"),
        fill: "var(--gp-violet)", icon: "✓" },
      { label: "COMBO",   value: `x${combo}`,
        fill: "var(--gp-pink)", icon: "⚡" },
      { label: "STREAK",  value: String(user?.currentStreak ?? 0),
        fill: "var(--gp-gold)", icon: "🔥" },
    ];

    return (
      <div className="min-h-screen text-[var(--text-1)]">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">

          {/* ── HUD: stat chips + coin balance ─────────────────────────── */}
          <div className="flex flex-wrap items-start gap-3 md:gap-4 mb-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 flex-1 min-w-0">
              {CHIPS.map((c) => (
                <div key={c.label} className="q-chip flex items-center gap-2 px-3 py-2"
                     style={{ background: c.fill }}>
                  <span className="q-chip-icon shrink-0 w-8 h-8 grid place-items-center text-base"
                        aria-hidden="true">{c.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-extrabold tracking-widest leading-none">
                      {c.label}
                    </span>
                    <span className="block text-xl md:text-2xl font-extrabold leading-tight tabular-nums">
                      {c.value}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="q-chip flex items-center gap-2 px-3 py-2"
                   style={{ background: "var(--gp-violet)", color: "#fff" }}>
                <span className="shrink-0 w-8 h-8 grid place-items-center rounded-full border-[2.5px] border-[var(--ink)] text-sm"
                      style={{ background: "var(--gp-gold)", color: "var(--ink)" }} aria-hidden="true">$</span>
                <span className="text-xl md:text-2xl font-extrabold tabular-nums">
                  {Math.round(totalScore).toLocaleString()}
                </span>
              </div>
              <AudioControls className="mt-0.5" />
              {/* Reward ticker — mirrors the points just banked */}
              {answered && last && last.points > 0 && (
                <div className="q-float flex items-center gap-1.5 pr-1" aria-live="polite">
                  <span className="w-5 h-5 grid place-items-center rounded-full border-2 border-[var(--ink)] text-[10px] font-extrabold"
                        style={{ background: "var(--gp-gold)", color: "var(--ink)" }} aria-hidden="true">$</span>
                  <span className="font-extrabold text-[var(--gp-gold)]">+{last.points}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Segmented progress rail ────────────────────────────────── */}
          <div className="mb-1">
            <div className="q-rail flex h-7 overflow-hidden" role="progressbar"
                 aria-valuemin={1} aria-valuemax={total} aria-valuenow={qIndex + 1}
                 aria-label={`Question ${qIndex + 1} of ${total}`}>
              {Array.from({ length: total }).map((_, i) => (
                <div key={i}
                     className={`q-seg flex-1 ${i < qIndex ? "q-seg-done" : i === qIndex ? "q-seg-now" : ""}`} />
              ))}
            </div>
            <div className="flex mt-1" aria-hidden="true">
              {Array.from({ length: total }).map((_, i) => (
                <div key={i}
                     className={`flex-1 text-center text-xs font-extrabold ${
                       i <= qIndex ? "text-[var(--gp-cyan)]" : "text-[var(--text-3)]"}`}>
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
                {q.difficulty}
              </span>
              <span className="px-3 py-1 rounded-lg border-[2.5px] border-[var(--ink)] text-[11px] font-extrabold tracking-widest uppercase"
                    style={{ background: "var(--gp-cyan)", color: "var(--ink)" }}>
                {q.topic}
              </span>
            </div>

            {/* Canvas-rendered so the question isn't scrapeable DOM text.
                The accessible name still carries it for screen readers. */}
            <CanvasQuestion
              text={q.question}
              seed={`${qIndex}-${q.id}`}
              className="mb-6"
              onRendered={(ok) => behavior.current.markCanvasRendered(ok)}
            />

            {/* Answer grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {q.options.map((opt, i) => {
                const isChosen = chosen === i;
                const isRight = i === revealedCorrect;
                const showCorrect = answered && isRight;
                const showWrong = answered && isChosen && !isRight;

                return (
                  <button
                    key={i}
                    onClick={() => choose(i)}
                    disabled={answered || chosen !== null}
                    aria-label={`${String.fromCharCode(65 + i)}. ${opt}`}
                    className={`q-option relative flex items-center gap-3 px-3.5 py-3.5 text-left ${
                      showCorrect ? "q-option-correct" : showWrong ? "q-option-wrong" : "text-[var(--text-1)]"
                    }`}
                  >
                    <span className="q-letter shrink-0 w-9 h-9 grid place-items-center font-extrabold text-sm">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1 font-bold text-[15px] leading-snug">{opt}</span>

                    {showCorrect && (
                      <span className="shrink-0 w-7 h-7 grid place-items-center rounded-full bg-white border-2 border-[var(--ink)] text-[var(--gp-success-dark)] font-extrabold text-sm">
                        ✓
                      </span>
                    )}
                    {showWrong && (
                      <span className="shrink-0 w-7 h-7 grid place-items-center rounded-full bg-white border-2 border-[var(--ink)] text-[var(--gp-danger-dark)] font-extrabold text-sm">
                        ✕
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Confetti burst — decorative only */}
            {gotItRight && <ConfettiBurst className="rounded-[20px]" />}
          </div>

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
                {/* Speech bubble */}
                <div className="relative mb-4 flex-1 min-w-0 rounded-[18px] border-[3px] border-[var(--ink)] bg-white px-4 py-3 text-[var(--ink)]"
                     style={{ boxShadow: "5px 5px 0 0 var(--ink)" }}>
                  <span aria-hidden="true"
                        className="absolute left-[-14px] bottom-6 w-0 h-0"
                        style={{
                          borderTop: "11px solid transparent",
                          borderBottom: "11px solid transparent",
                          borderRight: "14px solid var(--ink)",
                        }} />
                  <span aria-hidden="true"
                        className="absolute left-[-9px] bottom-[26px] w-0 h-0"
                        style={{
                          borderTop: "8px solid transparent",
                          borderBottom: "8px solid transparent",
                          borderRight: "10px solid #fff",
                        }} />
                  <div className="font-extrabold text-lg leading-tight">
                    {gotItRight ? "Nice one!" : "Not this time."}
                  </div>
                  <div className="text-sm font-semibold text-[#3a3a4a]">{reaction}</div>
                  {last && last.points > 0 && (
                    <div className="mt-2 pt-2 border-t-2 border-[#e6e6ee] font-extrabold text-[var(--gp-gold-dark)]">
                      +{last.points} PTS
                    </div>
                  )}
                  {funFact && (
                    <div className="mt-2 pt-2 border-t-2 border-[#e6e6ee] text-xs font-medium text-[#3a3a4a]">
                      💡 {funFact}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={nextQuestion}
                className="q-option w-full md:w-auto md:min-w-[280px] justify-center px-8 py-5 text-xl md:text-2xl font-extrabold"
                style={{ background: "var(--gp-cyan)", color: "var(--ink)", boxShadow: "6px 6px 0 0 var(--gp-cyan-dark)" }}
              >
                {qIndex >= total - 1 ? "See Results" : "Next Question →"}
              </button>
            </div>
          )}

          {/* Theme label stays visible; audio controls live in the HUD so they
              are reachable during feedback too, not just while answering. */}
          <div className="mt-4">
            <span className="text-xs font-semibold text-[var(--text-3)]">{quiz.theme}</span>
          </div>
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
