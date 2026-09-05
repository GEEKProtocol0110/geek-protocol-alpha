"use client";

/**
 * Boss sprites, cel-shaded to match the roster.
 *
 * Same construction rule as the fighters: a tone ramp per material, one
 * upper-left light, hard specular shapes and a rim light on the shadow edge —
 * dimensional without a gradient anywhere. Each rung of the ladder gets a
 * larger, meaner silhouette so the level reads before the name plate does.
 */

import { BOSS_PALETTES, type SpritePalette } from "./spritePalettes";

interface Props {
  bossId: string;
  color?: string;
  colorDark?: string;
  className?: string;
}

/** A shaded block: base, shadow half, lit corner, hard highlight. */
function Block({
  x, y, w, h, r = 8, p,
}: { x: number; y: number; w: number; h: number; r?: number; p: SpritePalette }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={r} fill={p.base} stroke={p.outline} strokeWidth="3" />
      <path d={`M${x + w / 2} ${y} H${x + w - r} a${r} ${r} 0 0 1 ${r} ${r} V${y + h - r} a${r} ${r} 0 0 1 -${r} ${r} H${x + w / 2} Z`} fill={p.dark} />
      <rect x={x + w * 0.08} y={y + h * 0.08} width={w * 0.3} height={h * 0.36} rx={r * 0.5} fill={p.light} opacity="0.9" />
      <rect x={x + w * 0.13} y={y + h * 0.13} width={w * 0.11} height={h * 0.18} rx={2} fill={p.spec} opacity="0.9" />
      <rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke={p.outline} strokeWidth="3" />
    </g>
  );
}

/** Glowing optic with a dark socket and a hot centre. */
function Optic({ cx, cy, r, p }: { cx: number; cy: number; r: number; p: SpritePalette }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 4} fill={p.deep} stroke={p.outline} strokeWidth="3" />
      <circle cx={cx} cy={cy} r={r} fill={p.glow} />
      <circle cx={cx - r * 0.3} cy={cy - r * 0.3} r={r * 0.35} fill="#FFFFFF" opacity="0.85" />
    </g>
  );
}

function Drone({ p }: { p: SpritePalette }) {
  return (
    <g>
      {/* side thrusters */}
      <Block x={18} y={92} w={30} h={54} r={12} p={p} />
      <Block x={162} y={92} w={30} h={54} r={12} p={p} />
      <rect x={24} y={140} width={18} height={10} rx={4} fill={p.glow} opacity="0.8" />
      <rect x={168} y={140} width={18} height={10} rx={4} fill={p.glow} opacity="0.8" />

      {/* core pod */}
      <ellipse cx={105} cy={110} rx={58} ry={52} fill={p.base} stroke={p.outline} strokeWidth="3" />
      <path d="M105 58 a58 52 0 0 1 0 104 z" fill={p.dark} />
      <ellipse cx={82} cy={88} rx={22} ry={16} fill={p.light} opacity="0.85" />
      <ellipse cx={76} cy={82} rx={8} ry={6} fill={p.spec} opacity="0.9" />
      <path d="M158 92 a58 52 0 0 1 -10 44" stroke={p.spec} strokeWidth="3" fill="none" opacity="0.6" strokeLinecap="round" />

      {/* face band */}
      <rect x={62} y={96} width={86} height={30} rx={13} fill={p.deep} stroke={p.outline} strokeWidth="3" />
      <Optic cx={105} cy={111} r={9} p={p} />

      {/* antenna */}
      <path d="M105 58 v-22" stroke={p.outline} strokeWidth="6" strokeLinecap="round" />
      <circle cx={105} cy={30} r={8} fill={p.accent} stroke={p.outline} strokeWidth="3" />
      {/* skirt */}
      <path d="M66 150 h78 l-12 26 h-54 z" fill={p.dark} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
      <path d="M72 154 h20 l-4 18 h-12 z" fill={p.base} opacity="0.8" />
    </g>
  );
}

function Raider({ p }: { p: SpritePalette }) {
  return (
    <g>
      {/* arms */}
      <Block x={8} y={80} w={34} h={78} r={14} p={p} />
      <Block x={168} y={80} w={34} h={78} r={14} p={p} />

      {/* torso */}
      <path d="M46 76 h118 a18 18 0 0 1 18 18 v64 a18 18 0 0 1 -18 18 h-118 a18 18 0 0 1 -18 -18 v-64 a18 18 0 0 1 18 -18 z"
            fill={p.base} stroke={p.outline} strokeWidth="3" />
      <path d="M105 76 h59 a18 18 0 0 1 18 18 v64 a18 18 0 0 1 -18 18 h-59 z" fill={p.dark} />
      <path d="M46 76 h30 v40 h-48 v-22 a18 18 0 0 1 18 -18 z" fill={p.light} opacity="0.95" />
      <path d="M180 100 v52" stroke={p.spec} strokeWidth="4" strokeLinecap="round" opacity="0.6" />

      {/* chest vent */}
      <rect x={72} y={100} width={66} height={40} rx={10} fill={p.deep} stroke={p.outline} strokeWidth="3" />
      <rect x={80} y={108} width={50} height={8} rx={4} fill={p.glow} />
      <rect x={80} y={122} width={50} height={8} rx={4} fill={p.glow} opacity="0.6" />

      {/* head + horns */}
      <path d="M66 30 h78 a16 16 0 0 1 16 16 v26 a16 16 0 0 1 -16 16 h-78 a16 16 0 0 1 -16 -16 v-26 a16 16 0 0 1 16 -16 z"
            fill={p.base} stroke={p.outline} strokeWidth="3" />
      <path d="M105 30 h39 a16 16 0 0 1 16 16 v26 a16 16 0 0 1 -16 16 h-39 z" fill={p.dark} />
      <path d="M66 30 h20 v18 h-36 v-2 a16 16 0 0 1 16 -16 z" fill={p.light} opacity="0.95" />
      <rect x={62} y={48} width={86} height={22} rx={9} fill={p.deep} stroke={p.outline} strokeWidth="3" />
      <Optic cx={86} cy={59} r={7} p={p} />
      <Optic cx={124} cy={59} r={7} p={p} />
      <path d="M56 30 l-14 -26 l30 12 z" fill={p.dark} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
      <path d="M154 30 l14 -26 l-30 12 z" fill={p.dark} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />

      {/* legs */}
      <path d="M60 176 h90 l-14 32 h-62 z" fill={p.dark} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
      <path d="M66 180 h24 l-6 24 h-14 z" fill={p.base} opacity="0.8" />
    </g>
  );
}

function Hunter({ p }: { p: SpritePalette }) {
  return (
    <g>
      {/* sensor wings */}
      <path d="M40 70 l-38 -22 l6 76 l34 -18 z" fill={p.dark} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
      <path d="M170 70 l38 -22 l-6 76 l-34 -18 z" fill={p.base} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
      <path d="M174 70 l26 -15 l-3 22 z" fill={p.light} opacity="0.9" />
      <circle cx={22} cy={82} r={6} fill={p.glow} />
      <circle cx={188} cy={82} r={6} fill={p.glow} />

      <Block x={12} y={92} w={30} h={70} r={13} p={p} />
      <Block x={168} y={92} w={30} h={70} r={13} p={p} />

      <path d="M44 74 h122 a18 18 0 0 1 18 18 v70 a18 18 0 0 1 -18 18 h-122 a18 18 0 0 1 -18 -18 v-70 a18 18 0 0 1 18 -18 z"
            fill={p.base} stroke={p.outline} strokeWidth="3" />
      <path d="M105 74 h61 a18 18 0 0 1 18 18 v70 a18 18 0 0 1 -18 18 h-61 z" fill={p.dark} />
      <path d="M44 74 h32 v44 h-50 v-26 a18 18 0 0 1 18 -18 z" fill={p.light} opacity="0.95" />
      <path d="M182 98 v58" stroke={p.spec} strokeWidth="4" strokeLinecap="round" opacity="0.6" />

      <path d="M76 102 l29 -14 l29 14 v34 l-29 16 l-29 -16 z" fill={p.deep} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
      <path d="M84 108 l21 -10 l21 10 v26 l-21 12 l-21 -12 z" fill={p.glass} opacity="0.9" />
      <path d="M92 112 l13 -6 l6 3 l-19 9 z" fill={p.glassLight} />

      <path d="M68 26 h74 a16 16 0 0 1 16 16 v28 a16 16 0 0 1 -16 16 h-74 a16 16 0 0 1 -16 -16 v-28 a16 16 0 0 1 16 -16 z"
            fill={p.base} stroke={p.outline} strokeWidth="3" />
      <path d="M105 26 h37 a16 16 0 0 1 16 16 v28 a16 16 0 0 1 -16 16 h-37 z" fill={p.dark} />
      <path d="M68 26 h18 v18 h-34 v-2 a16 16 0 0 1 16 -16 z" fill={p.light} opacity="0.95" />
      <rect x={62} y={46} width={86} height={24} rx={10} fill={p.deep} stroke={p.outline} strokeWidth="3" />
      <Optic cx={105} cy={58} r={9} p={p} />
      <path d="M60 26 l-10 -22 l24 12 z" fill={p.dark} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
      <path d="M150 26 l10 -22 l-24 12 z" fill={p.dark} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />

      <path d="M58 180 h94 l-14 30 h-66 z" fill={p.dark} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
    </g>
  );
}

function Commander({ p }: { p: SpritePalette }) {
  return (
    <g>
      {/* epaulettes */}
      <path d="M34 66 a42 30 0 0 1 50 -10 v40 a10 10 0 0 1 -10 10 h-32 a10 10 0 0 1 -10 -10 z"
            fill={p.plate} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
      <path d="M42 68 a28 20 0 0 1 28 -8 v10 a24 15 0 0 0 -24 6 z" fill={p.plateSpec} opacity="0.9" />
      <path d="M176 66 a42 30 0 0 0 -50 -10 v40 a10 10 0 0 0 10 10 h32 a10 10 0 0 0 10 -10 z"
            fill={p.plateDark} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />

      <Block x={10} y={104} w={32} h={72} r={13} p={p} />
      <Block x={168} y={104} w={32} h={72} r={13} p={p} />

      <path d="M40 80 h130 a20 20 0 0 1 20 20 v74 a20 20 0 0 1 -20 20 h-130 a20 20 0 0 1 -20 -20 v-74 a20 20 0 0 1 20 -20 z"
            fill={p.base} stroke={p.outline} strokeWidth="3" />
      <path d="M105 80 h65 a20 20 0 0 1 20 20 v74 a20 20 0 0 1 -20 20 h-65 z" fill={p.dark} />
      <path d="M40 80 h34 v46 h-54 v-26 a20 20 0 0 1 20 -20 z" fill={p.light} opacity="0.95" />
      <path d="M188 106 v62" stroke={p.spec} strokeWidth="4" strokeLinecap="round" opacity="0.6" />

      <rect x={68} y={108} width={74} height={48} rx={12} fill={p.deep} stroke={p.outline} strokeWidth="3" />
      <rect x={78} y={118} width={54} height={28} rx={8} fill={p.glass} />
      <rect x={86} y={124} width={18} height={9} rx={3} fill={p.glassLight} />

      <path d="M66 24 h78 a16 16 0 0 1 16 16 v30 a16 16 0 0 1 -16 16 h-78 a16 16 0 0 1 -16 -16 v-30 a16 16 0 0 1 16 -16 z"
            fill={p.base} stroke={p.outline} strokeWidth="3" />
      <path d="M105 24 h39 a16 16 0 0 1 16 16 v30 a16 16 0 0 1 -16 16 h-39 z" fill={p.dark} />
      <path d="M66 24 h20 v20 h-36 v-4 a16 16 0 0 1 16 -16 z" fill={p.light} opacity="0.95" />
      <rect x={60} y={44} width={90} height={26} rx={11} fill={p.deep} stroke={p.outline} strokeWidth="3" />
      <Optic cx={84} cy={57} r={8} p={p} />
      <Optic cx={126} cy={57} r={8} p={p} />
      {/* crest */}
      <path d="M88 24 l17 -22 l17 22 z" fill={p.accent} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />

      <path d="M56 194 h98 l-14 30 h-70 z" fill={p.dark} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
    </g>
  );
}

function VoidKing({ p }: { p: SpritePalette }) {
  return (
    <g>
      {/* mantle */}
      <path d="M22 74 a56 40 0 0 1 64 -14 v56 a12 12 0 0 1 -12 12 h-40 a12 12 0 0 1 -12 -12 z"
            fill={p.dark} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
      <path d="M188 74 a56 40 0 0 0 -64 -14 v56 a12 12 0 0 0 12 12 h40 a12 12 0 0 0 12 -12 z"
            fill={p.base} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
      <path d="M132 66 a44 30 0 0 1 34 -6 v10 a38 24 0 0 0 -30 5 z" fill={p.light} opacity="0.9" />

      <Block x={4} y={110} w={32} h={76} r={13} p={p} />
      <Block x={174} y={110} w={32} h={76} r={13} p={p} />

      <path d="M36 84 h138 a22 22 0 0 1 22 22 v78 a22 22 0 0 1 -22 22 h-138 a22 22 0 0 1 -22 -22 v-78 a22 22 0 0 1 22 -22 z"
            fill={p.base} stroke={p.outline} strokeWidth="3" />
      <path d="M105 84 h69 a22 22 0 0 1 22 22 v78 a22 22 0 0 1 -22 22 h-69 z" fill={p.dark} />
      <path d="M36 84 h36 v48 h-58 v-26 a22 22 0 0 1 22 -22 z" fill={p.light} opacity="0.95" />
      <path d="M194 112 v66" stroke={p.spec} strokeWidth="4" strokeLinecap="round" opacity="0.65" />

      {/* furnace core */}
      <path d="M62 112 l43 -18 l43 18 v46 l-43 22 l-43 -22 z" fill={p.deep} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
      <path d="M72 118 l33 -14 l33 14 v36 l-33 17 l-33 -17 z" fill={p.glass} />
      <path d="M84 124 l21 -9 l9 4 l-30 13 z" fill={p.glassLight} opacity="0.9" />
      <circle cx={105} cy={140} r={9} fill="#FFFFFF" opacity="0.9" />

      <path d="M64 26 h82 a18 18 0 0 1 18 18 v32 a18 18 0 0 1 -18 18 h-82 a18 18 0 0 1 -18 -18 v-32 a18 18 0 0 1 18 -18 z"
            fill={p.base} stroke={p.outline} strokeWidth="3" />
      <path d="M105 26 h41 a18 18 0 0 1 18 18 v32 a18 18 0 0 1 -18 18 h-41 z" fill={p.dark} />
      <path d="M64 26 h22 v20 h-40 v-2 a18 18 0 0 1 18 -18 z" fill={p.light} opacity="0.95" />
      <rect x={58} y={46} width={94} height={28} rx={12} fill={p.deep} stroke={p.outline} strokeWidth="3" />
      <Optic cx={82} cy={60} r={9} p={p} />
      <Optic cx={128} cy={60} r={9} p={p} />

      {/* crown */}
      <path d="M56 26 l6 -30 l14 30 z" fill={p.accent} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
      <path d="M92 26 l13 -40 l13 40 z" fill={p.accent} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
      <path d="M134 26 l14 -30 l6 30 z" fill={p.accent} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />

      <path d="M52 206 h106 l-16 32 h-74 z" fill={p.dark} stroke={p.outline} strokeWidth="3" strokeLinejoin="round" />
    </g>
  );
}

const SHAPES: Record<string, (props: { p: SpritePalette }) => React.ReactElement> = {
  "training-drone": Drone,
  "void-raider": Raider,
  "nebula-hunter": Hunter,
  "titan-commander": Commander,
  "void-king": VoidKing,
};

export default function BossSprite({ bossId, className }: Props) {
  const Shape = SHAPES[bossId] ?? Drone;
  const palette = BOSS_PALETTES[bossId] ?? BOSS_PALETTES["training-drone"];

  return (
    <svg
      viewBox="-2 -42 214 292"
      className={className}
      preserveAspectRatio="xMidYMax meet"
      style={{ overflow: "visible" }}
      role="img"
      aria-label={`${bossId} boss`}
    >
      <ellipse cx={105} cy={240} rx={72} ry={10} fill="#05050B" opacity="0.55" />
      <Shape p={palette} />
    </svg>
  );
}
