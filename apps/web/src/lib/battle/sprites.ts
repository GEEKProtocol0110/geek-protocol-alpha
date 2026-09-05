/**
 * Sprite selection.
 *
 * Each drawn pose is the *moment of impact*, not a wind-up, so a pose is
 * chosen after the answer has already been resolved and shown for the length
 * of the hit reaction. This module is the single place that decides which
 * frame a given battle action deserves — keeping it pure means the art can be
 * re-cast without touching the arena or the engine.
 */

import type { AttackResult } from "./types";

const GIGA = "/game/giga";
const WRAITH = "/game/wraith";

/** Tight crops for menus and cards, where the wide action frame would pad the
 *  character with empty space and squeeze the copy beside it. */
export const PORTRAITS = {
  giga: "/game/giga-portrait.webp",
  wraith: "/game/wraith-portrait.webp",
} as const;

export const GIGA_POSES = {
  idle: `${GIGA}/giga-idle-guard-up.webp`,
  punch: `${GIGA}/giga-attack-01-iron-knuckle.webp`,
  beam: `${GIGA}/giga-attack-02-brain-beam.webp`,
  kick: `${GIGA}/giga-attack-03-skybreaker-kick.webp`,
  special: `${GIGA}/giga-attack-04-golden-surge.webp`,
  finisher: `${GIGA}/giga-attack-05-knowledge-crash-finisher.webp`,
  hitLight: `${GIGA}/giga-hit-01-shrug-off.webp`,
  hitStagger: `${GIGA}/giga-hit-02-off-balance.webp`,
  hitKnockback: `${GIGA}/giga-hit-03-circuit-shock.webp`,
  hitOverwhelmed: `${GIGA}/giga-hit-04-static-break.webp`,
  knockdown: `${GIGA}/giga-hit-05-last-spark-knockdown.webp`,
} as const;

export const WRAITH_POSES = {
  idle: `${WRAITH}/wraith-idle-loading-threat.webp`,
  claw: `${WRAITH}/wraith-attack-01-coin-rake.webp`,
  slam: `${WRAITH}/wraith-attack-02-rocket-crash.webp`,
  charge: `${WRAITH}/wraith-attack-03-pump-rush.webp`,
  summon: `${WRAITH}/wraith-attack-04-fomo-swarm.webp`,
  finisher: `${WRAITH}/wraith-attack-05-moonshot-slam-finisher.webp`,
  hitLight: `${WRAITH}/wraith-hit-01-static-flinch.webp`,
  hitStagger: `${WRAITH}/wraith-hit-02-signal-loss.webp`,
  hitCrack: `${WRAITH}/wraith-hit-03-crack-in-the-hype.webp`,
  hitCore: `${WRAITH}/wraith-hit-04-corrupted-core.webp`,
  defeat: `${WRAITH}/wraith-hit-05-hype-collapse-finisher.webp`,
} as const;

/** Every frame, for preloading — a sprite that pops in late kills the impact. */
export const ALL_SPRITES: string[] = [
  ...Object.values(GIGA_POSES),
  ...Object.values(WRAITH_POSES),
];

export interface PosePair {
  player: string;
  boss: string;
  /** True when the pose depicts the character leaving the ground. */
  playerAirborne: boolean;
  bossAirborne: boolean;
}

export const IDLE_PAIR: PosePair = {
  player: GIGA_POSES.idle,
  boss: WRAITH_POSES.idle,
  playerAirborne: false,
  bossAirborne: false,
};

interface SelectInput {
  result: AttackResult | null;
  playerDown: boolean;
  bossDown: boolean;
  /** Used to judge how hard an incoming hit was, relative to the health pool. */
  playerMaxHp: number;
  bossMaxHp: number;
}

/**
 * Pick the frame pair for a resolved answer.
 *
 * Attacking and being attacked are two halves of one exchange, so both
 * characters change pose together: whoever swung shows the strike, whoever ate
 * it shows the matching reaction weighted by how much damage landed.
 */
export function selectPoses({
  result,
  playerDown,
  bossDown,
  playerMaxHp,
  bossMaxHp,
}: SelectInput): PosePair {
  if (!result) {
    // Down characters stay down between questions rather than snapping back to
    // a confident idle, which would read as if nothing had happened.
    return {
      player: playerDown ? GIGA_POSES.knockdown : GIGA_POSES.idle,
      boss: bossDown ? WRAITH_POSES.defeat : WRAITH_POSES.idle,
      playerAirborne: false,
      bossAirborne: false,
    };
  }

  if (result.target === "boss") {
    // Giga is swinging.
    const share = result.damage / Math.max(1, bossMaxHp);
    const player = bossDown
      ? GIGA_POSES.finisher
      : result.special
        ? GIGA_POSES.special
        : result.crit
          ? GIGA_POSES.kick
          : result.tier === "critical"
            ? GIGA_POSES.beam
            : GIGA_POSES.punch;

    const boss = bossDown
      ? WRAITH_POSES.defeat
      : result.special || result.crit
        ? WRAITH_POSES.hitCore
        : share > 0.14
          ? WRAITH_POSES.hitCrack
          : share > 0.08
            ? WRAITH_POSES.hitStagger
            : WRAITH_POSES.hitLight;

    return {
      player,
      boss,
      playerAirborne: player === GIGA_POSES.kick,
      bossAirborne: false,
    };
  }

  // The Wraith is swinging.
  const share = result.damage / Math.max(1, playerMaxHp);
  const boss = playerDown
    ? WRAITH_POSES.finisher
    : share > 0.2
      ? WRAITH_POSES.slam
      : share > 0.14
        ? WRAITH_POSES.charge
        : share > 0.09
          ? WRAITH_POSES.summon
          : WRAITH_POSES.claw;

  const player = playerDown
    ? GIGA_POSES.knockdown
    : share > 0.2
      ? GIGA_POSES.hitOverwhelmed
      : share > 0.14
        ? GIGA_POSES.hitKnockback
        : share > 0.09
          ? GIGA_POSES.hitStagger
          : GIGA_POSES.hitLight;

  return {
    player,
    boss,
    playerAirborne: player === GIGA_POSES.hitKnockback,
    bossAirborne: false,
  };
}
