/**
 * Collects coarse interaction statistics during an attempt.
 *
 * Only aggregates leave the browser — sample counts, total path length, interval
 * variance. No coordinates, no timestamps, no keystroke content, nothing that
 * could reconstruct what the player did or typed.
 *
 * The server treats the result as advisory (see behaviorScore.ts): it flags an
 * attempt for review, it never withholds a payout, because these numbers are
 * client-reported and therefore forgeable.
 */

export interface BehaviorSignals {
  pointerSamples: number;
  pointerPathLength: number;
  pointerNetDisplacement: number;
  pointerIntervalStdDev: number;
  directionChanges: number;
  keyboardEvents: number;
  touchEvents: number;
  visibilityChanges: number;
  canvasRendered: boolean;
  inputModality: "mouse" | "touch" | "keyboard" | "unknown";
}

export function createBehaviorTracker() {
  let samples = 0;
  let pathLength = 0;
  let keyboardEvents = 0;
  let touchEvents = 0;
  let visibilityChanges = 0;
  let directionChanges = 0;
  let canvasRendered = false;

  let firstX: number | null = null;
  let firstY: number | null = null;
  let lastX: number | null = null;
  let lastY: number | null = null;
  let lastDx = 0;
  let lastDy = 0;
  let lastT: number | null = null;

  // Welford's online variance — keeps memory constant regardless of attempt length.
  let n = 0;
  let mean = 0;
  let m2 = 0;

  let modality: BehaviorSignals["inputModality"] = "unknown";

  const onPointerMove = (e: PointerEvent) => {
    // Touch and pen also raise pointer events; record the modality so the server
    // knows not to expect mouse-like jitter from them.
    if (modality === "unknown") {
      modality = e.pointerType === "touch" || e.pointerType === "pen" ? "touch" : "mouse";
    }

    const now = performance.now();
    if (lastX !== null && lastY !== null) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      pathLength += Math.hypot(dx, dy);

      // A direction reversal on either axis — humans overshoot and correct.
      if ((dx !== 0 && Math.sign(dx) !== Math.sign(lastDx) && lastDx !== 0) ||
          (dy !== 0 && Math.sign(dy) !== Math.sign(lastDy) && lastDy !== 0)) {
        directionChanges++;
      }
      if (dx !== 0) lastDx = dx;
      if (dy !== 0) lastDy = dy;
    } else {
      firstX = e.clientX;
      firstY = e.clientY;
    }

    if (lastT !== null) {
      const interval = now - lastT;
      n++;
      const delta = interval - mean;
      mean += delta / n;
      m2 += delta * (interval - mean);
    }

    lastX = e.clientX;
    lastY = e.clientY;
    lastT = now;
    samples++;
  };

  const onKeyDown = () => {
    keyboardEvents++;
    if (modality === "unknown") modality = "keyboard";
  };
  const onTouchStart = () => {
    touchEvents++;
    modality = "touch";
  };
  const onVisibility = () => {
    visibilityChanges++;
  };

  const start = () => {
    if (typeof window === "undefined") return;
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("keydown", onKeyDown, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
  };

  const stop = () => {
    if (typeof window === "undefined") return;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("touchstart", onTouchStart);
    document.removeEventListener("visibilitychange", onVisibility);
  };

  const markCanvasRendered = (ok: boolean) => {
    canvasRendered = canvasRendered || ok;
  };

  const snapshot = (): BehaviorSignals => {
    const netDisplacement =
      firstX !== null && firstY !== null && lastX !== null && lastY !== null
        ? Math.hypot(lastX - firstX, lastY - firstY)
        : 0;

    return {
      pointerSamples: samples,
      pointerPathLength: Math.round(pathLength),
      pointerNetDisplacement: Math.round(netDisplacement),
      pointerIntervalStdDev: n > 1 ? Math.sqrt(m2 / (n - 1)) : 0,
      directionChanges,
      keyboardEvents,
      touchEvents,
      visibilityChanges,
      canvasRendered,
      inputModality: modality,
    };
  };

  return { start, stop, snapshot, markCanvasRendered };
}
