"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { startQuiz, submitQuiz } from "@/lib/api";
import { mvpQuestions as questionBank } from "@/lib/questions";
import { useWallet } from "@/components/WalletProvider";

type Choice = { id: string; text: string };
type Q = {
  id: string;
  question: string;
  choices: Choice[];
  answerId: string;
  category?: string;
  difficulty?: string;
};

const RUN_LENGTH = 10;
const RUN_SECONDS = 90;
const QUESTION_SECONDS = 15;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function mapApiQuestions(all: any[]): Q[] {
  const normalized: Q[] = (all ?? []).map((q: any, i: number) => {
    const choices: Choice[] = (q.options ?? []).map((text: string, idx: number) => ({
      id: String(idx),
      text,
    }));
    const answerId =
      typeof q.correctIndex === "number" && choices[q.correctIndex]
        ? choices[q.correctIndex].id
        : "";
    return {
      id: String(q.id ?? i),
      question: String(q.prompt ?? ""),
      choices,
      answerId,
      category: q.category,
      difficulty: "Alpha",
    };
  });
  return normalized.filter((q) => q.question && q.choices.length >= 2);
}

export default function PlayClient() {
  const router = useRouter();
  const { mode } = useWallet();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

  const [runQuestions, setRunQuestions] = useState<Q[]>([]);
  const [attemptId, setAttemptId] = useState<string>("");
  const [attemptToken, setAttemptToken] = useState<string>("");
  const [answers, setAnswers] = useState<number[]>([]);
  const [phase, setPhase] = useState<"intro" | "run" | "done">("intro");

  const [idx, setIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(RUN_SECONDS);
  const [questionSecondsLeft, setQuestionSecondsLeft] = useState(QUESTION_SECONDS);
  const [workerAlive, setWorkerAlive] = useState<boolean | null>(null);

  const current = runQuestions[idx];

  // Overall timer (only during run)
  useEffect(() => {
    if (phase !== "run") return;

    const t = setInterval(() => {
      setSecondsLeft((s) => {
        const next = s - 1;
        if (next <= 0) return 0;
        return next;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [phase]);

  // Per-question timer (only during run)
  useEffect(() => {
    if (phase !== "run" || locked) return;

    const t = setInterval(() => {
      setQuestionSecondsLeft((s) => {
        const next = s - 1;
        if (next <= 0) return 0;
        return next;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [phase, locked, idx]);

  // Poll worker health (visible in HUD)
  useEffect(() => {
    let mounted = true;
    const fetchHealth = async () => {
      try {
        const r = await fetch(`${API_BASE}/health/worker`);
        if (r.ok) {
          const j = await r.json();
          if (mounted) setWorkerAlive(Boolean(j.alive));
        }
      } catch {}
    };
    fetchHealth();
    const id = setInterval(fetchHealth, 15000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [API_BASE]);

  // If overall timer hits 0, finish
  useEffect(() => {
    if (phase === "run" && secondsLeft === 0) {
      finishRun();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase]);

  // If question timer hits 0, auto-advance
  useEffect(() => {
    if (phase === "run" && questionSecondsLeft === 0 && idx < runQuestions.length) {
      next();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionSecondsLeft, phase]);

  function startRun() {
    setPhase("run");
    setIdx(0);
    setSelectedId(null);
    setLocked(false);
    setCorrectCount(0);
    setSecondsLeft(RUN_SECONDS);
    setQuestionSecondsLeft(QUESTION_SECONDS);
    // Fetch attempt and questions from API
    (async () => {
      try {
        const start = await startQuiz("General Geek");
        setAttemptId(start.attemptId);
        setAttemptToken(start.attemptToken);
        const mapped = mapApiQuestions(start.questions);
        if (mapped.length) {
          setRunQuestions(mapped.slice(0, RUN_LENGTH));
          setAnswers(new Array(mapped.length).fill(-1));
        } else {
          throw new Error("No API questions");
        }
      } catch (err) {
        console.error("API start failed, falling back to local questions", err);
        const fallback = mapApiQuestions(
          (questionBank as any[]).map((q: any) => ({
            id: q.id,
            category: q.category,
            prompt: q.prompt,
            options: q.options,
            correctIndex: q.answerIndex,
          }))
        );
        setRunQuestions(fallback.slice(0, RUN_LENGTH));
        setAnswers(new Array(fallback.length).fill(-1));
      }
    })();
  }

  function finishRun() {
    setPhase("done");
    const total = runQuestions.length || RUN_LENGTH;
    // Submit to server for canonical scoring
    (async () => {
      try {
        const resp = await submitQuiz(attemptId, attemptToken, answers);
        router.push(
          `/result?correct=${resp.score}&total=${total}&score=${resp.scorePct}&time=${resp.timeSeconds}&attempt=${attemptId}`
        );
      } catch (err) {
        // Fallback to local computed values if submit fails
        const scorePct = Math.round((correctCount / total) * 100);
        router.push(
          `/result?correct=${correctCount}&total=${total}&score=${scorePct}&time=${RUN_SECONDS - secondsLeft}`
        );
      }
    })();
  }

  function choose(choiceId: string) {
    if (phase !== "run") return;
    if (locked) return;

    setSelectedId(choiceId);
    setLocked(true);
    const selectedIdx = Number(choiceId);
    setAnswers((arr) => {
      const next = [...arr];
      next[idx] = selectedIdx;
      return next;
    });
    if (current?.answerId && choiceId === current.answerId) {
      setCorrectCount((c) => c + 1);
    }
  }

  function next() {
    if (phase !== "run") return;

    const last = idx >= runQuestions.length - 1;
    if (last) {
      finishRun();
      return;
    }

    setIdx((i) => i + 1);
    setSelectedId(null);
    setLocked(false);
    setQuestionSecondsLeft(QUESTION_SECONDS);
  }

  if (!runQuestions.length && phase === "run") {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-xl font-semibold">Preparing your run…</div>
        <p className="mt-2 text-sm text-white/70">Fetching questions from the API.</p>
      </div>
    );
  }

  // INTRO
  if (phase === "intro") {
    return (
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-white/60">Geek Protocol</div>
            <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight">
              Alpha Run: Geek Gauntlet
            </h1>
            <p className="mt-3 text-white/70">
              {RUN_LENGTH} questions • {RUN_SECONDS}s total • 15s per question • instant feedback
            </p>
            <p className="mt-1 text-sm text-white/60">
              Mantra: <span className="text-white/80 font-medium">All hope, no hype.</span>
            </p>
          </div>

          <div className="hidden md:block rounded-2xl border border-white/10 bg-black/30 px-5 py-4">
            <div className="text-xs text-white/60">A.C.E.</div>
            <div className="mt-1 font-medium">"Initialize run."</div>
            <div className="mt-1 text-xs text-white/60">Knowledge verification online.</div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <MiniCard title="Score" desc="Earn points by answering correctly." />
          <MiniCard title="Timer" desc="Beat the clock to maximize performance." />
          <MiniCard title="Integrity" desc="No hype. Just knowledge." />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={startRun}
            className="rounded-xl bg-white text-black px-5 py-3 font-medium hover:opacity-90"
          >
            Start Run
          </button>

          <a
            href="/"
            className="rounded-xl border border-white/15 px-5 py-3 font-medium hover:bg-white/5"
          >
            Back Home
          </a>
        </div>
      </div>
    );
  }

  // RUN
  const total = runQuestions.length;
  const progress = total ? (idx + 1) / total : 0;
  const scorePct = total ? Math.round((correctCount / (idx + 1)) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Top HUD */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-xs text-white/60">Run Progress</div>
            <div className="mt-1 font-semibold">
              Question {idx + 1} / {total}
            </div>
          </div>

          <div className="flex gap-3">
            <HudPill label="Time" value={`${secondsLeft}s`} />
            <HudPill label="Correct" value={`${correctCount}`} />
            <HudPill label="Run %" value={`${clamp(scorePct, 0, 100)}%`} />
            <HudPill label="Worker" value={workerAlive === null ? "…" : workerAlive ? "Alive" : "Idle"} />
          </div>
        </div>

        <div className="mt-4 h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-white/70"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>

      <div
        className={`rounded-2xl border p-4 ${
          mode === "earn"
            ? "border-emerald-400/20 bg-emerald-400/10"
            : "border-white/10 bg-white/5"
        }`}
      >
        <div className="text-xs text-white/60">Rewards Mode</div>
        <div className="mt-1 font-medium">
          {mode === "earn"
            ? "Earn Mode: rewards will route to your connected Kaspa wallet (when enabled)."
            : "Practice Mode: connect Kasware to become eligible to earn $GEEK."}
        </div>
        <div className="mt-1 text-sm text-white/70">
          {mode === "earn"
            ? "Your Knowledge is Now an Asset. All hope, no hype."
            : "You can still play now — rewards are only for verified wallet addresses."}
        </div>
      </div>

      {/* Question Card */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="text-xs text-white/60">
              {current.category ? `${current.category} • ` : ""}
              {current.difficulty ?? "Alpha"}
            </div>
            <h2 className="mt-2 text-xl md:text-2xl font-semibold">
              {current.question}
            </h2>
          </div>

          <div className="hidden md:block text-right space-y-2">
            <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
              <div className="text-[10px] text-white/50">Question Timer</div>
              <div
                className={`text-sm font-semibold ${
                  questionSecondsLeft <= 5
                    ? "text-red-400"
                    : questionSecondsLeft <= 10
                    ? "text-yellow-400"
                    : "text-white"
                }`}
              >
                {questionSecondsLeft}s
              </div>
            </div>
            <div>
              <div className="text-xs text-white/60">A.C.E.</div>
              <div className="mt-1 text-sm text-white/80">
                {locked ? "Answer locked." : "Select your answer."}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3">
          {current.choices.map((c) => {
            const isSelected = selectedId === c.id;
            const isCorrect = c.id === current.answerId;
            const showCorrect = locked && isCorrect;
            const showWrong = locked && isSelected && !isCorrect;

            const base =
              "w-full text-left rounded-2xl border px-4 py-4 transition";
            const idle = "border-white/10 bg-black/30 hover:bg-white/5";
            const correct = "border-white/40 bg-white/10";
            const wrong = "border-white/20 bg-black/50 opacity-80";

            return (
              <button
                key={c.id}
                onClick={() => choose(c.id)}
                disabled={locked}
                className={[
                  base,
                  locked ? "cursor-not-allowed" : "cursor-pointer",
                  showCorrect ? correct : showWrong ? wrong : idle,
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{c.text}</div>
                  {showCorrect ? (
                    <span className="text-xs text-white/80">Correct</span>
                  ) : showWrong ? (
                    <span className="text-xs text-white/60">Incorrect</span>
                  ) : (
                    <span className="text-xs text-white/40">Choose</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={() => finishRun()}
            className="rounded-xl border border-white/15 px-4 py-3 text-sm font-medium hover:bg-white/5"
          >
            End Run
          </button>

          <button
            onClick={next}
            disabled={!locked}
            className={[
              "rounded-xl px-5 py-3 text-sm font-medium",
              locked
                ? "bg-white text-black hover:opacity-90"
                : "bg-white/10 text-white/40 cursor-not-allowed",
            ].join(" ")}
          >
            {idx >= total - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

function HudPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
      <div className="text-[10px] text-white/50">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function MiniCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-sm text-white/70">{desc}</div>
    </div>
  );
}
