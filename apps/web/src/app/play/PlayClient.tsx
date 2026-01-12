"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { startQuiz, submitQuiz, type StartQuizResponse } from "@/lib/api";
import { mvpQuestions as questionBank, type Question as LocalQuestion } from "@/lib/questions";
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

type ApiQuestion = StartQuizResponse["questions"][number] & { difficulty?: string };

function mapApiQuestions(all: ApiQuestion[]): Q[] {
  const normalized: Q[] = (all ?? []).map((q, i) => {
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
  const choices = current?.choices ?? [];

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

  useEffect(() => {
    let mounted = true;
    const fetchHealth = async () => {
      try {
        const r = await fetch(`${API_BASE}/health/worker`);
        if (r.ok) {
          const j = await r.json();
          if (mounted) setWorkerAlive(Boolean(j.alive));
        }
      } catch {
        if (mounted) setWorkerAlive(null);
      }
    };
    fetchHealth();
    const id = setInterval(fetchHealth, 15000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [API_BASE]);

  useEffect(() => {
    if (phase === "run" && secondsLeft === 0) {
      finishRun();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase]);

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
          (questionBank as LocalQuestion[]).map((q) => ({
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

    (async () => {
      try {
        const resp = await submitQuiz(attemptId, attemptToken, answers);
        router.push(
          `/result?correct=${resp.score}&total=${total}&score=${resp.scorePct}&time=${resp.timeSeconds}&attempt=${attemptId}`
        );
      } catch {
        const scorePct = Math.round((correctCount / total) * 100);
        router.push(
          `/result?correct=${correctCount}&total=${total}&score=${scorePct}&time=${RUN_SECONDS - secondsLeft}`
        );
      }
    })();
  }

  function choose(choiceId: string) {
    if (phase !== "run" || locked) return;

    setSelectedId(choiceId);
    setLocked(true);
    const selectedIdx = Number(choiceId);
    setAnswers((arr) => {
      const nextAnswers = [...arr];
      nextAnswers[idx] = selectedIdx;
      return nextAnswers;
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
        <div className="text-xl font-semibold text-white">Preparing your run…</div>
        <p className="mt-2 text-sm text-white/70">Fetching questions from the API.</p>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="space-y-6">
        <div className="layer-card flex flex-col gap-6 p-8 md:flex-row md:items-center">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-wide text-white/60">
              <span className="size-2 rounded-full bg-[var(--brand-primary)]" />
              Geek Gauntlet • Alpha
            </div>
            <h1 className="text-3xl font-semibold text-white md:text-4xl">
              {RUN_LENGTH} questions. {RUN_SECONDS} seconds. Earn-mode integrity baked in.
            </h1>
            <p className="text-white/70">
              A single sprint measured by A.C.E. intelligence. We verify every response server-side, apply HMAC attempt tokens, and post-run push rewards to the Kaspa queue.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/30 p-6 text-sm text-white/80">
            <div className="text-xs uppercase tracking-wide text-white/50">Run telemetry</div>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center justify-between">
                <span>Question cadence</span>
                <span className="font-semibold text-white">15s per card</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Attempt token TTL</span>
                <span className="font-semibold text-white">15 minutes</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Worker heartbeat</span>
                <span className="font-semibold text-white">{workerAlive === null ? "Pending" : workerAlive ? "Synced" : "Idle"}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MiniCard title="Server scoring" desc="Submit answers once. Fastify scores, logs, and queues payouts." />
          <MiniCard title="Kasware identity" desc="Connect wallet for Earn mode. Practice stays open for everyone." />
          <MiniCard title="Mantra" desc="All hope, no hype. Signal gets paid." />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={startRun}
            className="rounded-2xl bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-secondary)] to-[var(--brand-tertiary)] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-black transition hover:scale-[1.01]"
          >
            Start Run
          </button>
          <Link
            href="/"
            className="rounded-2xl border border-white/15 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white/70 transition hover:bg-white/5"
          >
            Back Home
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="layer-card space-y-4 p-8 text-center">
        <div className="text-4xl">🛰️</div>
        <p className="text-xl font-semibold text-white">A.C.E. is verifying your run…</p>
        <p className="text-sm text-white/70">Submitting to Fastify, scoring server-side, and queueing rewards.</p>
      </div>
    );
  }

  const total = runQuestions.length;
  const progress = total ? (idx + 1) / total : 0;
  const scorePct = total ? Math.round((correctCount / (idx + 1)) * 100) : 0;
  const questionProgress = clamp(questionSecondsLeft / QUESTION_SECONDS, 0, 1);

  return (
    <div className="space-y-6">
      <div className="layer-card space-y-4 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/50">Run Progress</p>
            <h2 className="text-2xl font-semibold text-white">
              Question {idx + 1} of {total}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <HudMetric label="Time Left" value={`${secondsLeft}s`} detail="Total run" />
            <HudMetric label="Question" value={`${questionSecondsLeft}s`} detail="Card timer" variant={questionSecondsLeft <= 5 ? "alert" : undefined} />
            <HudMetric label="Correct" value={`${correctCount}`} detail={`${clamp(scorePct, 0, 100)}%`} />
            <HudMetric label="Worker" value={workerAlive === null ? "…" : workerAlive ? "Stable" : "Idle"} detail="Rewards" />
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-secondary)] to-[var(--brand-tertiary)]" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      </div>

      <div className={`rounded-3xl border p-5 ${mode === "earn" ? "border-emerald-400/30 bg-emerald-400/5" : "border-white/10 bg-white/5"}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/60">Mode</p>
            <p className="text-lg font-semibold text-white">{mode === "earn" ? "Earn Mode" : "Practice Mode"}</p>
          </div>
          <p className="text-sm text-white/70">
            {mode === "earn"
              ? "Verified wallet connected. Rewards will route to your Kaspa address after confirmation."
              : "Practice freely. Connect Kasware when you're ready to turn scores into $GEEK."}
          </p>
        </div>
      </div>

      <div className="layer-card space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wide text-white/50">
              {current?.category ? `${current.category} • ` : ""}
              {current?.difficulty ?? "Alpha"}
            </div>
            <h3 className="mt-2 text-2xl font-semibold text-white">{current?.question}</h3>
          </div>
          <div className="w-full max-w-xs">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-right">
              <div className="text-[0.65rem] uppercase tracking-wide text-white/50">Question timer</div>
              <div className={`text-2xl font-semibold ${questionSecondsLeft <= 5 ? "text-red-400" : questionSecondsLeft <= 10 ? "text-amber-300" : "text-white"}`}>{questionSecondsLeft}s</div>
              <div className="mt-3 h-1 rounded-full bg-white/10">
                <div className="h-full rounded-full bg-white/70" style={{ width: `${questionProgress * 100}%` }} />
              </div>
            </div>
            <p className="mt-3 text-xs uppercase tracking-wide text-white/50">
              {locked ? "Answer locked" : "Select an answer"}
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {choices.map((c) => {
            const isSelected = selectedId === c.id;
            const isCorrect = c.id === current?.answerId;
            const showCorrect = locked && isCorrect;
            const showWrong = locked && isSelected && !isCorrect;

            return (
              <button
                key={c.id}
                onClick={() => choose(c.id)}
                disabled={locked}
                className={`w-full rounded-2xl border px-5 py-4 text-left transition ${locked ? "cursor-not-allowed" : "hover:-translate-y-0.5"} ${showCorrect ? "border-emerald-400/60 bg-emerald-400/10" : showWrong ? "border-red-400/40 bg-red-400/5" : isSelected ? "border-white/40 bg-white/10" : "border-white/10 bg-black/30 hover:border-white/20"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-white">{c.text}</span>
                  <span className="text-xs text-white/50">{showCorrect ? "Correct" : showWrong ? "Incorrect" : isSelected ? "Selected" : "Choose"}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button onClick={() => finishRun()} className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/5">
            End Run
          </button>
          <button
            onClick={next}
            disabled={!locked}
            className={`rounded-2xl px-6 py-3 text-sm font-semibold uppercase tracking-wide ${locked ? "bg-white text-black hover:opacity-90" : "bg-white/10 text-white/40"}`}
          >
            {idx >= total - 1 ? "Finish" : "Next Question"}
          </button>
        </div>
      </div>
    </div>
  );
}

function HudMetric({
  label,
  value,
  detail,
  variant,
}: {
  label: string;
  value: string;
  detail?: string;
  variant?: "alert";
}) {
  return (
    <div className={`rounded-2xl border px-4 py-2 text-left ${variant === "alert" ? "border-red-400/40 bg-red-400/10" : "border-white/10 bg-black/30"}`}>
      <div className="text-[0.65rem] uppercase tracking-wide text-white/50">{label}</div>
      <div className="text-lg font-semibold text-white">{value}</div>
      {detail && <div className="text-[0.65rem] text-white/50">{detail}</div>}
    </div>
  );
}

function MiniCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="font-semibold text-white">{title}</div>
      <div className="mt-1 text-sm text-white/70">{desc}</div>
    </div>
  );
}
