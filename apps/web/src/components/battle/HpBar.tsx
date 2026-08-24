"use client";

/**
 * Segmented HP bar.
 *
 * Discrete blocks rather than a continuous fill — it reads as an arcade gauge,
 * and it makes a chunk of damage legible at a glance instead of a smooth slide
 * the eye can miss mid-animation.
 */

interface Props {
  current: number;
  max: number;
  color: string;
  /** Right-aligned bars drain from the right, mirroring the boss side. */
  align?: "left" | "right";
  shaking?: boolean;
  segments?: number;
}

export default function HpBar({
  current,
  max,
  color,
  align = "left",
  shaking = false,
  segments = 20,
}: Props) {
  const pct = Math.max(0, Math.min(1, current / max));
  const filled = Math.ceil(pct * segments);
  // Colour shifts as the situation gets dire — a warning you feel, not read.
  const fill = pct <= 0.25 ? "var(--gp-danger)" : pct <= 0.5 ? "var(--gp-gold)" : color;

  const blocks = Array.from({ length: segments }, (_, i) => {
    const index = align === "right" ? segments - 1 - i : i;
    return index < filled;
  });

  return (
    <div
      className={`flex gap-[2px] ${align === "right" ? "flex-row-reverse" : ""} ${
        shaking ? "bf-bar-hit" : ""
      }`}
      role="progressbar"
      aria-valuenow={Math.max(0, Math.round(current))}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      {blocks.map((on, i) => (
        <span
          key={i}
          className="h-3 flex-1 border-2"
          style={{
            background: on ? fill : "var(--surface-3)",
            borderColor: "var(--ink)",
            minWidth: 4,
          }}
        />
      ))}
    </div>
  );
}
