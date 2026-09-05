"use client";

import { useEffect } from "react";
import { ALL_SPRITES } from "@/lib/battle/sprites";

/**
 * Warm every pose before it is needed.
 *
 * A hit frame that arrives a beat late lands after the damage number, which
 * reads as a bug rather than a punch. Twenty-two WebP frames are ~1.4MB total,
 * so it is cheaper to fetch them all once at the intro than to stall mid-fight.
 */
export default function SpritePreloader() {
  useEffect(() => {
    const images = ALL_SPRITES.map((src) => {
      const img = new window.Image();
      img.decoding = "async";
      img.src = src;
      return img;
    });
    return () => {
      for (const img of images) img.src = "";
    };
  }, []);

  return null;
}
