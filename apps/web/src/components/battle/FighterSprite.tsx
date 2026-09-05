"use client";

/**
 * The playable roster, drawn as cel-shaded vector robots.
 *
 * Volume comes from a tone ramp rather than gradients (which the brand bans):
 * every form is a base fill, a `dark` shadow shape on its lower-right, a
 * `light` shape on its upper-left, and a small hard `spec` highlight. One light
 * direction throughout — upper-left — plus a thin rim light down the shadow
 * edge so the figure separates from the dark arena behind it.
 *
 * GIGA is drawn to match the rendered mascot in `public/mascot-giga.png`:
 * navy shell, cyan brain dome under glass, white armour plates, pink trim.
 */

import type { FighterId } from "@/lib/battle/types";
import {
  GIGA_PALETTE,
  NOVA_PALETTE,
  TITAN_PALETTE,
  VEX_PALETTE,
  type SpritePalette,
} from "./spritePalettes";

interface Props {
  id: FighterId;
  /** Kept for API compatibility; shading comes from the palette below. */
  color?: string;
  colorDark?: string;
  flip?: boolean;
  className?: string;
}

const PALETTES: Record<FighterId, SpritePalette> = {
  giga: GIGA_PALETTE,
  nova: NOVA_PALETTE,
  "titan-x": TITAN_PALETTE,
  vex: VEX_PALETTE,
};

/* ── Shared parts ─────────────────────────────────────────────────────────── */

/** A shaded capsule limb: base, shadow half, lit edge, highlight. */
function Limb({
  x, y, w, h, r, p, flipShade = false,
}: { x: number; y: number; w: number; h: number; r: number; p: SpritePalette; flipShade?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={r} fill={p.base} stroke={p.outline} strokeWidth="3" />
      <rect
        x={flipShade ? x : x + w * 0.5}
        y={y + h * 0.12}
        width={w * 0.5}
        height={h * 0.88}
        rx={r}
        fill={p.dark}
        opacity="0.95"
      />
      <rect x={x + w * 0.16} y={y + h * 0.08} width={w * 0.26} height={h * 0.55} rx={r * 0.6} fill={p.light} opacity="0.9" />
      <rect x={x + w * 0.22} y={y + h * 0.12} width={w * 0.1} height={h * 0.3} rx={2} fill={p.spec} opacity="0.9" />
      <rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke={p.outline} strokeWidth="3" />
    </g>
  );
}

/** White armour plate with its own two-tone shading. */
function Plate({
  d, p, spec,
}: { d: string; p: SpritePalette; spec?: string }) {
  return (
    <>
      <path d={d} fill={p.plate} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
      {spec && <path d={spec} fill={p.plateSpec} opacity="0.95" />}
    </>
  );
}

/* ── GIGA ─────────────────────────────────────────────────────────────────── */

function Giga({ p }: { p: SpritePalette }) {
  return (
    <g>
      {/* back arm — behind the torso, darkened for depth */}
      <g opacity="0.75">
        <Limb x={44} y={110} w={26} h={62} r={13} p={p} flipShade />
      </g>

      {/* legs */}
      <Limb x={70} y={178} w={28} h={46} r={12} p={p} flipShade />
      <Limb x={104} y={178} w={28} h={46} r={12} p={p} />

      {/* boots */}
      <Plate
        d="M64 214 h40 a10 10 0 0 1 10 10 v8 a6 6 0 0 1 -6 6 h-48 a6 6 0 0 1 -6 -6 v-8 a10 10 0 0 1 10 -10 z"
        p={p}
        spec="M70 218 h22 v5 h-22 z"
      />
      <Plate
        d="M98 214 h40 a10 10 0 0 1 10 10 v8 a6 6 0 0 1 -6 6 h-48 a6 6 0 0 1 -6 -6 v-8 a10 10 0 0 1 10 -10 z"
        p={p}
        spec="M104 218 h22 v5 h-22 z"
      />

      {/* knee plates */}
      <Plate d="M72 196 h24 v12 h-24 z" p={p} spec="M75 198 h12 v4 h-12 z" />
      <Plate d="M106 196 h24 v12 h-24 z" p={p} spec="M109 198 h12 v4 h-12 z" />

      {/* torso */}
      <path
        d="M62 108 h76 a14 14 0 0 1 14 14 v48 a14 14 0 0 1 -14 14 h-76 a14 14 0 0 1 -14 -14 v-48 a14 14 0 0 1 14 -14 z"
        fill={p.base}
        stroke={p.outline}
        strokeWidth="3"
      />
      {/* torso shadow side */}
      <path d="M104 108 h34 a14 14 0 0 1 14 14 v48 a14 14 0 0 1 -14 14 h-34 z" fill={p.dark} />
      {/* torso lit side */}
      <path d="M62 108 h22 v34 h-36 v-20 a14 14 0 0 1 14 -14 z" fill={p.light} opacity="0.95" />
      <rect x={56} y={116} width={9} height={22} rx={4} fill={p.spec} opacity="0.85" />
      {/* rim light down the shadow edge */}
      <path d="M150 126 v40" stroke={p.spec} strokeWidth="3" strokeLinecap="round" opacity="0.65" />

      {/* chest emblem — pink hexagon with the code chevrons */}
      <path d="M100 126 l20 11 v22 l-20 11 l-20 -11 v-22 z" fill={p.deep} stroke={p.outline} strokeWidth="3" />
      <path d="M100 131 l15 8.5 v17 l-15 8.5 l-15 -8.5 v-17 z" fill={p.accent} />
      <path d="M93 143 l-5 5 l5 5" fill="none" stroke={p.deep} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M107 143 l5 5 l-5 5" fill="none" stroke={p.deep} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      {/* waist band */}
      <Plate d="M78 172 h44 v10 h-44 z" p={p} spec="M82 174 h16 v4 h-16 z" />

      {/* shoulder plates */}
      <Plate
        d="M40 106 a22 18 0 0 1 26 -6 v22 h-26 a6 6 0 0 1 -6 -6 z"
        p={p}
        spec="M44 106 a14 10 0 0 1 14 -4 v6 a12 8 0 0 0 -12 3 z"
      />
      <Plate
        d="M160 106 a22 18 0 0 0 -26 -6 v22 h26 a6 6 0 0 0 6 -6 z"
        p={p}
        spec="M152 104 h8 v6 h-8 z"
      />

      {/* front arm + gauntlet */}
      <Limb x={148} y={112} w={26} h={54} r={13} p={p} />
      <Plate d="M144 160 h34 a8 8 0 0 1 8 8 v10 a8 8 0 0 1 -8 8 h-34 a8 8 0 0 1 -8 -8 v-10 a8 8 0 0 1 8 -8 z" p={p} spec="M148 164 h14 v5 h-14 z" />
      <circle cx={161} cy={173} r={5} fill={p.glass} stroke={p.outline} strokeWidth="2" />

      {/* ear pods */}
      <rect x={40} y={58} width={16} height={30} rx={7} fill={p.dark} stroke={p.outline} strokeWidth="3" />
      <rect x={144} y={58} width={16} height={30} rx={7} fill={p.dark} stroke={p.outline} strokeWidth="3" />
      <rect x={43} y={62} width={5} height={14} rx={2} fill={p.spec} opacity="0.8" />

      {/* head shell */}
      <path
        d="M56 42 h88 a14 14 0 0 1 14 14 v36 a14 14 0 0 1 -14 14 h-88 a14 14 0 0 1 -14 -14 v-36 a14 14 0 0 1 14 -14 z"
        fill={p.base}
        stroke={p.outline}
        strokeWidth="3"
      />
      <path d="M104 42 h40 a14 14 0 0 1 14 14 v36 a14 14 0 0 1 -14 14 h-40 z" fill={p.dark} />
      <path d="M56 42 h24 v22 h-38 v-8 a14 14 0 0 1 14 -14 z" fill={p.light} opacity="0.95" />

      {/* glass dome + brain */}
      <path
        d="M64 44 a36 30 0 0 1 72 0 v14 h-72 z"
        fill={p.deep}
        stroke={p.outline}
        strokeWidth="3"
      />
      <path d="M68 46 a32 26 0 0 1 64 0 v10 h-64 z" fill={p.glass} opacity="0.5" />
      {/* brain lobes */}
      <g fill={p.glassLight} stroke={p.glass} strokeWidth="2">
        <circle cx={82} cy={40} r={9} />
        <circle cx={100} cy={34} r={10} />
        <circle cx={118} cy={40} r={9} />
        <circle cx={91} cy={50} r={8} />
        <circle cx={109} cy={50} r={8} />
      </g>
      {/* dome specular — a hard sliver, not a gradient */}
      <path d="M76 34 a28 22 0 0 1 20 -12 l-4 6 a22 18 0 0 0 -13 9 z" fill="#FFFFFF" opacity="0.75" />

      {/* eyes */}
      <ellipse cx={83} cy={82} rx={13} ry={14} fill={p.plate} stroke={p.outline} strokeWidth="3" />
      <ellipse cx={117} cy={82} rx={13} ry={14} fill={p.plate} stroke={p.outline} strokeWidth="3" />
      <ellipse cx={86} cy={84} rx={6} ry={7} fill={p.deep} />
      <ellipse cx={120} cy={84} rx={6} ry={7} fill={p.deep} />
      <circle cx={84} cy={80} r={2.4} fill="#FFFFFF" />
      <circle cx={118} cy={80} r={2.4} fill="#FFFFFF" />
      {/* determined brow */}
      <path d="M72 70 l16 6" stroke={p.outline} strokeWidth="4" strokeLinecap="round" />
      <path d="M128 70 l-16 6" stroke={p.outline} strokeWidth="4" strokeLinecap="round" />
      {/* mouth */}
      <path d="M94 98 h12 a4 4 0 0 1 -12 0 z" fill={p.accent} stroke={p.outline} strokeWidth="2" />

      {/* antennae */}
      <path d="M70 42 l-8 -22" stroke={p.outline} strokeWidth="6" strokeLinecap="round" />
      <path d="M130 42 l8 -22" stroke={p.outline} strokeWidth="6" strokeLinecap="round" />
      <circle cx={61} cy={16} r={9} fill={p.accent} stroke={p.outline} strokeWidth="3" />
      <circle cx={139} cy={16} r={9} fill={p.accent} stroke={p.outline} strokeWidth="3" />
      <circle cx={58} cy={13} r={3} fill="#FFFFFF" opacity="0.85" />
      <circle cx={136} cy={13} r={3} fill="#FFFFFF" opacity="0.85" />
    </g>
  );
}

/* ── NOVA — slim duelist, swept fins, energy blade ────────────────────────── */

function Nova({ p }: { p: SpritePalette }) {
  return (
    <g>
      <g opacity="0.75">
        <Limb x={52} y={114} w={22} h={58} r={11} p={p} flipShade />
      </g>

      <Limb x={76} y={176} w={24} h={50} r={11} p={p} flipShade />
      <Limb x={104} y={176} w={24} h={50} r={11} p={p} />
      <Plate d="M70 216 h34 a9 9 0 0 1 9 9 v7 a5 5 0 0 1 -5 5 h-42 a5 5 0 0 1 -5 -5 v-7 a9 9 0 0 1 9 -9 z" p={p} spec="M76 220 h18 v4 h-18 z" />
      <Plate d="M100 216 h34 a9 9 0 0 1 9 9 v7 a5 5 0 0 1 -5 5 h-42 a5 5 0 0 1 -5 -5 v-7 a9 9 0 0 1 9 -9 z" p={p} spec="M106 220 h18 v4 h-18 z" />

      {/* swept fins behind the shoulders */}
      <path d="M56 112 l-34 -32 l6 34 l28 14 z" fill={p.dark} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
      <path d="M148 112 l34 -32 l-6 34 l-28 14 z" fill={p.base} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
      <path d="M150 110 l24 -22 l-3 16 z" fill={p.light} opacity="0.9" />

      {/* narrow torso */}
      <path d="M70 110 h60 a12 12 0 0 1 12 12 v44 a12 12 0 0 1 -12 12 h-60 a12 12 0 0 1 -12 -12 v-44 a12 12 0 0 1 12 -12 z"
            fill={p.base} stroke={p.outline} strokeWidth="3" />
      <path d="M102 110 h28 a12 12 0 0 1 12 12 v44 a12 12 0 0 1 -12 12 h-28 z" fill={p.dark} />
      <path d="M70 110 h18 v28 h-30 v-16 a12 12 0 0 1 12 -12 z" fill={p.light} opacity="0.95" />
      <path d="M140 126 v34" stroke={p.spec} strokeWidth="3" strokeLinecap="round" opacity="0.6" />

      {/* energy core — a chevron, not a circle, so it reads as Nova */}
      <path d="M100 128 l16 14 l-16 24 l-16 -24 z" fill={p.deep} stroke={p.outline} strokeWidth="3" />
      <path d="M100 136 l10 8 l-10 16 l-10 -16 z" fill={p.glass} />
      <path d="M100 140 l5 4 l-5 8 l-5 -8 z" fill={p.glassLight} />

      <Plate d="M52 108 a20 16 0 0 1 24 -6 v20 h-24 a5 5 0 0 1 -5 -5 z" p={p} spec="M56 108 a12 8 0 0 1 12 -3 v5 a10 7 0 0 0 -10 3 z" />
      <Plate d="M148 108 a20 16 0 0 0 -24 -6 v20 h24 a5 5 0 0 0 5 -5 z" p={p} spec="M140 106 h7 v5 h-7 z" />

      {/* blade arm */}
      <Limb x={144} y={114} w={22} h={44} r={11} p={p} />
      <path d="M150 150 l52 -14 l6 12 l-52 18 z" fill={p.plate} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
      <path d="M154 152 l40 -11 l2 4 l-40 12 z" fill={p.glassLight} opacity="0.9" />

      {/* head — visored, no face */}
      <path d="M66 50 h68 a14 14 0 0 1 14 14 v30 a14 14 0 0 1 -14 14 h-68 a14 14 0 0 1 -14 -14 v-30 a14 14 0 0 1 14 -14 z"
            fill={p.base} stroke={p.outline} strokeWidth="3" />
      <path d="M100 50 h34 a14 14 0 0 1 14 14 v30 a14 14 0 0 1 -14 14 h-34 z" fill={p.dark} />
      <path d="M66 50 h18 v18 h-32 v-4 a14 14 0 0 1 14 -14 z" fill={p.light} opacity="0.95" />
      {/* visor */}
      <path d="M60 72 h80 v16 a8 8 0 0 1 -8 8 h-64 a8 8 0 0 1 -8 -8 z" fill={p.deep} stroke={p.outline} strokeWidth="3" />
      <path d="M66 76 h68 v8 h-68 z" fill={p.glass} />
      <path d="M70 78 h22 v4 h-22 z" fill={p.glassLight} />
      {/* crest */}
      <path d="M92 50 l8 -30 l8 30 z" fill={p.accent} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
    </g>
  );
}

/* ── TITAN-X — siege frame, huge pauldrons, shoulder cannon ───────────────── */

function TitanX({ p }: { p: SpritePalette }) {
  return (
    <g>
      <Limb x={62} y={172} w={34} h={48} r={12} p={p} flipShade />
      <Limb x={106} y={172} w={34} h={48} r={12} p={p} />
      <Plate d="M52 212 h48 a12 12 0 0 1 12 12 v8 a6 6 0 0 1 -6 6 h-58 a6 6 0 0 1 -6 -6 v-8 a12 12 0 0 1 10 -12 z" p={p} spec="M60 216 h24 v6 h-24 z" />
      <Plate d="M100 212 h48 a12 12 0 0 1 10 12 v8 a6 6 0 0 1 -6 6 h-58 a6 6 0 0 1 -6 -6 v-8 a12 12 0 0 1 12 -12 z" p={p} spec="M108 216 h24 v6 h-24 z" />

      {/* bulk torso */}
      <path d="M52 100 h96 a16 16 0 0 1 16 16 v52 a16 16 0 0 1 -16 16 h-96 a16 16 0 0 1 -16 -16 v-52 a16 16 0 0 1 16 -16 z"
            fill={p.base} stroke={p.outline} strokeWidth="3" />
      <path d="M100 100 h48 a16 16 0 0 1 16 16 v52 a16 16 0 0 1 -16 16 h-48 z" fill={p.dark} />
      <path d="M52 100 h26 v36 h-42 v-20 a16 16 0 0 1 16 -16 z" fill={p.light} opacity="0.95" />
      <path d="M162 120 v44" stroke={p.spec} strokeWidth="4" strokeLinecap="round" opacity="0.6" />

      {/* reactor */}
      <rect x={78} y={120} width={44} height={40} rx={8} fill={p.deep} stroke={p.outline} strokeWidth="3" />
      <rect x={86} y={128} width={28} height={24} rx={5} fill={p.glass} />
      <rect x={92} y={132} width={10} height={9} rx={2} fill={p.glassLight} />
      <path d="M78 140 h44" stroke={p.outline} strokeWidth="2" opacity="0.5" />

      {/* massive pauldrons */}
      <Plate d="M22 92 a34 26 0 0 1 42 -8 v34 a8 8 0 0 1 -8 8 h-28 a8 8 0 0 1 -8 -8 z" p={p} spec="M28 94 a22 16 0 0 1 22 -6 v8 a18 12 0 0 0 -18 5 z" />
      <Plate d="M178 92 a34 26 0 0 0 -42 -8 v34 a8 8 0 0 0 8 8 h28 a8 8 0 0 0 8 -8 z" p={p} spec="M164 90 h10 v8 h-10 z" />
      <rect x={30} y={104} width={26} height={10} rx={3} fill={p.deep} opacity="0.8" />
      <rect x={144} y={104} width={26} height={10} rx={3} fill={p.deep} opacity="0.8" />

      {/* shoulder cannon */}
      <rect x={150} y={62} width={44} height={26} rx={8} fill={p.base} stroke={p.outline} strokeWidth="3" />
      <rect x={150} y={74} width={44} height={14} rx={7} fill={p.dark} />
      <rect x={154} y={66} width={16} height={7} rx={3} fill={p.light} />
      <rect x={190} y={68} width={16} height={14} rx={4} fill={p.plate} stroke={p.outline} strokeWidth="3" />
      <circle cx={198} cy={75} r={4} fill={p.glass} />

      {/* squat head */}
      <path d="M70 54 h60 a14 14 0 0 1 14 14 v22 a14 14 0 0 1 -14 14 h-60 a14 14 0 0 1 -14 -14 v-22 a14 14 0 0 1 14 -14 z"
            fill={p.base} stroke={p.outline} strokeWidth="3" />
      <path d="M100 54 h30 a14 14 0 0 1 14 14 v22 a14 14 0 0 1 -14 14 h-30 z" fill={p.dark} />
      <path d="M70 54 h16 v16 h-30 v-2 a14 14 0 0 1 14 -14 z" fill={p.light} opacity="0.95" />
      <rect x={64} y={70} width={72} height={18} rx={6} fill={p.deep} stroke={p.outline} strokeWidth="3" />
      <rect x={70} y={75} width={60} height={8} rx={4} fill={p.glass} />
      <rect x={74} y={77} width={18} height={4} rx={2} fill={p.glassLight} />
      {/* brow horn */}
      <path d="M86 54 l14 -18 l14 18 z" fill={p.accent} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
    </g>
  );
}

/* ── VEX — glass cannon, asymmetric, twin blades ──────────────────────────── */

function Vex({ p }: { p: SpritePalette }) {
  return (
    <g>
      <g opacity="0.75">
        <Limb x={50} y={114} w={22} h={54} r={11} p={p} flipShade />
      </g>

      <Limb x={78} y={174} w={24} h={50} r={11} p={p} flipShade />
      <Limb x={106} y={174} w={24} h={50} r={11} p={p} />
      <Plate d="M72 214 h34 a9 9 0 0 1 9 9 v7 a5 5 0 0 1 -5 5 h-42 a5 5 0 0 1 -5 -5 v-7 a9 9 0 0 1 9 -9 z" p={p} spec="M78 218 h18 v4 h-18 z" />
      <Plate d="M100 214 h34 a9 9 0 0 1 9 9 v7 a5 5 0 0 1 -5 5 h-42 a5 5 0 0 1 -5 -5 v-7 a9 9 0 0 1 9 -9 z" p={p} spec="M106 218 h18 v4 h-18 z" />

      {/* angular torso */}
      <path d="M70 108 l62 6 l-8 62 h-46 z" fill={p.base} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
      <path d="M104 111 l28 3 l-8 62 h-22 z" fill={p.dark} />
      <path d="M70 108 l20 2 l-2 26 h-22 z" fill={p.light} opacity="0.95" />
      <path d="M128 124 l-5 40" stroke={p.spec} strokeWidth="3" strokeLinecap="round" opacity="0.6" />

      {/* split core */}
      <path d="M100 126 l14 10 l-6 30 l-16 -6 z" fill={p.deep} stroke={p.outline} strokeWidth="3" />
      <path d="M100 133 l8 6 l-4 18 l-9 -4 z" fill={p.glass} />
      <path d="M100 137 l4 3 l-2 8 l-4 -2 z" fill={p.glassLight} />

      {/* asymmetric shoulders — one heavy plate, one bare joint */}
      <Plate d="M48 104 a20 16 0 0 1 26 -6 v22 h-26 a5 5 0 0 1 -5 -5 z" p={p} spec="M52 104 a12 8 0 0 1 13 -3 v5 a10 7 0 0 0 -10 3 z" />
      <circle cx={140} cy={116} r={16} fill={p.base} stroke={p.outline} strokeWidth="3" />
      <path d="M140 100 a16 16 0 0 1 16 16 h-16 z" fill={p.dark} />
      <circle cx={134} cy={110} r={5} fill={p.spec} opacity="0.85" />

      {/* twin blades */}
      <path d="M148 106 l56 -34 l8 12 l-52 38 z" fill={p.plate} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
      <path d="M152 108 l44 -27 l3 5 l-44 28 z" fill={p.plateSpec} opacity="0.85" />
      <path d="M146 132 l54 12 l-4 14 l-52 -14 z" fill={p.dark} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
      <path d="M150 136 l42 10 l-1 5 l-42 -10 z" fill={p.glass} opacity="0.85" />

      {/* hooded head with a single hostile optic */}
      <path d="M64 52 h68 a14 14 0 0 1 14 14 v28 a14 14 0 0 1 -14 14 h-68 a14 14 0 0 1 -14 -14 v-28 a14 14 0 0 1 14 -14 z"
            fill={p.base} stroke={p.outline} strokeWidth="3" />
      <path d="M100 52 h32 a14 14 0 0 1 14 14 v28 a14 14 0 0 1 -14 14 h-32 z" fill={p.dark} />
      <path d="M64 52 h16 v18 h-30 v-4 a14 14 0 0 1 14 -14 z" fill={p.light} opacity="0.95" />
      {/* hood */}
      <path d="M50 60 l50 -34 l50 34 l-10 6 l-40 -26 l-40 26 z" fill={p.dark} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
      {/* visor slit */}
      <path d="M58 76 h84 v12 a6 6 0 0 1 -6 6 h-72 a6 6 0 0 1 -6 -6 z" fill={p.deep} stroke={p.outline} strokeWidth="3" />
      <path d="M64 80 h30 v5 h-30 z" fill={p.accent} />
      <circle cx={120} cy={84} r={5} fill={p.glass} />
      <circle cx={118} cy={82} r={2} fill="#FFFFFF" opacity="0.9" />
    </g>
  );
}

const SHAPES: Record<FighterId, (props: { p: SpritePalette }) => React.ReactElement> = {
  giga: Giga,
  nova: Nova,
  "titan-x": TitanX,
  vex: Vex,
};

export default function FighterSprite({ id, flip, className }: Props) {
  const Shape = SHAPES[id] ?? Giga;
  const palette = PALETTES[id] ?? GIGA_PALETTE;

  return (
    <svg
      viewBox="10 -6 212 262"
      className={className}
      preserveAspectRatio="xMidYMax meet"
      style={{ transform: flip ? "scaleX(-1)" : undefined, overflow: "visible" }}
      role="img"
      aria-label={`${id} fighter`}
    >
      {/* Contact shadow — grounds the figure so it reads as standing in the
          arena rather than floating over it. */}
      <ellipse cx={116} cy={242} rx={62} ry={9} fill="#05050B" opacity="0.55" />
      <Shape p={palette} />
    </svg>
  );
}
