"use client";

/**
 * Boss sprites. Each rung of the ladder gets a bigger, meaner silhouette so
 * the level you are on is readable before you read the name plate.
 */

const INK = "var(--ink)";

interface Props {
  bossId: string;
  color: string;
  colorDark: string;
  className?: string;
}

function Drone({ c, d }: { c: string; d: string }) {
  return (
    <>
      <path d="M56 46 L124 46 L134 104 L46 104 Z" fill={c} stroke={INK} strokeWidth="3" />
      <path d="M96 46 L124 46 L134 104 L96 104 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M74 64 L108 64 L108 88 L74 88 Z" fill={INK} />
      <path d="M82 70 L100 70 L100 82 L82 82 Z" fill="var(--gp-danger)" />
      <path d="M40 52 L58 58 L54 92 L34 86 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M122 58 L142 52 L146 86 L126 92 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M84 20 L98 20 L104 46 L78 46 Z" fill={c} stroke={INK} strokeWidth="3" />
      <path d="M62 106 L120 106 L112 132 L70 132 Z" fill={d} stroke={INK} strokeWidth="3" />
    </>
  );
}

function Raider({ c, d }: { c: string; d: string }) {
  return (
    <>
      <path d="M52 58 L132 58 L142 118 L44 118 Z" fill={c} stroke={INK} strokeWidth="3" />
      <path d="M96 58 L132 58 L142 118 L96 118 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M70 76 L112 76 L106 100 L76 100 Z" fill={INK} />
      <path d="M80 82 L102 82 L98 94 L84 94 Z" fill="var(--gp-white)" />
      <path d="M24 44 L56 54 L50 100 L18 88 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M128 54 L162 44 L166 88 L134 100 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M76 22 L110 22 L118 58 L68 58 Z" fill={c} stroke={INK} strokeWidth="3" />
      <path d="M84 32 L102 32 L102 44 L84 44 Z" fill="var(--gp-danger)" stroke={INK} strokeWidth="3" />
      <path d="M66 2 L78 22 L58 24 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M120 2 L128 24 L108 22 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M58 120 L128 120 L118 148 L68 148 Z" fill={d} stroke={INK} strokeWidth="3" />
    </>
  );
}

function Hunter({ c, d }: { c: string; d: string }) {
  return (
    <>
      <path d="M48 62 L138 62 L150 126 L38 126 Z" fill={c} stroke={INK} strokeWidth="3" />
      <path d="M94 62 L138 62 L150 126 L94 126 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M66 80 L120 80 L112 108 L74 108 Z" fill={INK} />
      <path d="M78 86 L108 86 L102 102 L84 102 Z" fill="var(--gp-cyan)" />
      <path d="M14 40 L52 56 L46 108 L8 92 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M134 56 L172 40 L178 92 L140 108 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M0 60 L18 52 L24 84 L4 90 Z" fill={c} stroke={INK} strokeWidth="3" />
      <path d="M168 52 L186 60 L182 90 L162 84 Z" fill={c} stroke={INK} strokeWidth="3" />
      <path d="M70 18 L116 18 L126 62 L60 62 Z" fill={c} stroke={INK} strokeWidth="3" />
      <path d="M78 30 L108 30 L108 46 L78 46 Z" fill="var(--gp-danger)" stroke={INK} strokeWidth="3" />
      <path d="M56 0 L72 18 L46 22 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M130 0 L140 22 L114 18 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M54 128 L132 128 L122 158 L64 158 Z" fill={d} stroke={INK} strokeWidth="3" />
    </>
  );
}

function Commander({ c, d }: { c: string; d: string }) {
  return (
    <>
      <path d="M44 66 L142 66 L156 132 L32 132 Z" fill={c} stroke={INK} strokeWidth="3" />
      <path d="M94 66 L142 66 L156 132 L94 132 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M64 84 L124 84 L114 114 L74 114 Z" fill={INK} />
      <path d="M76 90 L112 90 L104 108 L84 108 Z" fill="var(--gp-gold)" />
      <path d="M6 34 L50 56 L44 114 L0 94 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M138 56 L182 34 L188 94 L144 114 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M12 44 L40 58 L38 78 L10 66 Z" fill={INK} />
      <path d="M148 58 L176 44 L178 66 L150 78 Z" fill={INK} />
      <path d="M66 14 L120 14 L132 66 L54 66 Z" fill={c} stroke={INK} strokeWidth="3" />
      <path d="M74 28 L112 28 L112 48 L74 48 Z" fill="var(--gp-danger)" stroke={INK} strokeWidth="3" />
      <path d="M80 34 L92 34 L92 42 L80 42 Z" fill="var(--gp-white)" />
      <path d="M50 0 L70 14 L38 20 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M136 0 L148 20 L116 14 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M50 134 L138 134 L126 164 L62 164 Z" fill={d} stroke={INK} strokeWidth="3" />
    </>
  );
}

function VoidKing({ c, d }: { c: string; d: string }) {
  return (
    <>
      <path d="M40 70 L148 70 L164 138 L26 138 Z" fill={c} stroke={INK} strokeWidth="3" />
      <path d="M94 70 L148 70 L164 138 L94 138 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M60 88 L128 88 L118 120 L72 120 Z" fill={INK} />
      <path d="M74 94 L114 94 L106 114 L82 114 Z" fill="var(--gp-danger)" />
      <path d="M88 98 L100 98 L100 110 L88 110 Z" fill="var(--gp-white)" />
      <path d="M0 28 L46 56 L40 120 L-8 96 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M142 56 L188 28 L196 96 L148 120 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M8 40 L38 58 L36 80 L6 62 Z" fill={INK} />
      <path d="M150 58 L180 40 L182 62 L152 80 Z" fill={INK} />
      <path d="M62 10 L126 10 L140 70 L48 70 Z" fill={c} stroke={INK} strokeWidth="3" />
      <path d="M70 26 L118 26 L118 50 L70 50 Z" fill={INK} stroke={INK} strokeWidth="3" />
      <path d="M76 32 L90 32 L90 44 L76 44 Z" fill="var(--gp-danger)" />
      <path d="M98 32 L112 32 L112 44 L98 44 Z" fill="var(--gp-danger)" />
      {/* crown */}
      <path d="M48 10 L58 -18 L70 10 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M82 10 L94 -26 L106 10 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M118 10 L130 -18 L140 10 Z" fill={d} stroke={INK} strokeWidth="3" />
      <path d="M44 140 L146 140 L132 172 L58 172 Z" fill={d} stroke={INK} strokeWidth="3" />
    </>
  );
}

const SHAPES: Record<string, (p: { c: string; d: string }) => React.ReactElement> = {
  "training-drone": Drone,
  "void-raider": Raider,
  "nebula-hunter": Hunter,
  "titan-commander": Commander,
  "void-king": VoidKing,
};

export default function BossSprite({ bossId, color, colorDark, className }: Props) {
  const Shape = SHAPES[bossId] ?? Drone;
  return (
    <svg
      viewBox="-10 -30 206 206"
      className={className}
      style={{ overflow: "visible" }}
      role="img"
      aria-label={`${bossId} boss`}
    >
      <Shape c={color} d={colorDark} />
    </svg>
  );
}
