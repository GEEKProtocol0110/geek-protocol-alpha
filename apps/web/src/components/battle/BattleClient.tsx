"use client";

/**
 * Battle orchestrator.
 *
 * Owns three things and nothing else: the question clock, the reducer, and the
 * pacing between a resolved answer and the next question. All combat maths
 * lives in combat.ts; all transitions live in engine.ts.
 */

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import BattleArena from "./BattleArena";
import SpritePreloader from "./SpritePreloader";
import BattleHud from "./BattleHud";
import QuestionPanel from "./QuestionPanel";
import CharacterSelect from "./CharacterSelect";
import ResultScreen from "./ResultScreen";
import LevelIntro from "./LevelIntro";
import { QUESTION_MS } from "@/lib/battle/combat";
import { playSfx } from "@/lib/sfx";
import { useStageHeight } from "@/lib/battle/useStageHeight";
import { battleReducer, createBattle } from "@/lib/battle/engine";
import type { Fighter } from "@/lib/battle/types";

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

export default function BattleClient() {
  const [fighter, setFighter] = useState<Fighter | null>(null);
  const [level, setLevel] = useState(1);
  // `key` forces a fresh reducer instance on replay / next level.
  const [runKey, setRunKey] = useState(0);

  if (!fighter) {
    return <CharacterSelect onSelect={setFighter} />;
  }

  return (
    <Battle
      key={`${fighter.id}-${level}-${runKey}`}
      fighter={fighter}
      level={level}
      onNextLevel={() => setLevel((l) => l + 1)}
      onReplay={() => setRunKey((k) => k + 1)}
      onRoster={() => {
        setFighter(null);
        setLevel(1);
      }}
    />
  );
}

interface BattleProps {
  fighter: Fighter;
  level: number;
  onNextLevel: () => void;
  onReplay: () => void;
  onRoster: () => void;
}

function Battle({ fighter, level, onNextLevel, onReplay, onRoster }: BattleProps) {
  const [state, dispatch] = useReducer(battleReducer, undefined, () =>
    createBattle(fighter, level)
  );

  const [leaving, setLeaving] = useState(false);
  const skipRef = useRef<(() => void) | null>(null);
  const { stageRef, stageHeight } = useStageHeight<HTMLDivElement>();
  const deadlineRef = useRef<number>(0);
  // Mirrored into a ref so the rAF tick and the keydown handler can read the
  // live phase without being torn down and rebuilt on every state change.
  const phaseRef = useRef(state.phase);
  useEffect(() => {
    phaseRef.current = state.phase;
  }, [state.phase]);

  /* ── Question clock ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (state.phase !== "question") return;

    deadlineRef.current = performance.now() + QUESTION_MS;
    // One timer instead of a frame loop — the bar is drawn by the compositor.
    const id = window.setTimeout(() => {
      // Running out of time is a wrong answer: the boss gets its opening.
      if (phaseRef.current === "question") dispatch({ type: "TIMEOUT" });
    }, QUESTION_MS);

    return () => window.clearTimeout(id);
  }, [state.phase, state.questionIndex]);

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

  const handlePick = useCallback(
    (index: number) => {
      if (phaseRef.current !== "question") return;
      const left = Math.max(0, deadlineRef.current - performance.now());
      dispatch({ type: "ANSWER", index, remainingMs: left });
    },
    []
  );

  /* ── Keyboard: A–D and 1–4, so a fast player is not mouse-bound ───────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phaseRef.current !== "question") return;
      const k = e.key.toLowerCase();
      const byLetter = ["a", "b", "c", "d"].indexOf(k);
      const byDigit = ["1", "2", "3", "4"].indexOf(k);
      const index = byLetter >= 0 ? byLetter : byDigit;
      if (index >= 0) {
        e.preventDefault();
        handlePick(index);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlePick]);

  if (state.phase === "intro") {
    return <LevelIntro state={state} onBegin={() => dispatch({ type: "BEGIN" })} />;
  }

  const question = state.questions[state.questionIndex];
  const revealed = state.phase === "resolving";
  const finished = state.phase === "victory" || state.phase === "defeat";

  return (
    <div style={{ background: "var(--surface-0)" }}>
      <div
        ref={stageRef}
        className="bf-stage mx-auto max-w-4xl px-2 py-2 sm:px-4 sm:py-4"
        style={stageHeight ? { height: stageHeight } : { minHeight: "100dvh" }}
      >
        <SpritePreloader />
        <div className="bf-stage-hud">
          <BattleHud
            state={state}
            playerHit={state.lastResult?.target === "player"}
            bossHit={state.lastResult?.target === "boss"}
            comboKey={state.combo}
          />
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
              correctIndex={revealed ? question.correctIndex : null}
              onPick={handlePick}
            />
            <p className="bf-stage-hint gp-pixel mt-1.5 text-center text-[7px] text-[var(--text-3)] sm:text-[8px]">
              PRESS A–D OR 1–4 TO STRIKE · FASTER ANSWERS HIT HARDER
            </p>
          </div>
        </div>
      </div>

      {finished && (
        <ResultScreen
          state={state}
          onNext={onNextLevel}
          onReplay={onReplay}
          onRoster={onRoster}
        />
      )}
    </div>
  );
}
