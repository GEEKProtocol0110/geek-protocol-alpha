"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { AudioControls } from "@/components/AudioControls";
import { playSfx } from "@/lib/sfx";
import { speak, cancelVoice, onVoiceDuck } from "@/lib/voice";
import { startMusic, stopMusic, duckMusic } from "@/lib/music";
import CanvasQuestion from "@/components/CanvasQuestion";
import { createBehaviorTracker } from "@/lib/behaviorSignals";
import QuizBattle from "@/components/battle/QuizBattle";
import { getFighter } from "@/lib/battle/roster";
import type { Question as BattleQuestion } from "@/lib/battle/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

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

  const [results, setResults] = useState<AnswerResult[]>([]);
  const [maxCombo, setMaxCombo] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [character] = useState<"GIGA" | "ACE">(user?.favoriteCharacter === "ACE" ? "ACE" : "GIGA");
  const [timings, setTimings] = useState<number[]>([]);
  const behavior = useRef(createBehaviorTracker());

  // The battle owns the on-screen question index and combo; these mirrors exist
  // so the scoring path stays synchronous and independent of render timing.
  const qIndexRef = useRef(0);
  const comboRef = useRef(0);

  // A.C.E. players get the technical glass cannon, GIGA players the all-rounder.
  const fighter = getFighter(character === "ACE" ? "vex" : "giga");

  /**
   * Adapt server questions to the battle's shape. `correctIndex` stays -1: the
   * key genuinely is not known here, and the battle resolves from the server's
   * verdict instead.
   */
  const battleQuestions: BattleQuestion[] = (quiz?.questions ?? []).map((q, i) => ({
    id: String(q.id ?? i),
    prompt: q.question,
    options: q.options,
    correctIndex: -1,
    explanation: "",
    category: q.topic,
  }));

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

  /**
   * Commit one answer and report back what the server said.
   *
   * The battle layer needs a verdict to resolve an attack, and the results
   * screen needs the running tally, so this does both and owns neither the
   * phase nor the pacing — QuizBattle drives those.
   */
  const commitToServer = useCallback(
    async (chosenIdx: number, timeTaken: number) => {
      if (!quiz) return { correct: false, correctIndex: null };

      let correctIdx = -1;
      let fact: string | null = null;
      try {
        const res = await fetch(`${API}/api/quiz/daily/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            token: quiz.token,
            questionIndex: qIndexRef.current,
            answer: chosenIdx,
            timeTaken,
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Could not record answer");
        correctIdx = json.data.correctIndex;
        fact = json.data.funFact ?? null;
      } catch {
        // A network failure shouldn't strand the player mid-quiz; the score is
        // recomputed server-side at submit regardless of what is shown here.
        correctIdx = -1;
      }

      const isCorrect = chosenIdx === correctIdx;
      const speedBonus = isCorrect && timeTaken < 5 ? 5 : 0;
      const streakMultiplier = user?.streakBonusMultiplier ?? 1;

      // Combo is tracked here as well as in the battle, because the points the
      // results screen shows are the quiz's, not the fight's.
      comboRef.current = isCorrect ? comboRef.current + 1 : 0;
      const points = Math.round(
        ((isCorrect ? 10 : 0) + speedBonus) * streakMultiplier * getComboMultiplier(comboRef.current)
      );

      setMaxCombo((m) => Math.max(m, comboRef.current));
      setTotalScore((s) => s + points);
      setTimings((t) => [...t, Math.round(timeTaken * 1000)]);
      setResults((r) => [
        ...r,
        { chosen: chosenIdx, correct: correctIdx, isCorrect, timeTaken, points, speedBonus },
      ]);

      qIndexRef.current += 1;
      return { correct: isCorrect, correctIndex: correctIdx < 0 ? null : correctIdx, explanation: fact };
    },
    [quiz, user]
  );

  /** Sound and voice, kept exactly as the plain quiz had them. */
  const handleFeedback = useCallback(
    (correct: boolean, combo: number, timedOut: boolean) => {
      if (correct) {
        playSfx("correct");
        const next = combo + 1;
        const milestone = next >= 3 && [3, 5, 7, 10].includes(next);
        if (milestone) playSfx("combo", { comboLevel: next });
        speak(milestone ? "streak" : "correct", character);
      } else {
        playSfx("wrong");
        speak(timedOut ? "timeout" : "wrong", character);
      }
    },
    [character]
  );



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
            qIndexRef.current = 0;
            comboRef.current = 0;
            setResults([]); setTotalScore(0); setMaxCombo(0); setTimings([]);
            setPhase("question");
          }}
          className="pill-btn pill-btn-primary w-full text-xl py-4"
        >
          Start Quiz
        </button>
      </div>
    </div>
  );

  if (phase === "question" && quiz) {
    return (
      <div className="min-h-screen text-[var(--text-1)]">
        <Navbar />
        <div className="mx-auto max-w-4xl px-3 py-3 sm:px-4 sm:py-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="gp-pixel text-[9px] text-[var(--gp-cyan)]">
              DAILY QUIZ · {quiz.theme}
            </span>
            <AudioControls />
          </div>

          <QuizBattle
            fighter={fighter}
            questions={battleQuestions}
            onCommit={commitToServer}
            onComplete={() => void submitQuiz()}
            onFeedback={handleFeedback}
            /* Prompts stay canvas-rendered so the question text is not
               scrapeable DOM, and the behaviour tracker keeps its signal. */
            renderPrompt={(q, i) => (
              <div className="mb-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span
                    className="gp-pixel border-2 px-2 py-1 text-[9px]"
                    style={{
                      borderColor: "var(--ink)",
                      background: "var(--gp-pink)",
                      color: "var(--ink)",
                    }}
                  >
                    {quiz.questions[i]?.difficulty}
                  </span>
                  <span
                    className="gp-pixel border-2 px-2 py-1 text-[9px]"
                    style={{
                      borderColor: "var(--ink)",
                      background: "var(--gp-cyan)",
                      color: "var(--ink)",
                    }}
                  >
                    {quiz.questions[i]?.topic}
                  </span>
                </div>
                <CanvasQuestion
                  text={q.prompt}
                  seed={`${i}-${quiz.questions[i]?.id}`}
                  onRendered={(ok) => behavior.current.markCanvasRendered(ok)}
                />
              </div>
            )}
          />
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
