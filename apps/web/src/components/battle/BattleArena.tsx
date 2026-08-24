"use client";

/**
 * The arena.
 *
 * This component owns the visual consequence of an answer. It renders both
 * combatants, then plays exactly one attack sequence per resolved answer:
 * lunge -> bolt -> impact burst -> recoil -> damage number -> tier banner.
 *
 * It never decides anything. `lastResult` is handed down already resolved by
 * combat.ts, so the picture can never disagree with the arithmetic.
 */

import { Starfield } from "@/components/Starfield";
import FighterSprite from "./FighterSprite";
import BossSprite from "./BossSprite";
import type { AttackResult, Boss, Fighter } from "@/lib/battle/types";

interface Props {
  fighter: Fighter;
  boss: Boss;
  result: AttackResult | null;
  playerDown: boolean;
  bossDown: boolean;
  /**
   * Caps the arena against the viewport instead of a fixed height. The daily
   * quiz stacks a navbar and the alpha banner above it, and a fixed 300px
   * arena pushed the answer buttons off screen on a laptop.
   */
  compact?: boolean;
}

/** Damage numbers scale with severity, so a big hit looks like one. */
function damageScale(result: AttackResult): string {
  if (result.special) return "text-6xl sm:text-8xl";
  if (result.crit) return "text-5xl sm:text-7xl";
  if (result.tier === "critical") return "text-4xl sm:text-6xl";
  return "text-3xl sm:text-5xl";
}

function tierColor(result: AttackResult): string {
  if (result.target === "player") return "var(--gp-danger)";
  if (result.special) return "var(--gp-gold)";
  if (result.crit) return "var(--gp-pink)";
  return "var(--gp-cyan)";
}

export default function BattleArena({
  fighter,
  boss,
  result,
  playerDown,
  bossDown,
  compact = false,
}: Props) {
  const attacking = result?.target === "boss";
  const defending = result?.target === "player";
  const heavy = !!result && (result.crit || result.special || result.tier === "critical");
  const accent = result ? tierColor(result) : "var(--gp-cyan)";

  return (
    <div
      className={`relative w-full overflow-hidden border-2 ${
        compact ? "" : "h-[210px] sm:h-[300px]"
      } ${heavy ? "bf-quake" : ""}`}
      style={{
        borderColor: "var(--ink)",
        background: "var(--surface-0)",
        boxShadow: "var(--shadow-hard)",
        ...(compact ? { height: "clamp(128px, 20vh, 208px)" } : {}),
      }}
    >
      {/* Deep-space backdrop. Flat dots + drifting stars, nothing that competes
          with the question panel below it. */}
      <Starfield />
      <div className="gp-dot-grid" aria-hidden />

      {/* Distant planet — flat disc with a hard terminator, no gradient. */}
      <div
        className="pointer-events-none absolute -right-10 top-6 h-24 w-24 rounded-full border-2 sm:h-36 sm:w-36"
        style={{ background: "var(--surface-2)", borderColor: "var(--ink)", opacity: 0.9 }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-10 top-6 h-24 w-12 sm:h-36 sm:w-[72px]"
        style={{
          background: "var(--surface-1)",
          borderRight: "2px solid var(--ink)",
          borderRadius: "999px 0 0 999px",
          opacity: 0.9,
        }}
        aria-hidden
      />

      {/* Arena floor line — a flat horizon the fighters stand on. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-8 h-[2px]"
        style={{ background: "var(--gp-outline)" }}
        aria-hidden
      />

      {/* Special / critical colour wash. Flat fill, opacity keyframes only. */}
      {result && heavy && (
        <div
          key={`flash-${result.elapsedMs}-${result.damage}`}
          className="bf-flash pointer-events-none absolute inset-0"
          style={{ background: accent }}
          aria-hidden
        />
      )}

      {/* ── Player ── */}
      <div className="absolute bottom-4 left-[4%] w-[26%] max-w-[150px] sm:left-[8%]">
        <div
          className={
            playerDown ? "bf-ko" : attacking ? "bf-lunge-r" : defending ? "bf-hit" : "bf-idle"
          }
        >
          <FighterSprite
            id={fighter.id}
            color={fighter.color}
            colorDark={fighter.colorDark}
            className="h-auto w-full"
          />
        </div>
        {/* Flat shadow ellipse anchors the fighter to the floor. */}
        <div
          className="mx-auto h-[6px] w-3/4 rounded-full"
          style={{ background: "var(--ink)", opacity: 0.6 }}
          aria-hidden
        />
      </div>

      {/* ── Boss ── */}
      <div className="absolute bottom-4 right-[2%] w-[34%] max-w-[210px] sm:right-[6%]">
        <div
          className={
            bossDown ? "bf-ko" : defending ? "bf-lunge-l" : attacking ? "bf-hit" : "bf-idle-slow"
          }
        >
          <BossSprite
            bossId={boss.id}
            color={boss.color}
            colorDark={boss.colorDark}
            className="h-auto w-full"
          />
        </div>
        <div
          className="mx-auto h-[6px] w-3/4 rounded-full"
          style={{ background: "var(--ink)", opacity: 0.6 }}
          aria-hidden
        />
      </div>

      {/* ── Energy bolt ── */}
      {result && (
        <div
          key={`bolt-${result.damage}-${result.tier}`}
          className={`pointer-events-none absolute top-1/2 h-2 sm:h-3 ${
            attacking ? "bf-bolt-r left-[26%]" : "bf-bolt-l right-[30%]"
          }`}
          style={
            {
              width: result.special ? 54 : 30,
              background: accent,
              border: "2px solid var(--ink)",
              "--bf-bolt-dist": "220px",
            } as React.CSSProperties
          }
          aria-hidden
        />
      )}

      {/* ── Impact burst on the target ── */}
      {result && (
        <div
          key={`burst-${result.damage}-${result.label}`}
          className={`bf-burst pointer-events-none absolute top-[38%] ${
            attacking ? "right-[16%]" : "left-[10%]"
          }`}
          aria-hidden
        >
          <div
            className="h-12 w-12 rotate-45 border-4 sm:h-20 sm:w-20"
            style={{ borderColor: accent }}
          />
        </div>
      )}

      {/* ── Damage number ── */}
      {result && (
        <div
          key={`dmg-${result.damage}-${result.elapsedMs}`}
          className={`bf-dmg pointer-events-none absolute top-[22%] ${
            attacking ? "right-[14%]" : "left-[8%]"
          }`}
          aria-hidden
        >
          <span
            className={`gp-arcade ${damageScale(result)}`}
            style={{
              color: accent,
              textShadow:
                "3px 3px 0 var(--ink), -1px -1px 0 var(--ink), 1px -1px 0 var(--ink), -1px 1px 0 var(--ink)",
            }}
          >
            -{result.damage}
          </span>
        </div>
      )}

      {/* ── Hit-tier banner ── */}
      {result && (
        <div
          key={`banner-${result.label}-${result.damage}`}
          className="bf-banner pointer-events-none absolute inset-x-0 top-4 flex justify-center"
        >
          <span
            className="gp-arcade border-2 px-3 py-1 text-sm sm:px-5 sm:py-2 sm:text-2xl"
            style={{
              background: accent,
              color: "var(--ink)",
              borderColor: "var(--ink)",
              boxShadow: "var(--shadow-hard-sm)",
            }}
          >
            {result.target === "player" ? "✕ " : "⚡ "}
            {result.label}
          </span>
        </div>
      )}
    </div>
  );
}
