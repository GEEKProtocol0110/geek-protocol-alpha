"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renders question text into a canvas instead of selectable DOM text, with
 * per-render randomised baseline jitter, letter spacing and background noise so
 * naive screen-scrapers can't just read `textContent`.
 *
 * On what this does and doesn't buy you: canvas raises the cost of a trivial
 * scraper, but it is the same glyphs in the end and off-the-shelf OCR reads it
 * without much trouble. It is a speed bump, not a wall — the load-bearing
 * defences are that correct answers never reach the client at all, that options
 * are shuffled per attempt, and that scoring and timing are validated server
 * side.
 *
 * Accessibility is not negotiable, so the real text is always present for
 * assistive technology via an aria-label plus a visually-hidden copy, and the
 * component falls back to plain text if canvas is unavailable. That does mean a
 * determined scraper can read the accessible text — which is the correct
 * trade-off. Excluding screen reader users to inconvenience bots is not.
 */

interface Props {
  text: string;
  /** Bump to force a re-render with fresh jitter (e.g. the question index). */
  seed?: number | string;
  className?: string;
  onRendered?: (ok: boolean) => void;
}

const FONT_FAMILY = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

/**
 * Type scale by available width.
 *
 * This used to be a flat 20px/32px at every size, which on a 390px phone turned
 * a long question into six lines and 224px of canvas — enough to push the
 * answer buttons off the screen. The prompt now scales with the space it has.
 */
function metricsFor(width: number, viewportHeight = Number.POSITIVE_INFINITY) {
  // A short viewport is as constraining as a narrow one: on a phone held
  // sideways there is plenty of width and almost no height.
  if (width < 400 || viewportHeight < 560) return { fontPx: 15, lineHeight: 21, pad: 10 };
  if (width < 640) return { fontPx: 17, lineHeight: 25, pad: 12 };
  return { fontPx: 20, lineHeight: 32, pad: 16 };
}

const DEFAULT_METRICS = metricsFor(640, 900);

export default function CanvasQuestion({ text, seed = 0, className = "", onRendered }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [height, setHeight] = useState(
    DEFAULT_METRICS.lineHeight * 2 + DEFAULT_METRICS.pad * 2
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setFailed(true);
      onRendered?.(false);
      return;
    }

    const draw = () => {
      const cssWidth = wrap.clientWidth || 600;
      const { fontPx, lineHeight: LINE_HEIGHT, pad: PAD } = metricsFor(cssWidth, window.innerHeight);
      const FONT_STACK = `700 ${fontPx}px ${FONT_FAMILY}`;
      const dpr = window.devicePixelRatio || 1;

      // Resolve theme colours from the design tokens so the canvas matches the
      // surrounding card in both light and dark.
      const styles = getComputedStyle(document.documentElement);
      const fg = styles.getPropertyValue("--text-1").trim() || "#111111";
      const muted = styles.getPropertyValue("--text-3").trim() || "#888888";

      ctx.font = FONT_STACK;

      // Word-wrap against the measured canvas width.
      const words = text.split(/\s+/);
      const lines: string[] = [];
      let line = "";
      const maxWidth = cssWidth - PAD * 2;
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (ctx.measureText(candidate).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = candidate;
        }
      }
      if (line) lines.push(line);

      const cssHeight = lines.length * LINE_HEIGHT + PAD * 2;
      setHeight(cssHeight);

      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      // Flat noise speckle — brand rules ban gradients and blur, so this is
      // plain low-alpha dots that vary every render.
      ctx.fillStyle = muted;
      for (let i = 0; i < 90; i++) {
        ctx.globalAlpha = 0.05 + Math.random() * 0.06;
        ctx.fillRect(Math.random() * cssWidth, Math.random() * cssHeight, 2, 2);
      }
      ctx.globalAlpha = 1;

      // Draw glyph by glyph with per-character jitter so the rendering is never
      // byte-identical between two attempts at the same question.
      ctx.font = FONT_STACK;
      ctx.textBaseline = "middle";
      ctx.fillStyle = fg;

      lines.forEach((ln, li) => {
        let x = PAD + (Math.random() * 2 - 1);
        const baseY = PAD + li * LINE_HEIGHT + LINE_HEIGHT / 2;
        for (const ch of ln) {
          const jitterY = (Math.random() * 2 - 1) * 1.1;
          const jitterX = (Math.random() * 2 - 1) * 0.5;
          ctx.fillText(ch, x + jitterX, baseY + jitterY);
          x += ctx.measureText(ch).width + Math.random() * 0.6;
        }
      });

      onRendered?.(true);
    };

    try {
      draw();
    } catch {
      setFailed(true);
      onRendered?.(false);
      return;
    }

    const ro = new ResizeObserver(() => {
      try {
        draw();
      } catch {
        setFailed(true);
      }
    });
    ro.observe(wrap);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, seed]);

  // Fallback: if canvas is unavailable the question must still be playable.
  if (failed) {
    return (
      <h2 className={`text-xl md:text-2xl font-bold leading-relaxed text-[var(--text-1)] ${className}`}>
        {text}
      </h2>
    );
  }

  return (
    <div ref={wrapRef} className={`w-full ${className}`}>
      {/* The accessible name carries the real text for screen readers. */}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={text}
        style={{ height, display: "block", maxWidth: "100%" }}
      />
      <span className="sr-only">{text}</span>
    </div>
  );
}
