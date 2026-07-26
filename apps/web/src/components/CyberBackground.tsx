/* Global fixed backdrop: flat deep-space bg + faint cyan dot grid.
   GEEK PROTOCOL brand rule: flat solid fills only — no gradients, no blur, no glow. */
export function CyberBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[var(--gp-bg)]" aria-hidden="true">
      {/* Faint cyan dot-grid texture (SVG tile at ~5% opacity) */}
      <div className="gp-dot-grid" />

      {/* Sparse flat accent dots — solid fills, twinkle via opacity only */}
      <div className="starfield-star absolute h-1 w-1 rounded-full bg-[var(--gp-cyan)]" style={{ top: "18%", left: "12%", animationDuration: "3.2s, 14s" }} />
      <div className="starfield-star absolute h-1 w-1 rounded-full bg-[var(--gp-white)]" style={{ top: "9%", left: "64%", animationDuration: "4.1s, 18s", animationDelay: "-1.2s, 0s" }} />
      <div className="starfield-star absolute h-1.5 w-1.5 rounded-full bg-[var(--gp-pink)]" style={{ top: "38%", left: "86%", animationDuration: "3.6s, 16s", animationDelay: "-2s, 0s" }} />
      <div className="starfield-star absolute h-1 w-1 rounded-full bg-[var(--gp-violet)]" style={{ top: "62%", left: "28%", animationDuration: "4.4s, 20s", animationDelay: "-0.6s, 0s" }} />
      <div className="starfield-star absolute h-1 w-1 rounded-full bg-[var(--gp-white)]" style={{ top: "78%", left: "72%", animationDuration: "3.9s, 15s", animationDelay: "-2.8s, 0s" }} />
      <div className="starfield-star absolute h-1.5 w-1.5 rounded-full bg-[var(--gp-cyan)]" style={{ top: "86%", left: "8%", animationDuration: "3.4s, 17s", animationDelay: "-1.6s, 0s" }} />
    </div>
  );
}
