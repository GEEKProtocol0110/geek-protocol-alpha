/**
 * Damage resolution.
 *
 * Correctness is a gate, not a scalar: a wrong answer never damages the boss,
 * no matter how fast it was. Speed, stats and combo only scale a hit that has
 * already been earned by knowing the answer.
 */

import type { AttackResult, Fighter, Boss, HitTier } from "./types";

/** How long the player has to answer, before speed bonuses. */
export const QUESTION_MS = 15_000;

/** Charge needed to arm the special. See `specialChargeGain`. */
export const SPECIAL_THRESHOLD = 4;

/** The combo stops scaling here, so a long run cannot trivialise a boss. */
export const COMBO_CAP = 8;

const CRIT_MULTIPLIER = 1.75;
const SPECIAL_MULTIPLIER = 2.5;

/** Base damage per tier, before any scaling. */
const TIER_BASE: Record<Exclude<HitTier, "miss">, number> = {
  critical: 26,
  heavy: 21,
  standard: 17,
  light: 13,
};

const TIER_LABEL: Record<HitTier, string> = {
  critical: "PERFECT HIT",
  heavy: "HEAVY HIT",
  standard: "CLEAN HIT",
  light: "GLANCING HIT",
  miss: "MISS",
};

/**
 * Speed tier from how much of the clock is left.
 *
 * A fast fighter widens every window: at speed 95 the thresholds slide down by
 * ~10%, so Nova reaches PERFECT on an answer that would only be HEAVY for
 * Titan-X. This is the one place fighter choice changes the feel of the timer.
 */
export function speedTier(remainingMs: number, speedStat: number): Exclude<HitTier, "miss"> {
  const ratio = Math.max(0, Math.min(1, remainingMs / QUESTION_MS));
  // speed 75 is neutral; every point above widens the windows slightly.
  const ease = (speedStat - 75) / 500; // ±0.04 across the roster
  if (ratio >= 0.75 - ease) return "critical";
  if (ratio >= 0.5 - ease) return "heavy";
  if (ratio >= 0.25 - ease) return "standard";
  return "light";
}

/**
 * Charge earned by one correct answer.
 *
 * Fast answers charge twice as fast. Counting hits alone made the special
 * unreachable on early levels — a boss with 86 HP dies before a five-hit
 * streak exists — so the meter tracks quality, not just quantity. It also
 * keeps the headline move tied to the thing the game is actually about.
 */
export function specialChargeGain(tier: HitTier): number {
  return tier === "critical" ? 2 : 1;
}

/** Combo multiplier, capped so streaks feel great without breaking balance. */
export function comboMultiplier(combo: number): number {
  return 1 + Math.min(combo, COMBO_CAP) * 0.08;
}

export interface ResolveInput {
  correct: boolean;
  remainingMs: number;
  fighter: Fighter;
  boss: Boss;
  combo: number;
  specialReady: boolean;
  /** Injectable for tests; defaults to Math.random. */
  rng?: () => number;
}

/**
 * Turn one answer into one battle action.
 *
 * This is the only function permitted to produce an `AttackResult`. Keeping it
 * pure is what makes the loop tunable and testable without touching the UI.
 */
export function resolveAnswer(input: ResolveInput): AttackResult {
  const { correct, remainingMs, fighter, boss, combo, specialReady } = input;
  const rng = input.rng ?? Math.random;
  const elapsedMs = Math.max(0, QUESTION_MS - remainingMs);

  if (!correct) {
    // The boss counterattacks. Defense scales the hit down but never to zero,
    // so even Titan-X cannot ignore a wrong answer.
    const mitigation = 1 - fighter.stats.defense / 200;
    const damage = Math.max(4, Math.round(boss.attack * mitigation));
    return {
      tier: "miss",
      damage,
      crit: false,
      special: false,
      target: "player",
      label: TIER_LABEL.miss,
      elapsedMs,
    };
  }

  const tier = speedTier(remainingMs, fighter.stats.speed);
  const attackScale = fighter.stats.attack / 75;
  let damage = TIER_BASE[tier] * attackScale * comboMultiplier(combo);

  // Faster answers also improve the crit roll — rewarding decisive recall.
  const tierCritBonus = tier === "critical" ? 15 : tier === "heavy" ? 5 : 0;
  const crit = rng() * 100 < fighter.stats.critical + tierCritBonus;
  if (crit) damage *= CRIT_MULTIPLIER;

  const special = specialReady;
  if (special) damage *= SPECIAL_MULTIPLIER;

  return {
    tier,
    damage: Math.max(1, Math.round(damage)),
    crit,
    special,
    target: "boss",
    label: special ? fighter.specialName : crit ? "CRITICAL — " + TIER_LABEL[tier] : TIER_LABEL[tier],
    elapsedMs,
  };
}

/** Player max HP, nudged by the defense stat so the roster feels different. */
export function playerMaxHp(fighter: Fighter): number {
  return Math.round(80 + fighter.stats.defense * 0.4);
}

export interface Rewards {
  xp: number;
  skillPoints: number;
  coins: number;
}

/** Per-answer rewards. Only a landed hit pays out. */
export function answerRewards(result: AttackResult, combo: number): Rewards {
  if (result.target === "player") return { xp: 5, skillPoints: 0, coins: 0 };
  const tierXp: Record<Exclude<HitTier, "miss">, number> = {
    critical: 80,
    heavy: 60,
    standard: 45,
    light: 30,
  };
  const base = tierXp[result.tier as Exclude<HitTier, "miss">];
  const mult = comboMultiplier(combo);
  return {
    xp: Math.round(base * mult),
    skillPoints: Math.round(8 * mult) + (result.crit ? 5 : 0),
    coins: Math.round(6 * mult),
  };
}

/** Bonus paid once, on a win. */
export function victoryBonus(boss: Boss, bestCombo: number): Rewards {
  return {
    xp: 200 + boss.level * 120,
    skillPoints: 40 + bestCombo * 6,
    coins: 30 + boss.level * 18,
  };
}
