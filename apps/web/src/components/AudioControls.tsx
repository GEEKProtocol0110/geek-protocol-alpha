"use client";

import { useSyncExternalStore } from "react";
import { FaVolumeUp, FaVolumeMute, FaMusic } from "react-icons/fa";
import { isSfxMuted, toggleSfxMuted, playSfx, AUDIO_PREFS_EVENT } from "@/lib/sfx";
import { isMusicMuted, toggleMusicMuted, startMusic, stopMusic, isMusicPlaying } from "@/lib/music";

/**
 * Two independent mutes: effects and music.
 *
 * Separate rather than one master control because they annoy different people —
 * plenty of players want the music off but the "correct!" chime on, and a
 * talking AI is the first thing someone in a shared room turns off. Choices
 * persist in localStorage.
 */
export function AudioControls({ className = "" }: { className?: string }) {
  // Preferences live in localStorage (outside React), so they're read through
  // useSyncExternalStore. The server snapshot is always "on", which keeps
  // hydration stable regardless of what the visitor previously chose.
  const sfxOff = useAudioPref(isSfxMuted);
  const musicOff = useAudioPref(isMusicMuted);

  const btn =
    "flex items-center justify-center w-9 h-9 rounded-full border-2 border-[var(--ink)] transition";
  const on = "bg-[var(--gp-cyan)] text-[var(--ink)]";
  const off = "bg-[var(--surface-2)] text-[var(--text-3)]";

  return (
    <div className={`flex items-center gap-2 ${className}`} role="group" aria-label="Audio settings">
      <button
        type="button"
        onClick={() => {
          const nowMuted = toggleSfxMuted();
          if (nowMuted) {
            stopMusic();
          } else {
            playSfx("click");
          }
        }}
        aria-pressed={!sfxOff}
        aria-label={sfxOff ? "Turn sound effects on" : "Turn sound effects off"}
        title={sfxOff ? "Effects off" : "Effects on"}
        className={`${btn} ${sfxOff ? off : on}`}
      >
        {sfxOff ? <FaVolumeMute /> : <FaVolumeUp />}
      </button>

      <button
        type="button"
        onClick={() => {
          const nowMuted = toggleMusicMuted();
          // Toggling on mid-quiz should start the track immediately — this
          // click is the user gesture browsers require to allow playback.
          if (!nowMuted && !isMusicPlaying()) startMusic();
        }}
        aria-pressed={!musicOff}
        aria-label={musicOff ? "Turn music on" : "Turn music off"}
        title={musicOff ? "Music off" : "Music on"}
        className={`${btn} ${musicOff ? off : on}`}
      >
        <FaMusic />
      </button>

    </div>
  );
}

/** Subscribes a boolean audio preference to the shared change event. */
function useAudioPref(read: () => boolean): boolean {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener(AUDIO_PREFS_EVENT, onChange);
      return () => window.removeEventListener(AUDIO_PREFS_EVENT, onChange);
    },
    read,
    () => false
  );
}

/** No-op subscribe for values that never change after load. */
function subscribeNoop() {
  return () => {};
}
