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
import SpritePreloader from "./SpritePreloader";
import BattleHud from "./BattleHud";
import QuestionPanel from "./QuestionPanel";
import { QUESTION_MS } from "@/lib/battle/combat";
import { playSfx } from "@/lib/sfx";
import { useStageHeight } from "@/lib/battle/useStageHeight";
import { battleReducer, createBattle } from "@/lib/battle/engine";
import { getDailyBoss } from "@/lib/battle/roster";
import type { Boss, Fighter, Question } from "@/lib/battle/types";

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
  /** Hook for the page's own combo cue. */
  onFeedback?: (correct: boolean, combo: number) => void;
  /** Lets the quiz keep rendering prompts to canvas instead of DOM text. */
  renderPrompt?: (question: Question, index: number) => React.ReactNode;
  /** The encounter. Defaults to the Daily Quiz boss. */
  boss?: Boss;
  /** Extra controls under the question panel — the Gauntlet's hint token. */
  footerSlot?: React.ReactNode;
}

/**
 * How long the arena holds on a resolved answer.
 *
 * Short enough that the fight never feels stalled: a landed hit reads in well
 * under a second, so holding longer just makes the game look like it is
 * thinking. A miss gets more room only because there is an explanation to
 * read — and the player can cut even that short at any time.
 */
const HOLD_CORRECT_MS = 850;
const HOLD_WRONG_MS = 2000;
/** How long the outgoing question spends sliding away before it is replaced. */
const EXIT_MS = 200;
/** The hit has to land on screen before a skip is allowed to cut it. */
const MIN_BEAT_MS = 320;

export default function QuizBattle({
  fighter,
  questions,
  onCommit,
  onComplete,
  onFeedback,
  renderPrompt,
  boss,
  footerSlot,
}: Props) {
  const [state, dispatch] = useReducer(battleReducer, undefined, () =>
    createBattle(fighter, boss?.level ?? 4, {
      mode: "endurance",
      questions,
      boss: boss ?? getDailyBoss(),
    })
  );

  // Set between the pick and the server's verdict, so the panel can acknowledge
  // the choice without judging it yet.
  const [pending, setPending] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const skipRef = useRef<(() => void) | null>(null);
  const [verdict, setVerdict] = useState<CommitVerdict | null>(null);

  const { stageRef, stageHeight } = useStageHeight<HTMLDivElement>();
  const deadlineRef = useRef(0);
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
      onFeedback?.(result.correct, state.combo);
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

    deadlineRef.current = performance.now() + QUESTION_MS;
    // One timer instead of a frame loop: the bar is drawn by the compositor,
    // so nothing here needs to run every frame.
    const id = window.setTimeout(() => {
      if (phaseRef.current === "question" && !pendingRef.current) void commit(null, 0);
    }, QUESTION_MS);

    return () => window.clearTimeout(id);
  }, [state.phase, state.questionIndex, commit]);

  /* ── Hold on the resolution, slide it out, then move on ────────────────── */
  useEffect(() => {
    if (state.phase !== "resolving") return;

    const correct = state.lastResult?.target === "boss";
    const hold = correct ? HOLD_CORRECT_MS : HOLD_WRONG_MS;
    const readyAt = performance.now() + MIN_BEAT_MS;
    let exitTimer = 0;
    let advanceTimer = 0;
    let started = false;

    // Split into "start leaving" and "actually advance" so a skip can jump
    // straight to the exit without cancelling the slide.
    const leave = () => {
      if (started) return;
      started = true;
      window.clearTimeout(exitTimer);
      setLeaving(true);
      advanceTimer = window.setTimeout(() => {
        setLeaving(false);
      setVerdict(null);
        dispatch({ type: "ADVANCE" });
      }, EXIT_MS);
    };

    exitTimer = window.setTimeout(leave, Math.max(0, hold - EXIT_MS));

    // Nobody should be made to watch a timer they have already learned from.
    const skip = () => {
      if (performance.now() < readyAt) return;
      leave();
    };
    skipRef.current = skip;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
        e.preventDefault();
        skip();
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(advanceTimer);
      window.removeEventListener("keydown", onKey);
      skipRef.current = null;
    };
  }, [state.phase, state.lastResult]);

  /* ── Impact audio ──────────────────────────────────────────────────────── */
  useEffect(() => {
    const r = state.lastResult;
    if (!r) return;
    if (state.bossHp <= 0) return void playSfx("victory");
    if (state.playerHp <= 0) return void playSfx("ko");
    if (r.target === "player") return void playSfx("counter");
    if (r.special) playSfx("special");
    else if (r.crit) playSfx("crit");
    else if (r.tier === "critical" || r.tier === "heavy") playSfx("hitHeavy");
    else playSfx("hitLight");
  }, [state.lastResult, state.bossHp, state.playerHp]);

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
    <div
      ref={stageRef}
      className="bf-stage"
      style={stageHeight ? { height: stageHeight } : undefined}
    >
      <SpritePreloader />
        <div className="bf-stage-hud">
        <BattleHud
          state={state}
          playerHit={state.lastResult?.target === "player"}
          bossHit={state.lastResult?.target === "boss"}
          comboKey={state.combo}
        />

        {/* Endurance mode keeps going after a knockout so the attempt still
            scores — say so, rather than letting the HUD look broken. */}
        {state.playerHp <= 0 && (
          <div
            className="mt-2 border-2 px-2 py-1 text-center"
            style={{ borderColor: "var(--gp-danger)", background: "var(--surface-2)" }}
          >
            <span className="gp-pixel text-[7px] sm:text-[9px]" style={{ color: "var(--gp-danger)" }}>
              SHIELDS DOWN — KEEP ANSWERING. YOUR REWARDS STILL COUNT.
            </span>
          </div>
        )}
      </div>

      <div className="bf-stage-main">
        <div className="bf-stage-arena">
          <BattleArena
            fighter={state.fighter}
            boss={state.boss}
            result={state.lastResult}
            playerDown={state.playerHp <= 0}
            bossDown={state.bossHp <= 0}
            playerMaxHp={state.playerMaxHp}
            fill
          />
        </div>

        <div className="bf-stage-panel">
          <QuestionPanel
            question={question}
            questionKey={state.questionIndex}
              leaving={leaving}
            onSkip={() => skipRef.current?.()}

            pickedIndex={state.lastPickedIndex}
            revealed={revealed}
            correctIndex={revealed ? verdict?.correctIndex ?? null : null}
            explanation={verdict?.explanation}
            pending={pending}
            promptSlot={renderPrompt?.(question, state.questionIndex)}
            onPick={(i) => void commit(i, Math.max(0, deadlineRef.current - performance.now()))}
          />
          {footerSlot}
          <p className="bf-stage-hint gp-pixel mt-1.5 text-center text-[7px] text-[var(--text-3)] sm:text-[8px]">
            PRESS A–D OR 1–4 TO STRIKE · FASTER ANSWERS HIT HARDER
          </p>
        </div>
      </div>
    </div>
  );
}
