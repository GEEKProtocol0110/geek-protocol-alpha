/**
 * The playable roster and the boss ladder.
 *
 * Stats are deliberately narrow in range. Per the product principle, knowledge
 * has to stay the dominant term in the damage formula — a fighter choice
 * should feel like a playstyle, never like a difficulty setting.
 */

import type { Boss, Fighter } from "./types";

export const FIGHTERS: Fighter[] = [
  {
    id: "giga",
    name: "GIGA",
    title: "The Balanced Vanguard",
    description:
      "Protocol-forged all-rounder. No weakness to exploit, no gimmick to learn. Giga rewards consistent, steady knowledge.",
    rarity: "epic",
    stats: { attack: 80, defense: 75, speed: 80, critical: 10 },
    color: "var(--gp-cyan)",
    colorDark: "var(--gp-cyan-dark)",
    specialName: "OMEGA LANCE",
    unlocked: true,
  },
  {
    id: "nova",
    name: "NOVA",
    title: "The Lightstep Duelist",
    description:
      "Built for players who answer on instinct. Wide speed windows make heavy hits easy to reach, but Nova folds under a counterattack.",
    rarity: "rare",
    stats: { attack: 72, defense: 60, speed: 95, critical: 22 },
    color: "var(--gp-pink)",
    colorDark: "var(--gp-pink-dark)",
    specialName: "STARFALL RUSH",
    unlocked: false,
  },
  {
    id: "titan-x",
    name: "TITAN-X",
    title: "The Siege Frame",
    description:
      "Enormous damage and armour, glacial timing. Titan-X forgives a slow answer but punishes a wrong one less than anyone else.",
    rarity: "legendary",
    stats: { attack: 95, defense: 95, speed: 45, critical: 5 },
    color: "var(--gp-violet)",
    colorDark: "var(--gp-violet-dark)",
    specialName: "GRAVITY BREAKER",
    unlocked: false,
  },
  {
    id: "vex",
    name: "VEX",
    title: "The Edge Case",
    description:
      "A glass cannon that lives on critical hits. Vex turns a hot streak into a rout — and a single lapse into a disaster.",
    rarity: "epic",
    stats: { attack: 85, defense: 55, speed: 85, critical: 25 },
    color: "var(--gp-gold)",
    colorDark: "var(--gp-gold-dark)",
    specialName: "PHANTOM SPLIT",
    unlocked: false,
  },
];

export function getFighter(id: string): Fighter {
  return FIGHTERS.find((f) => f.id === id) ?? FIGHTERS[0];
}

/** The level ladder. Later bosses hit harder and carry more HP. */
export const BOSSES: Boss[] = [
  {
    id: "training-drone",
    name: "HYPE WRAITH",
    level: 1,
    maxHp: 155,
    attack: 13,
    color: "var(--gp-slate)",
    colorDark: "#5C616D",
    taunt: "Another curious mind. They all buy the story eventually.",
  },
  {
    id: "void-raider",
    name: "PUMP WRAITH",
    level: 2,
    maxHp: 195,
    attack: 17,
    color: "var(--gp-success)",
    colorDark: "var(--gp-success-dark)",
    taunt: "Number goes up. That is the whole argument. Try to beat it.",
  },
  {
    id: "nebula-hunter",
    name: "MOONSHOT WRAITH",
    level: 3,
    maxHp: 235,
    attack: 21,
    color: "var(--gp-violet)",
    colorDark: "var(--gp-violet-dark)",
    taunt: "Everyone who reached this far was certain too. Certainty is cheap.",
  },
  {
    id: "titan-commander",
    name: "FOMO WRAITH",
    level: 4,
    maxHp: 285,
    attack: 25,
    color: "var(--gp-pink)",
    colorDark: "var(--gp-pink-dark)",
    taunt: "You are already late. Answer fast, before you miss it.",
  },
  {
    id: "void-king",
    name: "THE GREAT HYPE",
    level: 5,
    maxHp: 340,
    attack: 29,
    color: "var(--gp-danger)",
    colorDark: "var(--gp-danger-dark)",
    taunt: "I am every promise you were ever sold. Ten answers. Prove me hollow.",
  },
];

export function getBoss(level: number): Boss {
  return BOSSES[Math.min(Math.max(level, 1), BOSSES.length) - 1];
}

/**
 * The Daily Quiz encounter.
 *
 * Sized so that ten answers is roughly exactly lethal: a strong player lands
 * the kill on the last question or two, which is where the tension is. Rotates
 * by UTC date so everyone faces the same boss on the same day, and so the
 * fight does not look identical every morning.
 */
const DAILY_ROTATION: Array<Pick<Boss, "id" | "name" | "color" | "colorDark" | "taunt">> = [
  {
    id: "void-raider",
    name: "PUMP WRAITH",
    color: "var(--gp-success)",
    colorDark: "var(--gp-success-dark)",
    taunt: "Another mind wanders into the lane. Convenient.",
  },
  {
    id: "nebula-hunter",
    name: "MOONSHOT WRAITH",
    color: "var(--gp-violet)",
    colorDark: "var(--gp-violet-dark)",
    taunt: "Everyone who reached this far was certain too. Certainty is cheap.",
  },
  {
    id: "titan-commander",
    name: "FOMO WRAITH",
    color: "var(--gp-pink)",
    colorDark: "var(--gp-pink-dark)",
    taunt: "You are already late. Answer fast, before you miss it.",
  },
  {
    id: "void-king",
    name: "THE GREAT HYPE",
    color: "var(--gp-danger)",
    colorDark: "var(--gp-danger-dark)",
    taunt: "Ten questions. That is all that stands between you and nothing.",
  },
];

/**
 * The Gauntlet ladder.
 *
 * Ten rounds against five escalating Wraith forms — two rounds per form — with
 * health and damage interpolated across the run so round 10 is a genuine wall
 * and round 1 is still winnable by someone learning the format.
 */
export function getGauntletBoss(round: number): Boss {
  const r = Math.min(10, Math.max(1, Math.round(round)));
  const form = BOSSES[Math.min(BOSSES.length - 1, Math.ceil(r / 2) - 1)];
  const t = (r - 1) / 9;
  return {
    ...form,
    level: r,
    maxHp: Math.round(150 + t * 210),
    attack: Math.round(13 + t * 17),
  };
}

export function getDailyBoss(date: Date = new Date()): Boss {
  const dayIndex = Math.floor(Date.UTC(
    date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()
  ) / 86_400_000);
  const pick = DAILY_ROTATION[dayIndex % DAILY_ROTATION.length];
  return { ...pick, level: 4, maxHp: 285, attack: 25 };
}
