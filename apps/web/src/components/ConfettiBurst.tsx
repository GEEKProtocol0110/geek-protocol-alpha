"use client";

/**
 * One-shot confetti burst for a correct answer.
 *
 * Positions are a fixed table rather than randomised so server and client render
 * identically — a random scatter would differ across hydration. Flat fills and
 * a plain transform animation only: no gradients, no blur.
 */

const SPECKS = [
  { left: "18%", top: "62%", color: "var(--gp-cyan)",   dx: "-70px",  dy: "-90px",  rot: "180deg",  round: false },
  { left: "24%", top: "58%", color: "var(--gp-gold)",   dx: "-30px",  dy: "-120px", rot: "-140deg", round: true  },
  { left: "31%", top: "66%", color: "var(--gp-pink)",   dx: "20px",   dy: "-110px", rot: "220deg",  round: false },
  { left: "38%", top: "60%", color: "var(--gp-violet)", dx: "60px",   dy: "-95px",  rot: "-90deg",  round: true  },
  { left: "45%", top: "68%", color: "var(--gp-cyan)",   dx: "95px",   dy: "-70px",  rot: "160deg",  round: false },
  { left: "52%", top: "62%", color: "var(--gp-gold)",   dx: "-90px",  dy: "-60px",  rot: "-200deg", round: true  },
  { left: "27%", top: "72%", color: "var(--gp-pink)",   dx: "-45px",  dy: "-140px", rot: "120deg",  round: false },
  { left: "34%", top: "55%", color: "var(--gp-violet)", dx: "70px",   dy: "-130px", rot: "-160deg", round: true  },
  { left: "42%", top: "70%", color: "var(--gp-cyan)",   dx: "-110px", dy: "-80px",  rot: "240deg",  round: false },
  { left: "20%", top: "68%", color: "var(--gp-gold)",   dx: "40px",   dy: "-150px", rot: "-110deg", round: true  },
  { left: "48%", top: "56%", color: "var(--gp-pink)",   dx: "110px",  dy: "-100px", rot: "200deg",  round: false },
  { left: "36%", top: "64%", color: "var(--gp-cyan)",   dx: "-15px",  dy: "-160px", rot: "-180deg", round: true  },
  { left: "62%", top: "60%", color: "var(--gp-violet)", dx: "80px",   dy: "-120px", rot: "150deg",  round: false },
  { left: "70%", top: "66%", color: "var(--gp-gold)",   dx: "50px",   dy: "-90px",  rot: "-130deg", round: true  },
];

export function ConfettiBurst({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {SPECKS.map((c, i) => (
        <span
          key={i}
          className="q-confetti"
          style={{
            left: c.left,
            top: c.top,
            background: c.color,
            borderRadius: c.round ? "999px" : "2px",
            ["--dx" as string]: c.dx,
            ["--dy" as string]: c.dy,
            ["--rot" as string]: c.rot,
            animationDelay: `${i * 18}ms`,
          }}
        />
      ))}
    </div>
  );
}
