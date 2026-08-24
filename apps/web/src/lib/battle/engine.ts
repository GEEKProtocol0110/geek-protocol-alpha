/**
 * Battle state machine.
 *
 * A reducer rather than scattered setState calls, so the whole loop
 * (answer -> attack -> damage -> reward -> next) is one auditable transition.
 */

import {
  SPECIAL_THRESHOLD,
  answerRewards,
  playerMaxHp,
  resolveAnswer,
  specialChargeGain,
  victoryBonus,
} from "./combat";
import { getQuestions } from "./questions";
import { getBoss } from "./roster";
import type { BattleMode, BattleState, Fighter, Question } from "./types";

export type BattleEvent =
  | { type: "BEGIN" }
  | { type: "ANSWER"; index: number; remainingMs: number; rng?: () => number }
  /**
   * Correctness supplied by the server rather than derived from the question.
   * The daily quiz never ships the answer key to the browser, so this is the
   * only way that flow can resolve an attack.
   */
  | { type: "RESOLVE"; correct: boolean; index: number | null; remainingMs: number; rng?: () => number }
  | { type: "TIMEOUT"; rng?: () => number }
  | { type: "ADVANCE" };

export interface BattleOptions {
  mode?: BattleMode;
  /** Overrides the local bank — used to drive the battle from real quiz data. */
  questions?: Question[];
  /** Overrides the ladder boss, so a mode can size its own encounter. */
  boss?: BattleState["boss"];
}

export function createBattle(
  fighter: Fighter,
  level: number,
  options: BattleOptions = {}
): BattleState {
  const boss = options.boss ?? getBoss(level);
  const maxHp = playerMaxHp(fighter);
  return {
    mode: options.mode ?? "arcade",
    phase: "intro",
    fighter,
    boss,
    playerHp: maxHp,
    playerMaxHp: maxHp,
    bossHp: boss.maxHp,
    questionIndex: 0,
    questions: options.questions ?? getQuestions(level),
    combo: 0,
    bestCombo: 0,
    specialCharge: 0,
    specialReady: false,
    xp: 0,
    skillPoints: 0,
    coins: 0,
    answers: [],
    lastResult: null,
    lastPickedIndex: null,
  };
}

/**
 * Resolve one answer into a battle action and fold it into state.
 * `correct === false` covers both a wrong pick and a timeout.
 */
function applyAnswer(
  state: BattleState,
  correct: boolean,
  remainingMs: number,
  pickedIndex: number | null,
  rng?: () => number
): BattleState {
  const question = state.questions[state.questionIndex];

  const result = resolveAnswer({
    correct,
    remainingMs,
    fighter: state.fighter,
    boss: state.boss,
    combo: state.combo,
    specialReady: state.specialReady,
    rng,
  });

  const rewards = answerRewards(result, state.combo);

  const bossHp = result.target === "boss" ? Math.max(0, state.bossHp - result.damage) : state.bossHp;
  const playerHp =
    result.target === "player" ? Math.max(0, state.playerHp - result.damage) : state.playerHp;

  const combo = correct ? state.combo + 1 : 0;
  // A consumed special resets the meter; otherwise a correct answer charges it,
  // faster when the answer was fast.
  const specialCharge = result.special
    ? 0
    : correct
      ? state.specialCharge + specialChargeGain(result.tier)
      : 0;

  const next: BattleState = {
    ...state,
    phase: "resolving",
    bossHp,
    playerHp,
    combo,
    bestCombo: Math.max(state.bestCombo, combo),
    specialCharge,
    specialReady: specialCharge >= SPECIAL_THRESHOLD,
    xp: state.xp + rewards.xp,
    skillPoints: state.skillPoints + rewards.skillPoints,
    coins: state.coins + rewards.coins,
    lastResult: result,
    lastPickedIndex: pickedIndex,
    answers: [
      ...state.answers,
      {
        questionId: question.id,
        correct,
        elapsedMs: result.elapsedMs,
        tier: result.tier,
        damage: result.damage,
      },
    ],
  };

  return next;
}

/** Decide what comes after a resolved answer: win, loss, or next question. */
function advance(state: BattleState): BattleState {
  const nextIndex = state.questionIndex + 1;
  const bankExhausted = nextIndex >= state.questions.length;

  // Endurance runs never stop early — the attempt has to reach the last
  // question for the server to score it, so a KO is cosmetic until then.
  if (state.mode === "endurance") {
    if (!bankExhausted) {
      return {
        ...state,
        phase: "question",
        questionIndex: nextIndex,
        lastResult: null,
        lastPickedIndex: null,
      };
    }
    if (state.bossHp <= 0) {
      const bonus = victoryBonus(state.boss, state.bestCombo);
      return {
        ...state,
        phase: "victory",
        xp: state.xp + bonus.xp,
        skillPoints: state.skillPoints + bonus.skillPoints,
        coins: state.coins + bonus.coins,
      };
    }
    return { ...state, phase: "defeat" };
  }

  if (state.bossHp <= 0) {
    const bonus = victoryBonus(state.boss, state.bestCombo);
    return {
      ...state,
      phase: "victory",
      xp: state.xp + bonus.xp,
      skillPoints: state.skillPoints + bonus.skillPoints,
      coins: state.coins + bonus.coins,
    };
  }
  if (state.playerHp <= 0) {
    return { ...state, phase: "defeat" };
  }
  if (bankExhausted) {
    // Ran out of questions with the boss still standing — that is a loss on
    // points. The boss surviving the full bank is the fail condition.
    return { ...state, phase: state.bossHp <= 0 ? "victory" : "defeat" };
  }
  return {
    ...state,
    phase: "question",
    questionIndex: nextIndex,
    lastResult: null,
    lastPickedIndex: null,
  };
}

export function battleReducer(state: BattleState, event: BattleEvent): BattleState {
  switch (event.type) {
    case "BEGIN":
      return { ...state, phase: "question" };

    case "ANSWER": {
      if (state.phase !== "question") return state;
      const question = state.questions[state.questionIndex];
      const correct = event.index === question.correctIndex;
      return applyAnswer(state, correct, event.remainingMs, event.index, event.rng);
    }

    case "RESOLVE": {
      if (state.phase !== "question") return state;
      return applyAnswer(state, event.correct, event.remainingMs, event.index, event.rng);
    }

    case "TIMEOUT": {
      if (state.phase !== "question") return state;
      return applyAnswer(state, false, 0, null, event.rng);
    }

    case "ADVANCE": {
      if (state.phase !== "resolving") return state;
      return advance(state);
    }

    default:
      return state;
  }
}

/** End-of-battle summary, used by both the victory and defeat screens. */
export function battleSummary(state: BattleState) {
  const answered = state.answers.length;
  const correct = state.answers.filter((a) => a.correct).length;
  const times = state.answers.filter((a) => a.correct).map((a) => a.elapsedMs);
  return {
    answered,
    correct,
    total: state.questions.length,
    accuracy: answered ? Math.round((correct / answered) * 100) : 0,
    fastestMs: times.length ? Math.min(...times) : null,
    bestCombo: state.bestCombo,
    xp: state.xp,
    skillPoints: state.skillPoints,
    coins: state.coins,
  };
}
