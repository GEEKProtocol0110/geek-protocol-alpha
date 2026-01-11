"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { CSSProperties } from "react";

type StarStyle = CSSProperties & {
  "--drift-x"?: string;
  "--drift-y"?: string;
};

type ShootingStyle = CSSProperties & {
  "--shoot-dx"?: string;
  "--shoot-dy"?: string;
};

type LayerConfig = {
  id: string;
  count: number;
  size: [number, number];
  opacity: [number, number];
  blur: [number, number];
  twinkleDuration: [number, number];
  twinkleDelay: [number, number];
  driftDistance: [number, number];
  driftDuration: [number, number];
  colorClass: string;
  shadow: [number, number];
  shadowColor: string;
};

type StarInstance = {
  id: string;
  className: string;
  style: StarStyle;
};

type ShootingInstance = {
  id: string;
  style: ShootingStyle;
};

const STAR_LAYERS: LayerConfig[] = [
  {
    id: "far",
    count: 140,
    size: [0.6, 1.3],
    opacity: [0.25, 0.6],
    blur: [0.2, 0.6],
    twinkleDuration: [6, 10],
    twinkleDelay: [0, 6],
    driftDistance: [12, 30],
    driftDuration: [55, 90],
    colorClass: "bg-white/80",
    shadow: [0, 1],
    shadowColor: "rgba(255,255,255,0.35)",
  },
  {
    id: "mid",
    count: 90,
    size: [0.9, 2.2],
    opacity: [0.35, 0.85],
    blur: [0, 0.4],
    twinkleDuration: [4, 7],
    twinkleDelay: [0, 4],
    driftDistance: [20, 50],
    driftDuration: [35, 65],
    colorClass: "bg-teal-200/90",
    shadow: [1, 3],
    shadowColor: "rgba(34,197,94,0.35)",
  },
  {
    id: "near",
    count: 55,
    size: [1.4, 3.6],
    opacity: [0.55, 1],
    blur: [0, 0.2],
    twinkleDuration: [2, 4],
    twinkleDelay: [0, 3],
    driftDistance: [35, 90],
    driftDuration: [20, 40],
    colorClass: "bg-emerald-200",
    shadow: [2, 6],
    shadowColor: "rgba(34,197,94,0.6)",
  },
];

const SHOOTING_STAR_COUNT = 4;

function createRng(seedString: string) {
  let seed = 0;
  for (let i = 0; i < seedString.length; i += 1) {
    seed = (seed << 5) - seed + seedString.charCodeAt(i);
    seed |= 0;
  }
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const randomInRange = (rng: () => number, min: number, max: number) => min + rng() * (max - min);

const createStars = (rng: () => number, layer: LayerConfig, offset: number): StarInstance[] =>
  Array.from({ length: layer.count }, (_, index) => {
    const size = randomInRange(rng, layer.size[0], layer.size[1]);
    const top = randomInRange(rng, -5, 105);
    const left = randomInRange(rng, -5, 105);
    const opacity = randomInRange(rng, layer.opacity[0], layer.opacity[1]);
    const blur = randomInRange(rng, layer.blur[0], layer.blur[1]);
    const twinkleDuration = randomInRange(rng, layer.twinkleDuration[0], layer.twinkleDuration[1]);
    const twinkleDelay = randomInRange(rng, layer.twinkleDelay[0], layer.twinkleDelay[1]);
    const driftDistance = randomInRange(rng, layer.driftDistance[0], layer.driftDistance[1]);
    const driftDuration = randomInRange(rng, layer.driftDuration[0], layer.driftDuration[1]);
    const driftDelay = randomInRange(rng, 0, driftDuration);
    const angle = randomInRange(rng, 0, Math.PI * 2);
    const driftX = Math.cos(angle) * driftDistance;
    const driftY = Math.sin(angle) * driftDistance;
    const glow = randomInRange(rng, layer.shadow[0], layer.shadow[1]);

    const style: StarStyle = {
      width: `${size}px`,
      height: `${size}px`,
      top: `${top}%`,
      left: `${left}%`,
      opacity,
      animationDuration: `${twinkleDuration}s, ${driftDuration}s`,
      animationDelay: `${twinkleDelay}s, ${driftDelay}s`,
      filter: blur ? `blur(${blur}px)` : undefined,
      boxShadow: glow ? `0 0 ${glow}px ${layer.shadowColor}` : undefined,
    };

    (style as StarStyle)["--drift-x"] = `${driftX}px`;
    (style as StarStyle)["--drift-y"] = `${driftY}px`;

    return {
      id: `${layer.id}-${offset + index}`,
      className: `starfield-star absolute rounded-full ${layer.colorClass}`,
      style,
    };
  });

const createShootingStars = (rng: () => number): ShootingInstance[] =>
  Array.from({ length: SHOOTING_STAR_COUNT }, (_, index) => {
    const top = randomInRange(rng, 5, 60);
    const left = randomInRange(rng, 0, 100);
    const travel = randomInRange(rng, 180, 360);
    const angle = randomInRange(rng, -Math.PI / 3, Math.PI / 3);
    const dx = Math.cos(angle) * travel;
    const dy = Math.sin(angle) * travel;
    const duration = randomInRange(rng, 1.2, 2.4);
    const delay = randomInRange(rng, 2, 10);

    const style: ShootingStyle = {
      top: `${top}%`,
      left: `${left}%`,
      width: "2px",
      height: "2px",
      borderRadius: "9999px",
      animationDuration: `${duration}s`,
      animationDelay: `${delay}s`,
      boxShadow: "0 0 12px rgba(34,197,94,0.7), 0 0 30px rgba(6,182,212,0.45)",
      backgroundColor: "rgba(165, 243, 252, 0.95)",
    };

    (style as ShootingStyle)["--shoot-dx"] = `${dx}px`;
    (style as ShootingStyle)["--shoot-dy"] = `${dy}px`;

    return {
      id: `shooting-${index}`,
      style,
    };
  });

export function Starfield() {
  const [mounted, setMounted] = useState(false);
  const [shootingSeed, setShootingSeed] = useState(0);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const id = setInterval(() => setShootingSeed((s) => s + 1), 5000);
    return () => clearInterval(id);
  }, [mounted]);

  const seed = useId();
  const rng = useMemo(() => createRng(`${seed}-${mounted ? "client" : "ssr"}`), [seed, mounted]);

  const stars = useMemo(() => {
    if (!mounted) return [] as StarInstance[];
    let offset = 0;
    return STAR_LAYERS.flatMap((layer) => {
      const layerStars = createStars(rng, layer, offset);
      offset += layer.count;
      return layerStars;
    });
  }, [rng, mounted]);

  const shootingStars = useMemo(() => {
    if (!mounted) return [] as ShootingInstance[];
    return createShootingStars(() => Math.random());
  }, [mounted, shootingSeed]);

  return (
    <div className="pointer-events-none fixed inset-0 z-30 opacity-80 mix-blend-screen" aria-hidden="true">
      <div className="absolute inset-0 overflow-hidden">
        {stars.map((star) => (
          <span key={star.id} className={star.className} style={star.style} />
        ))}

        {shootingStars.map((star) => (
          <span key={star.id} className="absolute animate-shoot" style={star.style} />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-8 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl animate-pulse" />
        <div
          className="absolute bottom-16 left-12 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl animate-pulse"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-3xl animate-pulse"
          style={{ animationDelay: "3s" }}
        />
      </div>
    </div>
  );
}
