"use client";

/**
 * The arena stage.
 *
 * Built in depth layers so the fight has somewhere to happen: far starfield,
 * a nebula massed from flat translucent polygons (no gradients — the brand
 * bans them, and stacked flat shapes at low opacity give the same volume),
 * a ringed planet, a derelict station on the horizon, then the deck the
 * fighters stand on with a perspective grid, and finally debris drifting
 * across the front of frame.
 *
 * Everything is decorative and `aria-hidden`; nothing here competes with the
 * question panel below it.
 */

import { memo } from "react";
import { Starfield } from "@/components/Starfield";

function ArenaBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Deep space ground colour */}
      <div className="absolute inset-0" style={{ background: "var(--surface-0)" }} />

      {/* Far stars */}
      <Starfield density={0.28} />
      <div className="gp-dot-grid" />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 800 300"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* ── Nebula: flat polygons stacked at low opacity ── */}
        <g opacity="0.5">
          <path d="M-40 40 L180 -10 L300 70 L150 130 L20 110 Z" fill="#171a3a" />
          <path d="M20 55 L170 20 L250 80 L120 118 Z" fill="#1d2049" opacity="0.9" />
          <path d="M560 -20 L780 10 L840 110 L640 130 L520 60 Z" fill="#1a1636" />
          <path d="M600 10 L760 30 L800 100 L660 112 Z" fill="#211b45" opacity="0.9" />
        </g>

        {/* ── Ringed planet ── */}
        <g className="bf-bg-far">
          <circle cx="655" cy="78" r="62" fill="#1e2144" stroke="#0d0f24" strokeWidth="2" />
          {/* hard terminator — a flat crescent, not a gradient */}
          <path d="M655 16 a62 62 0 0 1 0 124 a44 62 0 0 0 0 -124 z" fill="#141733" />
          <ellipse cx="655" cy="78" rx="96" ry="16" fill="none" stroke="#2b2f5e" strokeWidth="7" opacity="0.85" />
          <ellipse cx="655" cy="78" rx="112" ry="20" fill="none" stroke="#232750" strokeWidth="4" opacity="0.6" />
          <circle cx="632" cy="58" r="12" fill="#262a52" />
          <circle cx="672" cy="96" r="7" fill="#262a52" />
        </g>

        {/* ── Derelict station on the horizon ── */}
        <g className="bf-bg-mid" opacity="0.9">
          <rect x="96" y="150" width="54" height="34" fill="#161936" stroke="#0d0f24" strokeWidth="2" />
          <rect x="112" y="132" width="22" height="20" fill="#1b1f3f" stroke="#0d0f24" strokeWidth="2" />
          <rect x="80" y="160" width="16" height="10" fill="#1b1f3f" stroke="#0d0f24" strokeWidth="2" />
          <rect x="150" y="160" width="16" height="10" fill="#1b1f3f" stroke="#0d0f24" strokeWidth="2" />
          <rect x="118" y="120" width="4" height="14" fill="#0d0f24" />
          <circle cx="120" cy="118" r="3" fill="var(--gp-pink)" opacity="0.9" />
          <rect x="104" y="158" width="6" height="5" fill="var(--gp-cyan)" opacity="0.7" />
          <rect x="126" y="158" width="6" height="5" fill="var(--gp-cyan)" opacity="0.5" />
        </g>

        {/* ── Deck: the surface the fighters stand on ── */}
        <g>
          <rect x="0" y="228" width="800" height="72" fill="#0b0d1e" />
          <rect x="0" y="228" width="800" height="3" fill="#2b3160" />
          <rect x="0" y="231" width="800" height="2" fill="var(--gp-cyan)" opacity="0.35" />
          {/* perspective grid — lines converging toward the vanishing point */}
          <g stroke="#1b2044" strokeWidth="1.5" opacity="0.85">
            {[-360, -260, -170, -95, -35, 25, 85, 155, 245, 355, 480].map((dx, i) => (
              <line key={i} x1={400 + dx * 0.18} y1="231" x2={400 + dx * 2.2} y2="300" />
            ))}
          </g>
          <g stroke="#1b2044" strokeWidth="1.5" opacity="0.7">
            <line x1="0" y1="244" x2="800" y2="244" />
            <line x1="0" y1="262" x2="800" y2="262" />
            <line x1="0" y1="286" x2="800" y2="286" />
          </g>
          {/* deck edge lights */}
          {[70, 250, 430, 610, 760].map((x) => (
            <rect key={x} x={x} y="234" width="16" height="3" fill="var(--gp-cyan)" opacity="0.5" />
          ))}
        </g>
      </svg>

      {/* ── Foreground debris drifting across frame ── */}
      <div className="absolute inset-0">
        {[
          { top: "18%", left: "12%", size: 7, dur: 21, delay: 0, color: "var(--gp-cyan)" },
          { top: "62%", left: "78%", size: 5, dur: 27, delay: 4, color: "var(--gp-pink)" },
          { top: "34%", left: "46%", size: 4, dur: 24, delay: 9, color: "var(--gp-violet)" },
          { top: "12%", left: "66%", size: 6, dur: 30, delay: 2, color: "var(--gp-cyan)" },
          { top: "72%", left: "26%", size: 5, dur: 19, delay: 6, color: "var(--gp-gold)" },
        ].map((d, i) => (
          <span
            key={i}
            className="bf-debris absolute block"
            style={{
              top: d.top,
              left: d.left,
              width: d.size,
              height: d.size,
              background: d.color,
              opacity: 0.5,
              animationDuration: `${d.dur}s`,
              animationDelay: `${d.delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(ArenaBackdrop);
