/**
 * Space Fighter Quiz — core types.
 *
 * The design rule this file exists to protect: the player never controls the
 * fighter directly. A `Question` is the controller, an `Answer` is the input,
 * and a `BattleAction` is the resulting move. Nothing in the UI may produce a
 * BattleAction except by resolving an answer through `combat.ts`.
 */

export type FighterId = "giga" | "nova" | "titan-x" | "vex";

export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface FighterStats {
  /** Scales outgoing damage. 75 is the balance baseline. */
  attack: number;
  /** Reduces incoming damage. 75 is the balance baseline. */
  defense: number;
  /** Widens the speed windows, so fast tiers are easier to reach. */
  speed: number;
  /** Percentage chance to roll a critical multiplier on a landed hit. */
  critical: number;
}

export interface Fighter {
  id: FighterId;
  name: string;
  title: string;
  description: string;
  rarity: Rarity;
  stats: FighterStats;
  /** Brand token used as the fighter's primary flat fill. */
  color: string;
  /** Darker bevel token, used for the hard offset shadow and extrusion. */
  colorDark: string;
  /** Name of the fighter's special attack, shown when the meter fills. */
  specialName: string;
  unlocked: boolean;
}

export interface Boss {
  id: string;
  name: string;
  level: number;
  maxHp: number;
  /** Raw damage dealt on a failed answer, before player defense. */
  attack: number;
  color: string;
  colorDark: string;
  /** Flavour line shown on the level intro card. */
  taunt: string;
}

export interface Question {
  id: string;
  prompt: string;
  options: string[];
  /** Index into `options`. Never sent to the presentation layer pre-answer. */
  correctIndex: number;
  /** Shown after a wrong answer so a miss still teaches something. */
  explanation: string;
  category: string;
}

/**
 * How good the answer was, in battle terms. Correctness decides *whether* the
 * attack lands; the tier decides *how hard*.
 */
export type HitTier = "critical" | "heavy" | "standard" | "light" | "miss";

export interface AttackResult {
  tier: HitTier;
  damage: number;
  /** True when the critical-chance roll succeeded (distinct from the tier). */
  crit: boolean;
  /** True when this attack consumed a charged special. */
  special: boolean;
  /** Who is on the receiving end. */
  target: "boss" | "player";
  label: string;
  /** Seconds the player took, for the end-of-battle stats. */
  elapsedMs: number;
}

export type BattlePhase =
  | "intro"
  | "question"
  | "resolving"
  | "victory"
  | "defeat";

export interface AnswerRecord {
  questionId: string;
  correct: boolean;
  elapsedMs: number;
  tier: HitTier;
  damage: number;
}

/**
 * "arcade"    — the standalone prototype: the fight ends the moment either
 *               side drops, because nothing else depends on it.
 * "endurance" — the daily quiz: every question must be answered for the
 *               attempt to score, so a KO never cuts the run short. The battle
 *               outcome is settled once the bank is exhausted.
 */
export type BattleMode = "arcade" | "endurance";

export interface BattleState {
  mode: BattleMode;
  phase: BattlePhase;
  fighter: Fighter;
  boss: Boss;
  playerHp: number;
  playerMaxHp: number;
  bossHp: number;
  questionIndex: number;
  questions: Question[];
  combo: number;
  bestCombo: number;
  /** Charges toward the special attack; at SPECIAL_THRESHOLD it is ready. */
  specialCharge: number;
  specialReady: boolean;
  xp: number;
  skillPoints: number;
  coins: number;
  answers: AnswerRecord[];
  /** The most recent resolution, driving the arena animation. */
  lastResult: AttackResult | null;
  /** Index the player picked, so the panel can mark it. */
  lastPickedIndex: number | null;
}
