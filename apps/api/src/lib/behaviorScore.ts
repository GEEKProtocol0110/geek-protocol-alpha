import { z } from "zod";

/**
 * Scores the interaction telemetry the play client reports.
 *
 * Worth being honest about what this is and is not. Every signal here is
 * client-reported and therefore forgeable by anyone willing to synthesise
 * plausible numbers — it raises the cost of a naive bot, it does not stop a
 * determined one. It is a *signal*, never a gate: a low score flags an attempt
 * for review, it does not void a payout, because false positives here mean
 * refusing to pay legitimate players.
 *
 * Real protection comes from the server-side clock checks in antiCheat.ts and
 * from never sending answers to the client in the first place.
 */

export const BehaviorSignalsSchema = z.object({
  /** Distinct pointer samples observed during the attempt. */
  pointerSamples: z.number().int().min(0).max(100_000).default(0),
  /** Sum of segment lengths, px. Straight-line teleports keep this near zero. */
  pointerPathLength: z.number().min(0).max(10_000_000).default(0),
  /** Straight-line distance between first and last pointer position, px. */
  pointerNetDisplacement: z.number().min(0).max(1_000_000).default(0),
  /** Std-dev of inter-sample intervals, ms. Synthetic input is metronomic. */
  pointerIntervalStdDev: z.number().min(0).max(100_000).default(0),
  /** Direction changes — humans overshoot and correct. */
  directionChanges: z.number().int().min(0).max(100_000).default(0),
  keyboardEvents: z.number().int().min(0).max(100_000).default(0),
  touchEvents: z.number().int().min(0).max(100_000).default(0),
  /** Times the tab lost focus mid-attempt. */
  visibilityChanges: z.number().int().min(0).max(1000).default(0),
  /** Whether the client could render the canvas question at all. */
  canvasRendered: z.boolean().default(false),
  /** Set when the player is using assistive tech or a coarse pointer. */
  inputModality: z.enum(["mouse", "touch", "keyboard", "unknown"]).default("unknown"),
});

export type BehaviorSignals = z.infer<typeof BehaviorSignalsSchema>;

export interface BehaviorVerdict {
  /** 0-100. Higher is more human-like. Advisory only. */
  score: number;
  flags: string[];
  /** True when the attempt should be surfaced for manual review. */
  suspicious: boolean;
}

const SUSPICION_THRESHOLD = 35;

export function scoreBehavior(signals: BehaviorSignals): BehaviorVerdict {
  const flags: string[] = [];
  let score = 100;

  // Touch and keyboard players legitimately produce almost no pointer data.
  // Scoring them on mouse jitter would penalise mobile users and anyone
  // navigating by keyboard, so those modalities skip the pointer checks
  // entirely rather than being marked suspicious for how they play.
  const pointerRelevant =
    signals.inputModality === "mouse" ||
    (signals.inputModality === "unknown" && signals.touchEvents === 0 && signals.keyboardEvents === 0);

  if (pointerRelevant) {
    if (signals.pointerSamples < 10) {
      score -= 35;
      flags.push("almost_no_pointer_activity");
    }

    // A human hand never travels in a perfect straight line to a target. A path
    // whose length equals its net displacement is a synthetic jump.
    if (signals.pointerPathLength > 0) {
      const straightness = signals.pointerNetDisplacement / signals.pointerPathLength;
      if (straightness > 0.98 && signals.pointerSamples > 3) {
        score -= 30;
        flags.push("perfectly_straight_pointer_path");
      }
    }

    // Metronomic sampling intervals indicate generated events.
    if (signals.pointerSamples > 20 && signals.pointerIntervalStdDev < 1) {
      score -= 25;
      flags.push("metronomic_pointer_timing");
    }

    // Humans overshoot and correct constantly.
    if (signals.pointerSamples > 30 && signals.directionChanges === 0) {
      score -= 20;
      flags.push("no_direction_changes");
    }
  }

  if (!signals.canvasRendered) {
    // Not proof of anything on its own — headless renderers and some privacy
    // settings also land here — but it correlates with scripted clients.
    score -= 10;
    flags.push("canvas_not_rendered");
  }

  score = Math.max(0, Math.min(100, score));

  return { score, flags, suspicious: score < SUSPICION_THRESHOLD };
}
