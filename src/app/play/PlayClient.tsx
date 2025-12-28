"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ClientQuestion = {
  id: string;
  category: string;
  prompt: string;
  options: string[];
};

type Props = {
  questions: ClientQuestion[];
};

export default function PlayClient({ questions }: Props) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const current = questions[idx];

  const progress = useMemo(() => {
    const answered = Object.keys(answers).length;
    return Math.round((answered / questions.length) * 100);
  }, [answers, questions.length]);

  async function submitRound() {
    const payload = {
      // walletAddress: "kaspatest:..." // wire wallet connect later
      answers: Object.entries(answers).map(([id, choiceIndex]) => ({
        id,
        choiceIndex,
      })),
    };

    const res = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    sessionStorage.setItem("gp:lastResult", JSON.stringify(data));
    router.push("/result");
  }

  if (!current) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-white/80">No questions loaded.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-white/60">
              Geek Gauntlet – MVP
            </p>
            <p className="text-sm text-white/80">
              Question {idx + 1} of {questions.length}
            </p>
          </div>
          <div className="w-40">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-2 bg-white/70"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-right text-xs text-white/60">
              {progress}%
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-wider text-white/60">
          {current.category}
        </p>
        <h2 className="mt-2 text-xl font-semibold">{current.prompt}</h2>

        <div className="mt-4 grid gap-3">
          {current.options.map((opt, choiceIndex) => {
            const selected = answers[current.id] === choiceIndex;
            return (
              <button
                key={opt}
                onClick={() => setAnswers((p) => ({ ...p, [current.id]: choiceIndex }))}
                className={
                  "rounded-xl border px-4 py-3 text-left transition " +
                  (selected
                    ? "border-white/40 bg-white/15"
                    : "border-white/10 bg-white/5 hover:bg-white/10")
                }
              >
                <span className="text-sm text-white/90">{opt}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 disabled:opacity-40"
          >
            Back
          </button>

          {idx < questions.length - 1 ? (
            <button
              onClick={() => setIdx((i) => Math.min(questions.length - 1, i + 1))}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
            >
              Next
            </button>
          ) : (
            <button
              onClick={submitRound}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
            >
              Submit Round
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-white/50">
        TODO: Wallet connect + Testnet $GEEK reward send.
      </p>
    </div>
  );
}
