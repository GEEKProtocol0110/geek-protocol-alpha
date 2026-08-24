"use client";

import { useEffect, useRef, useState } from "react";

/** Fixed top progress bar: 0-100 based on how far the page has scrolled. */
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        setProgress(max > 0 ? Math.min(100, (doc.scrollTop / max) * 100) : 0);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return progress;
}

/** Counts up from 0 to `end` once the element scrolls into view. */
export function useCountUp<T extends HTMLElement>(end: number, opts: { duration?: number; decimals?: number } = {}) {
  const { duration = 1400, decimals = 0 } = opts;
  const ref = useRef<T>(null);
  // Start AT the final value, not at zero.
  //
  // Seeding this with 0 meant the server-rendered HTML said "0 categories",
  // "0 questions" and "0-second timer" — which is what search engines,
  // accessibility tools and any visitor without JavaScript actually saw. The
  // animation now begins only once the element is on screen in a real browser,
  // and it rewinds to 0 at that moment rather than shipping a zero as the
  // page's factual content.
  const [value, setValue] = useState(end);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Respect the OS motion preference: no rewind, no animation, final value.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(end);
      return;
    }

    // Only now, with JavaScript running, is it safe to show a transient zero.
    setValue(0);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
            setValue(end * eased);
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          observer.unobserve(node);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.unobserve(node);
  }, [end, duration]);

  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();
  return { ref, formatted };
}

/** Gentle scroll-linked parallax offset for a single element. */
export function useParallax<T extends HTMLElement>(speed = 0.15) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let ticking = false;

    const update = () => {
      const rect = node.getBoundingClientRect();
      const centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
      node.style.transform = `translateY(${(-centerOffset * speed).toFixed(1)}px)`;
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [speed]);

  return ref;
}

/** 3D pointer-tilt for a card - flat design, so this reads as a "trading card" tilt, not a glow. */
export function useTilt<T extends HTMLElement>(maxDeg = 8) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const onMove = (e: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      node.style.transform = `perspective(700px) rotateX(${(-py * maxDeg).toFixed(2)}deg) rotateY(${(px * maxDeg).toFixed(2)}deg) translateZ(0)`;
    };
    const onLeave = () => {
      node.style.transform = "perspective(700px) rotateX(0deg) rotateY(0deg)";
    };

    node.addEventListener("mousemove", onMove);
    node.addEventListener("mouseleave", onLeave);
    return () => {
      node.removeEventListener("mousemove", onMove);
      node.removeEventListener("mouseleave", onLeave);
    };
  }, [maxDeg]);

  return ref;
}

/** Subtle magnetic pull toward the cursor - classic tasteful web3 button micro-interaction. */
export function useMagnetic<T extends HTMLElement>(strength = 0.3) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const onMove = (e: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * strength;
      const y = (e.clientY - rect.top - rect.height / 2) * strength;
      node.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    };
    const onLeave = () => {
      node.style.transform = "translate(0, 0)";
    };

    node.addEventListener("mousemove", onMove);
    node.addEventListener("mouseleave", onLeave);
    return () => {
      node.removeEventListener("mousemove", onMove);
      node.removeEventListener("mouseleave", onLeave);
    };
  }, [strength]);

  return ref;
}
