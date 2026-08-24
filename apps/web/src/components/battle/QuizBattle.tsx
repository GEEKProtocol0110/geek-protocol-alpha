"use client";

/**
 * The Daily Quiz, fought instead of clicked.
 *
 * This is the battle presentation bound to the real quiz API. Two things make
 * it different from the standalone prototype:
 *
 *  1. The server owns correctness. The answer key never reaches the browser
 *     before a pick is committed, so the attack is resolved from the server's
 *     verdict via the RESOLVE event, not from the question object.
 *
 *  2. It runs in `endurance` mode. Every one of the ten questions must be
 *     answered for the attempt to score, so a knockout is never allowed to cut
 *     the run short and cost the player their rewards.
 */

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import BattleArena from "./BattleArena";
import BattleHud from "./BattleHud";
import QuestionPanel from "./QuestionPanel";
import { QUESTION_MS } from "@/lib/battle/combat";
import { battleReducer, createBattle } from "@/lib/battle/engine";
import { getDailyBoss } from "@/lib/battle/roster";
import type { Fighter, Question } from "@/lib/battle/types";

/** What the server says about a committed answer. */
export interface CommitVerdict {
  correct: boolean;
  correctIndex: number | null;
  explanation?: string | null;
}

interface Props {
  fighter: Fighter;
  /** Real quiz questions. `correctIndex` is unknown here and stays -1. */
  questions: Question[];
  /** Commits the pick to the server and resolves with its verdict. */
  onCommit: (index: number, timeTakenSec: number) => Promise<CommitVerdict>;
  /** Fired once, after the final question has been resolved and displayed. */
  onComplete: (outcome: { won: boolean; bestCombo: number }) => void;
  /** Hooks for the existing sfx / voice layer. */
  onFeedback?: (correct: boolean, combo: number, timedOut: boolean) => void;
  /** Lets the quiz keep rendering prompts to canvas instead of DOM text. */
  renderPrompt?: (question: Question, index: number) => React.ReactNode;
}

const HOLD_CORRECT_MS = 1500;
const HOLD_WRONG_MS = 3200;

export default function QuizBattle({
  fighter,
  questions,
  onCommit,
  onComplete,
  onFeedback,
  renderPrompt,
}: Props) {
  const [state, dispatch] = useReducer(battleReducer, undefined, () =>
    createBattle(fighter, 4, {
      mode: "endurance",
      questions,
      boss: getDailyBoss(),
    })
  );

  const [clock, setClock] = useState({ q: 0, remainingMs: QUESTION_MS });
  const remainingMs = clock.q === state.questionIndex ? clock.remainingMs : QUESTION_MS;

  // Set between the pick and the server's verdict, so the panel can acknowledge
  // the choice without judging it yet.
  const [pending, setPending] = useState(false);
  const [verdict, setVerdict] = useState<CommitVerdict | null>(null);

  const deadlineRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef(state.phase);
  const pendingRef = useRef(false);
  const completedRef = useRef(false);

  useEffect(() => {
    phaseRef.current = state.phase;
  }, [state.phase]);

  /* ── Start immediately: the quiz page already had its own intro. ───────── */
  useEffect(() => {
    dispatch({ type: "BEGIN" });
  }, []);

  /* ── Commit a pick, then let the server decide what it did ─────────────── */
  const commit = useCallback(
    async (index: number | null, remaining: number) => {
      if (pendingRef.current) return;
      pendingRef.current = true;
      setPending(true);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

      const timeTakenSec = (QUESTION_MS - remaining) / 1000;
      let result: CommitVerdict;
      try {
        result = await onCommit(index ?? -1, timeTakenSec);
      } catch {
        // A network failure must not strand the player. Treat it as a miss for
        // the fight; the server recomputes the real score at submit anyway.
        result = { correct: false, correctIndex: null };
      }

      setVerdict(result);
      onFeedback?.(result.correct, state.combo, index === null);
      dispatch({
        type: "RESOLVE",
        correct: result.correct,
        index,
        remainingMs: remaining,
      });
      pendingRef.current = false;
      setPending(false);
    },
    [onCommit, onFeedback, state.combo]
  );

  /* ── Question clock ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (state.phase !== "question") return;

    const q = state.questionIndex;
    deadlineRef.current = performance.now() + QUESTION_MS;

    const tick = () => {
      const left = deadlineRef.current - performance.now();
      if (left <= 0) {
        setClock({ q, remainingMs: 0 });
        if (phaseRef.current === "question" && !pendingRef.current) void commit(null, 0);
        return;
      }
      setClock({ q, remainingMs: left });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [state.phase, state.questionIndex, commit]);

  /* ── Hold on the resolution, then move on ──────────────────────────────── */
  useEffect(() => {
    if (state.phase !== "resolving") return;
    const correct = state.lastResult?.target === "boss";
    const t = setTimeout(
      () => {
        setVerdict(null);
        dispatch({ type: "ADVANCE" });
      },
      correct ? HOLD_CORRECT_MS : HOLD_WRONG_MS
    );
    return () => clearTimeout(t);
  }, [state.phase, state.lastResult]);

  /* ── Hand the outcome back once, at the end ────────────────────────────── */
  useEffect(() => {
    if (state.phase !== "victory" && state.phase !== "defeat") return;
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete({ won: state.phase === "victory", bestCombo: state.bestCombo });
  }, [state.phase, state.bestCombo, onComplete]);

  /* ── Keyboard input ────────────────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phaseRef.current !== "question" || pendingRef.current) return;
      const k = e.key.toLowerCase();
      const byLetter = ["a", "b", "c", "d"].indexOf(k);
      const byDigit = ["1", "2", "3", "4"].indexOf(k);
      const index = byLetter >= 0 ? byLetter : byDigit;
      if (index >= 0) {
        e.preventDefault();
        void commit(index, Math.max(0, deadlineRef.current - performance.now()));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commit]);

  const question = state.questions[state.questionIndex];
  const revealed = state.phase === "resolving";

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <BattleHud
        state={state}
        playerHit={state.lastResult?.target === "player"}
        bossHit={state.lastResult?.target === "boss"}
        comboKey={state.combo}
      />

      <BattleArena
        fighter={state.fighter}
        boss={state.boss}
        result={state.lastResult}
        playerDown={state.playerHp <= 0}
        bossDown={state.bossHp <= 0}
        compact
      />

      {/* Endurance mode keeps going after a knockout so the attempt still
          scores — say so, rather than letting the HUD look broken. */}
      {state.playerHp <= 0 && (
        <div
          className="border-2 px-3 py-2 text-center"
          style={{ borderColor: "var(--gp-danger)", background: "var(--surface-2)" }}
        >
          <span className="gp-pixel text-[9px]" style={{ color: "var(--gp-danger)" }}>
            SHIELDS DOWN — KEEP ANSWERING. YOUR REWARDS STILL COUNT.
          </span>
        </div>
      )}

      <QuestionPanel
        question={question}
        remainingMs={remainingMs}
        pickedIndex={state.lastPickedIndex}
        revealed={revealed}
        correctIndex={revealed ? verdict?.correctIndex ?? null : null}
        explanation={verdict?.explanation}
        pending={pending}
        promptSlot={renderPrompt?.(question, state.questionIndex)}
        onPick={(i) => void commit(i, Math.max(0, deadlineRef.current - performance.now()))}
      />

      <p className="gp-pixel text-center text-[8px] text-[var(--text-3)]">
        PRESS A–D OR 1–4 TO STRIKE · FASTER ANSWERS HIT HARDER
      </p>
    </div>
  );
}
