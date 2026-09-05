"use client";

import { useEffect, useRef } from "react";

/**
 * The question clock, drawn without re-rendering React.
 *
 * The bar drains with a CSS animation and the readout is written straight to
 * the DOM on a 10Hz interval. The previous version pushed a state update every
 * animation frame, which re-rendered the whole battle — backdrop starfield,
 * both sprites, the HUD and all four answers — sixty times a second. That was
 * the stutter.
 */
interface Props {
  durationMs: number;
  /** Changing this restarts the drain. */
  runKey: number | string;
  /** Freezes the bar once the answer is committed. */
  paused?: boolean;
}

export default function TimerBar({ durationMs, runKey, paused = false }: Props) {
  const fillRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const deadlineRef = useRef(0);

  useEffect(() => {
    deadlineRef.current = performance.now() + durationMs;

    const fill = fillRef.current;
    if (fill) {
      // Restart the CSS animation without remounting anything.
      fill.style.animation = "none";
      void fill.offsetHeight;
      fill.style.animation = "";
      fill.style.animationDuration = `${durationMs}ms`;
      fill.style.animationPlayState = "running";
    }

    const write = () => {
      const left = Math.max(0, deadlineRef.current - performance.now());
      if (labelRef.current) labelRef.current.textContent = `${(left / 1000).toFixed(1)}s`;
    };
    write();
    const id = window.setInterval(write, 100);
    return () => window.clearInterval(id);
  }, [durationMs, runKey]);

  useEffect(() => {
    const fill = fillRef.current;
    if (fill) fill.style.animationPlayState = paused ? "paused" : "running";
  }, [paused]);

  return (
    <div className="bf-panel-timer mb-2 flex items-center gap-2 sm:mb-3 sm:gap-3">
      <div
        className="h-3 flex-1 overflow-hidden border-2"
        style={{ borderColor: "var(--ink)", background: "var(--surface-3)" }}
      >
        <div ref={fillRef} className="bf-timer-drain h-full w-full" />
      </div>
      <span ref={labelRef} className="gp-pixel w-12 text-right text-[10px] text-[var(--gp-cyan)]" />
    </div>
  );
}
