"use client";

/**
 * The arena.
 *
 * This component owns the visual consequence of an answer. Every resolved
 * answer swaps both fighters to the frame that depicts that exact exchange —
 * the striker's blow and the receiver's reaction — then plays the weight
 * around it: a dash in, a knock-back, a hit flash, a burst at the point of
 * contact, the damage number and the tier banner.
 *
 * It never decides anything. `lastResult` arrives already resolved by
 * combat.ts and the pose pair comes from sprites.ts, so the picture can never
 * disagree with the arithmetic.
 */

import { memo, useEffect, useRef } from "react";
import Image from "next/image";
import ArenaBackdrop from "./ArenaBackdrop";
import { IDLE_PAIR, selectPoses } from "@/lib/battle/sprites";
import type { AttackResult, Boss, Fighter } from "@/lib/battle/types";

interface Props {
  fighter: Fighter;
  boss: Boss;
  result: AttackResult | null;
  playerDown: boolean;
  bossDown: boolean;
  playerMaxHp?: number;
  /** Fills the height its parent slot allocates rather than setting its own. */
  fill?: boolean;
}

/**
 * Restart a CSS animation without remounting the element's children.
 *
 * The wrappers used to be keyed on each exchange, which remounted the sprite
 * `<img>` and forced the browser to decode the frame again — a visible hitch on
 * every hit. Toggling `animation` and forcing one reflow replays the motion
 * while the image element (and its decoded bitmap) survives.
 */
function useReplayAnimation<T extends HTMLElement>(beat: string) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.animation = "none";
    void el.offsetHeight;
    el.style.animation = "";
  }, [beat]);
  return ref;
}

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

function BattleArena({
  fighter,
  boss,
  result,
  playerDown,
  bossDown,
  playerMaxHp = 110,
  fill = false,
}: Props) {
  const attacking = result?.target === "boss";
  const defending = result?.target === "player";
  const heavy = !!result && (result.crit || result.special || result.tier === "critical");
  const accent = result ? tierColor(result) : "var(--gp-cyan)";

  const poses = result
    ? selectPoses({ result, playerDown, bossDown, playerMaxHp, bossMaxHp: boss.maxHp })
    : playerDown || bossDown
      ? selectPoses({ result: null, playerDown, bossDown, playerMaxHp, bossMaxHp: boss.maxHp })
      : IDLE_PAIR;

  // A key that changes on every exchange, so React remounts the animated
  // wrappers and the CSS replays instead of sitting on its end state.
  const beat = result ? `${result.label}-${result.damage}-${result.elapsedMs}` : "idle";

  const playerMotion = playerDown
    ? "bf-downed"
    : attacking
      ? poses.playerAirborne
        ? "bf-air-r"
        : "bf-strike-r"
      : defending
        ? poses.playerAirborne
          ? "bf-air-l"
          : "bf-knock-l"
        : "bf-sprite-idle";

  const playerRef = useReplayAnimation<HTMLDivElement>(beat);
  const bossRef = useReplayAnimation<HTMLDivElement>(beat);

  const bossMotion = bossDown
    ? "bf-downed"
    : defending
      ? "bf-strike-l"
      : attacking
        ? "bf-knock-r"
        : "bf-sprite-idle";

  return (
    <div
      className={`relative w-full overflow-hidden border-2 ${
        fill ? "h-full" : "h-[210px] sm:h-[300px]"
      } ${heavy ? "bf-quake" : ""}`}
      style={{
        borderColor: "var(--ink)",
        background: "var(--surface-0)",
        boxShadow: "var(--shadow-hard)",
      }}
    >
      <ArenaBackdrop />

      {/* Colour wash on a big hit. Flat fill, opacity keyframes only. */}
      {result && heavy && (
        <div key={`flash-${beat}`} className="bf-flash pointer-events-none absolute inset-0" style={{ background: accent }} aria-hidden />
      )}

      {/* ── Giga ── */}
      <div className="absolute bottom-[5%] left-[-4%] h-[92%] w-[62%] sm:left-[-2%] sm:w-[58%]">
        <div ref={playerRef} className={`relative h-full w-full ${playerMotion}`}>
          <Image
            src={poses.player}
            alt={fighter.name}
            fill
            sizes="(max-width: 640px) 62vw, 640px"
            className="object-contain object-bottom"
            priority
            unoptimized
          />
          {/* Hit flash sits inside the sprite box and is masked to its shape by
              rendering the same frame in flat white on top. */}
          {defending && !playerDown && (
            <div key={`pf-${beat}`} className="bf-hitflash pointer-events-none absolute inset-0">
              <Image
                src={poses.player}
                alt=""
                fill
                sizes="(max-width: 640px) 62vw, 640px"
                aria-hidden
                unoptimized
                className="object-contain object-bottom"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── The Wraith ── */}
      <div className="absolute bottom-[5%] right-[-6%] h-[96%] w-[62%] sm:right-[-3%] sm:w-[58%]">
        <div ref={bossRef} className={`relative h-full w-full ${bossMotion}`}>
          <Image
            src={poses.boss}
            alt={boss.name}
            fill
            sizes="(max-width: 640px) 62vw, 640px"
            className="object-contain object-bottom"
            priority
            unoptimized
          />
          {attacking && !bossDown && (
            <div key={`bf-${beat}`} className="bf-hitflash pointer-events-none absolute inset-0">
              <Image
                src={poses.boss}
                alt=""
                fill
                sizes="(max-width: 640px) 62vw, 640px"
                aria-hidden
                unoptimized
                className="object-contain object-bottom"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Speed streaks behind the attacker ── */}
      {result && (
        <div
          key={`streak-${beat}`}
          className={`bf-streak pointer-events-none absolute top-[46%] h-[3px] ${
            attacking ? "left-[16%] w-[26%] origin-left" : "right-[18%] w-[26%] origin-right"
          }`}
          style={{ background: accent, opacity: 0.7 }}
          aria-hidden
        />
      )}

      {/* ── Impact burst at the point of contact ── */}
      {result && (
        <div
          key={`burst-${beat}`}
          className={`bf-burst pointer-events-none absolute top-[34%] ${attacking ? "right-[30%]" : "left-[26%]"}`}
          aria-hidden
        >
          <div className="h-14 w-14 rotate-45 border-4 sm:h-24 sm:w-24" style={{ borderColor: accent }} />
        </div>
      )}

      {/* ── Damage number ── */}
      {result && (
        <div
          key={`dmg-${beat}`}
          className={`bf-dmg pointer-events-none absolute top-[16%] ${attacking ? "right-[26%]" : "left-[20%]"}`}
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
        <div key={`banner-${beat}`} className="bf-banner pointer-events-none absolute inset-x-0 top-2 flex justify-center">
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

// The backdrop alone is ~285 animated nodes; without this the arena reconciled
// them on every parent render.
export default memo(BattleArena);
