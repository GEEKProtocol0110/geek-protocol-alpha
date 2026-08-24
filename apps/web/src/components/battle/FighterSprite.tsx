"use client";

/**
 * Flat vector fighters.
 *
 * Built from hard-edged geometry with a single bevel shade per fill — the same
 * construction rule as the rest of the brand (no gradients, no blur). Each
 * fighter gets a genuinely different silhouette so they read apart at a glance
 * even at mobile scale.
 */

import type { FighterId } from "@/lib/battle/types";

interface Props {
  id: FighterId;
  color: string;
  colorDark: string;
  /** Fighters face right, bosses face left. */
  flip?: boolean;
  className?: string;
}

const INK = "var(--ink)";

function Giga({ c, d }: { c: string; d: string }) {
  return (
    <>
      {/* legs */}
      <path d="M40 108 L52 108 L50 148 L36 148 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M62 108 L76 108 L82 148 L66 148 Z" fill={c} stroke={INK} strokeWidth="3" />
      {/* torso */}
      <path d="M36 52 L80 52 L74 110 L42 110 Z" fill={c} stroke={INK} strokeWidth="3" />
      <path d="M58 52 L80 52 L74 110 L58 110 Z" fill={d} stroke={INK} strokeWidth="3" />
      {/* chest core */}
      <path d="M50 66 L66 66 L62 82 L54 82 Z" fill="var(--gp-white)" stroke={INK} strokeWidth="3" />
      {/* shoulders */}
      <path d="M26 50 L48 44 L50 66 L28 70 Z" fill={c} stroke={INK} strokeWidth="3" />
      <path d="M68 44 L92 50 L90 70 L66 66 Z" fill={d} stroke={INK} strokeWidth="3" />
      {/* gauntlet arm */}
      <path d="M88 56 L104 62 L112 92 L96 96 Z" fill={c} stroke={INK} strokeWidth="3" />
      <path d="M94 92 L118 88 L122 104 L98 108 Z" fill="var(--gp-white)" stroke={INK} strokeWidth="3" />
      {/* head */}
      <path d="M46 20 L72 20 L76 44 L42 44 Z" fill={c} stroke={INK} strokeWidth="3" />
      <path d="M48 28 L70 28 L70 36 L48 36 Z" fill={INK} />
      <path d="M52 30 L66 30 L66 34 L52 34 Z" fill="var(--gp-white)" />
      {/* crest */}
      <path d="M56 6 L62 6 L66 20 L52 20 Z" fill={d} stroke={INK} strokeWidth="3" />
    </>
  );
}

function Nova({ c, d }: { c: string; d: string }) {
  return (
    <>
      <path d="M44 110 L56 110 L48 150 L36 150 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M64 110 L76 110 L84 150 L70 150 Z" fill={c} stroke={INK} strokeWidth="3" />
      {/* slim torso */}
      <path d="M44 54 L76 54 L72 112 L48 112 Z" fill={c} stroke={INK} strokeWidth="3" />
      <path d="M62 54 L76 54 L72 112 L62 112 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M54 68 L68 74 L58 88 Z" fill="var(--gp-white)" stroke={INK} strokeWidth="3" />
      {/* swept fins */}
      <path d="M44 56 L18 34 L26 62 L44 74 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M76 56 L104 34 L96 62 L76 74 Z" fill={c} stroke={INK} strokeWidth="3" />
      {/* blade arm */}
      <path d="M76 62 L94 68 L126 60 L128 72 L92 88 L74 84 Z" fill="var(--gp-white)" stroke={INK} strokeWidth="3" />
      {/* head */}
      <path d="M50 22 L70 22 L74 46 L46 46 Z" fill={c} stroke={INK} strokeWidth="3" />
      <path d="M52 30 L72 34 L70 40 L52 38 Z" fill={INK} />
      <path d="M60 4 L66 4 L72 22 L54 22 Z" fill={d} stroke={INK} strokeWidth="3" />
    </>
  );
}

function TitanX({ c, d }: { c: string; d: string }) {
  return (
    <>
      {/* heavy legs */}
      <path d="M34 104 L56 104 L54 150 L30 150 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M64 104 L88 104 L92 150 L66 150 Z" fill={c} stroke={INK} strokeWidth="3" />
      {/* bulk torso */}
      <path d="M32 50 L88 50 L82 108 L38 108 Z" fill={c} stroke={INK} strokeWidth="3" />
      <path d="M60 50 L88 50 L82 108 L60 108 Z" fill={d} stroke={INK} strokeWidth="3" />
      {/* reactor */}
      <path d="M48 64 L72 64 L72 86 L48 86 Z" fill={INK} stroke={INK} strokeWidth="3" />
      <path d="M54 70 L66 70 L66 80 L54 80 Z" fill="var(--gp-white)" />
      {/* massive pauldrons */}
      <path d="M12 40 L46 32 L48 66 L14 72 Z" fill={c} stroke={INK} strokeWidth="3" />
      <path d="M74 32 L108 40 L106 72 L72 66 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M18 46 L38 42 L38 56 L18 60 Z" fill={INK} />
      {/* cannon */}
      <path d="M100 50 L130 46 L134 74 L102 72 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M128 54 L142 54 L142 68 L128 68 Z" fill="var(--gp-white)" stroke={INK} strokeWidth="3" />
      {/* squat head */}
      <path d="M50 22 L72 22 L74 42 L48 42 Z" fill={c} stroke={INK} strokeWidth="3" />
      <path d="M52 28 L70 28 L70 36 L52 36 Z" fill={INK} />
      <path d="M55 30 L67 30 L67 34 L55 34 Z" fill="var(--gp-white)" />
    </>
  );
}

function Vex({ c, d }: { c: string; d: string }) {
  return (
    <>
      <path d="M46 108 L58 108 L46 150 L34 150 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M66 108 L78 108 L88 150 L72 150 Z" fill={c} stroke={INK} strokeWidth="3" />
      {/* angular torso */}
      <path d="M46 52 L78 58 L70 110 L50 110 Z" fill={c} stroke={INK} strokeWidth="3" />
      <path d="M64 55 L78 58 L70 110 L62 110 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M54 70 L68 76 L56 92 Z" fill={INK} />
      {/* asymmetric shoulder */}
      <path d="M30 44 L52 40 L50 66 L32 68 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M74 40 L98 52 L88 74 L70 62 Z" fill={c} stroke={INK} strokeWidth="3" />
      {/* twin blades */}
      <path d="M90 56 L134 30 L138 42 L98 70 Z" fill="var(--gp-white)" stroke={INK} strokeWidth="3" />
      <path d="M88 70 L130 78 L128 90 L86 82 Z" fill={d} stroke={INK} strokeWidth="3" />
      {/* hooded head */}
      <path d="M48 20 L72 24 L74 46 L44 44 Z" fill={c} stroke={INK} strokeWidth="3" />
      <path d="M50 30 L72 34 L70 40 L50 38 Z" fill={INK} />
      <path d="M54 32 L62 33 L62 37 L54 36 Z" fill="var(--gp-danger)" />
      <path d="M44 20 L58 2 L72 24 Z" fill={d} stroke={INK} strokeWidth="3" />
    </>
  );
}

const SHAPES: Record<FighterId, (p: { c: string; d: string }) => React.ReactElement> = {
  giga: Giga,
  nova: Nova,
  "titan-x": TitanX,
  vex: Vex,
};

export default function FighterSprite({ id, color, colorDark, flip, className }: Props) {
  const Shape = SHAPES[id] ?? Giga;
  return (
    <svg
      viewBox="0 0 150 156"
      className={className}
      style={{ transform: flip ? "scaleX(-1)" : undefined, overflow: "visible" }}
      role="img"
      aria-label={`${id} fighter`}
    >
      <Shape c={color} d={colorDark} />
    </svg>
  );
}
