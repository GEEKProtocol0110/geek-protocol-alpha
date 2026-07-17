"use client";

import { useState } from "react";
import { FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import { isSfxMuted, toggleSfxMuted } from "@/lib/sfx";

export function SfxToggle({ className = "" }: { className?: string }) {
  const [muted, setMuted] = useState(() => (typeof window !== "undefined" ? isSfxMuted() : false));

  return (
    <button
      type="button"
      onClick={() => setMuted(toggleSfxMuted())}
      aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
      title={muted ? "Sound off" : "Sound on"}
      className={`flex items-center justify-center w-9 h-9 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-2)] transition ${className}`}
    >
      {muted ? <FaVolumeMute /> : <FaVolumeUp />}
    </button>
  );
}
