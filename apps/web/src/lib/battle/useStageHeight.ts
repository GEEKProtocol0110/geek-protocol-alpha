"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The stage never compresses below this. On a small phone the alpha banner —
 * which is a required disclosure and stays — can eat a third of the screen,
 * leaving too little to show the fighters and four answers at once. Rather
 * than trap the answers in a scrolling sliver, the stage keeps a workable
 * height and the page scrolls the banner away instead. Capped at the viewport,
 * so the stage is never taller than the screen it has to fit in.
 */
const COMFORTABLE_STAGE_PX = 560;

/**
 * Height that makes an element reach the bottom of the viewport.
 *
 * The battle stage sits under different amounts of chrome depending on where it
 * is mounted — nothing on the standalone route, the alpha banner plus the
 * navbar on the daily quiz — so the offset has to be measured rather than
 * assumed. `100dvh` alone overflows by exactly the height of whatever is above.
 *
 * Two details this got wrong before, both worth keeping:
 *
 *  - The offset is measured against the *document*, not the viewport. A
 *    viewport-relative `top` goes negative once the page is scrolled, which
 *    inflates the height, which creates more scroll — a feedback loop that left
 *    the stage taller than the screen.
 *
 *  - The node is tracked with a callback ref rather than an object ref. The
 *    stage mounts later than this hook (the intro screen renders first), so a
 *    mount-time effect measured a null node and never corrected itself.
 */
export function useStageHeight<T extends HTMLElement>() {
  const nodeRef = useRef<T | null>(null);
  const [stageHeight, setHeight] = useState<number | null>(null);

  const measure = useCallback(() => {
    const el = nodeRef.current;
    if (!el) return;
    const offsetFromDocumentTop = el.getBoundingClientRect().top + window.scrollY;
    const viewport = window.visualViewport?.height ?? window.innerHeight;
    const available = Math.round(viewport - offsetFromDocumentTop);
    const floor = Math.min(viewport, COMFORTABLE_STAGE_PX);
    setHeight(Math.max(available, floor));
  }, []);

  const frameRef = useRef(0);
  const measureSoon = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    // Next frame, so the chrome above has finished wrapping to its real height.
    frameRef.current = requestAnimationFrame(measure);
  }, [measure]);

  const scrolledRef = useRef(false);

  /** Fires the moment the stage element attaches or detaches. */
  const stageRef = useCallback(
    (node: T | null) => {
      nodeRef.current = node;
      if (!node) return;
      measureSoon();
      // Bring the fight to the top of the screen once, when it starts. On a
      // short phone this scrolls the banner out of the way so the arena and the
      // answers fill the viewport; on a roomy screen it is already a no-op.
      if (!scrolledRef.current) {
        scrolledRef.current = true;
        // Two frames, and instant rather than smooth: applying the stage height
        // shifts the page underneath a smooth scroll and leaves it stranded
        // part-way, which put the last answers back under the fold.
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            const el = nodeRef.current;
            if (!el) return;
            const top = el.getBoundingClientRect().top + window.scrollY;
            if (top > 4) window.scrollTo({ top, behavior: "auto" });
          })
        );
      }
    },
    [measureSoon]
  );

  useEffect(() => {
    const ro = new ResizeObserver(measureSoon);
    ro.observe(document.documentElement);
    if (document.body) ro.observe(document.body);

    window.addEventListener("resize", measureSoon);
    window.addEventListener("orientationchange", measureSoon);
    window.visualViewport?.addEventListener("resize", measureSoon);

    const frames = frameRef;
    return () => {
      cancelAnimationFrame(frames.current);
      ro.disconnect();
      window.removeEventListener("resize", measureSoon);
      window.removeEventListener("orientationchange", measureSoon);
      window.visualViewport?.removeEventListener("resize", measureSoon);
    };
  }, [measureSoon]);

  return { stageRef, stageHeight };
}
