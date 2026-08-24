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
import BattleHud from "./BattleHud";
import QuestionPanel from "./QuestionPanel";
import CharacterSelect from "./CharacterSelect";
import ResultScreen from "./ResultScreen";
import LevelIntro from "./LevelIntro";
import { QUESTION_MS } from "@/lib/battle/combat";
import { battleReducer, createBattle } from "@/lib/battle/engine";
import type { Fighter } from "@/lib/battle/types";

/** How long the arena holds on a resolved answer before moving on. */
const HOLD_CORRECT_MS = 1500;
/** Longer on a miss — the explanation has to be readable. */
const HOLD_WRONG_MS = 3200;

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
  // Tagged with the question it was measured for, so a new question renders a
  // full bar immediately instead of showing the previous question's leftover
  // for one frame. Only the rAF callback writes it.
  const [clock, setClock] = useState({ q: 0, remainingMs: QUESTION_MS });
  const remainingMs = clock.q === state.questionIndex ? clock.remainingMs : QUESTION_MS;

  const deadlineRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  // Mirrored into a ref so the rAF tick and the keydown handler can read the
  // live phase without being torn down and rebuilt on every state change.
  const phaseRef = useRef(state.phase);
  useEffect(() => {
    phaseRef.current = state.phase;
  }, [state.phase]);

  /* ── Question clock ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (state.phase !== "question") return;

    const q = state.questionIndex;
    deadlineRef.current = performance.now() + QUESTION_MS;

    const tick = () => {
      const left = deadlineRef.current - performance.now();
      if (left <= 0) {
        setClock({ q, remainingMs: 0 });
        // Running out of time is a wrong answer: the boss gets its opening.
        if (phaseRef.current === "question") dispatch({ type: "TIMEOUT" });
        return;
      }
      setClock({ q, remainingMs: left });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [state.phase, state.questionIndex]);

  /* ── Pacing: hold on the resolution, then advance ─────────────────────── */
  useEffect(() => {
    if (state.phase !== "resolving") return;
    const correct = state.lastResult?.target === "boss";
    const hold = correct ? HOLD_CORRECT_MS : HOLD_WRONG_MS;
    const t = setTimeout(() => dispatch({ type: "ADVANCE" }), hold);
    return () => clearTimeout(t);
  }, [state.phase, state.lastResult]);

  const handlePick = useCallback(
    (index: number) => {
      if (phaseRef.current !== "question") return;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
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
    <div className="min-h-screen" style={{ background: "var(--surface-0)" }}>
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-3 py-4 sm:gap-4 sm:px-4 sm:py-6">
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
        />

        <QuestionPanel
          question={question}
          remainingMs={remainingMs}
          pickedIndex={state.lastPickedIndex}
          revealed={revealed}
          correctIndex={revealed ? question.correctIndex : null}
          onPick={handlePick}
        />

        <p className="gp-pixel text-center text-[8px] text-[var(--text-3)]">
          PRESS A–D OR 1–4 TO STRIKE · FASTER ANSWERS HIT HARDER
        </p>
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
