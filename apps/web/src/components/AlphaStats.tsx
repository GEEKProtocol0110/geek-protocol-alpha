"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

interface Stats {
  players: number;
  activePlayersToday: number;
  quizAttempts: number;
  attemptsToday: number;
  approvedQuestions: number;
  pendingReview: number;
  totalReviews: number;
  gauntletRuns: number;
  rewardsConfirmed: number;
  topicCount: number;
  geekDistributed: number;
  generatedAt: string;
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Subscribes to the OS motion preference without setting state in an effect. */
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCED_MOTION_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false // server snapshot
  );
}

/** Counts up to the target once the tile scrolls into view. */
function useCountUp(target: number, active: boolean, durationMs = 900) {
  const [value, setValue] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!active || reducedMotion) return;

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // easeOutCubic
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, durationMs, reducedMotion]);

  // With reduced motion the final number is shown immediately rather than
  // animated, so the value is derived rather than pushed through state.
  if (reducedMotion) return active ? target : 0;
  return value;
}

function StatTile({
  label,
  value,
  suffix = "",
  active,
  hint,
}: {
  label: string;
  value: number;
  suffix?: string;
  active: boolean;
  hint?: string;
}) {
  const shown = useCountUp(value, active);
  return (
    <div className="flat-card p-6">
      <div className="text-3xl md:text-4xl font-extrabold text-[var(--brand-primary)] tabular-nums">
        {shown.toLocaleString()}
        {suffix}
      </div>
      <div className="text-sm font-semibold text-[var(--text-1)] mt-2">{label}</div>
      {hint && <div className="text-xs text-[var(--text-3)] mt-1">{hint}</div>}
    </div>
  );
}

/**
 * Live alpha telemetry, read from /api/stats/alpha.
 *
 * These are real aggregates. When the alpha is quiet the tiles show small
 * numbers rather than flattering ones — a page that asks people to connect a
 * crypto wallet has to be the kind of page that tells the truth about its own
 * traction.
 */
export default function AlphaStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`${API}/api/stats/alpha`);
        const json = await res.json();
        if (cancelled) return;
        if (!json?.success) throw new Error("bad payload");
        setStats(json.data);
        setState("ready");
      } catch {
        if (!cancelled) setState("unavailable");
      }
    };

    load();
    // Refresh while the page is open so a tournament shows movement.
    const iv = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [stats]);

  return (
    <div ref={ref}>
      {state === "loading" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flat-card p-6">
              <div className="h-9 w-24 bg-[var(--surface-2)] animate-pulse rounded" />
              <div className="h-4 w-32 bg-[var(--surface-2)] animate-pulse rounded mt-3" />
            </div>
          ))}
        </div>
      )}

      {state === "unavailable" && (
        <div className="flat-card p-6 text-center">
          <p className="text-[var(--text-2)]">
            Live alpha stats are temporarily unavailable.
          </p>
          <p className="text-xs text-[var(--text-3)] mt-1">
            The numbers here are read live from the alpha database — we&apos;d rather show
            nothing than show made-up figures.
          </p>
        </div>
      )}

      {state === "ready" && stats && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatTile label="Registered players" value={stats.players} active={visible} />
            <StatTile
              label="Quiz attempts played"
              value={stats.quizAttempts}
              active={visible}
              hint={`${stats.attemptsToday.toLocaleString()} in the last 24h`}
            />
            <StatTile
              label="Community questions live"
              value={stats.approvedQuestions}
              active={visible}
              hint={`${stats.pendingReview.toLocaleString()} awaiting peer review`}
            />
            <StatTile
              label="GEEK distributed"
              value={Math.round(stats.geekDistributed)}
              active={visible}
              hint={`${stats.rewardsConfirmed.toLocaleString()} payouts confirmed`}
            />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            <StatTile label="Active in last 24h" value={stats.activePlayersToday} active={visible} />
            <StatTile label="Gauntlet runs" value={stats.gauntletRuns} active={visible} />
            <StatTile label="Peer reviews cast" value={stats.totalReviews} active={visible} />
            <StatTile label="Topics in rotation" value={stats.topicCount} active={visible} />
          </div>

          <p className="text-xs text-[var(--text-3)] text-center mt-6">
            Live from the alpha database · refreshed every 60s · last read{" "}
            <time dateTime={stats.generatedAt}>
              {new Date(stats.generatedAt).toLocaleTimeString()}
            </time>
          </p>
        </>
      )}
    </div>
  );
}
