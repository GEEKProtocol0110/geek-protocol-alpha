"use client";

/**
 * The quiz AI's speaking voice.
 *
 * Uses the browser's built-in speech synthesis rather than shipping audio files:
 * no assets to host, works offline, and every line can be written in code. The
 * synthetic timbre is on-theme here — GIGA and ACE are robots, so sounding
 * synthesised is the point rather than a compromise.
 *
 * If you later record real voice acting, drop the clips in
 * /public/voice/<lineId>.mp3 and they take priority automatically — see
 * CLIP_BASE below. No call sites change.
 */

import { isSfxMuted, AUDIO_PREFS_EVENT } from "./sfx";

export type VoiceEvent =
  | "quizStart"
  | "correct"
  | "wrong"
  | "timeout"
  | "streak"
  | "finishStrong"
  | "finishWeak";

export type Character = "GIGA" | "ACE";

const STORAGE_KEY = "gp_voice_muted";
const CLIP_BASE = "/voice";

/** Short lines only — anything long talks over the next question. */
const LINES: Record<Character, Record<VoiceEvent, string[]>> = {
  GIGA: {
    quizStart: ["Systems online. Let's go!", "Alright, show me what you've got!", "Game on!"],
    correct: [
      "Nice one!",
      "You're on fire!",
      "Nailed it!",
      "Too easy for you!",
      "That's the one!",
      "Boom! Correct!",
    ],
    wrong: [
      "Ah, not this time.",
      "So close!",
      "Shake it off. Next one's yours.",
      "Ooh, tough break.",
      "Don't sweat it, keep going!",
    ],
    timeout: ["Out of time!", "Too slow — stay sharp!", "Clock got you that time."],
    streak: [
      "You're on a streak!",
      "Unstoppable!",
      "Combo climbing!",
      "Look at you go!",
    ],
    finishStrong: ["Outstanding run!", "That was seriously impressive!", "You crushed it!"],
    finishWeak: ["Good effort. Run it back!", "Not bad — try again tomorrow.", "Keep training!"],
  },
  ACE: {
    quizStart: ["Assessment initiated.", "Let's measure what you know.", "Beginning evaluation."],
    correct: [
      "Correct.",
      "Signal confirmed.",
      "Knowledge verified.",
      "Precisely right.",
      "Accuracy holding.",
    ],
    wrong: [
      "Incorrect.",
      "Not quite.",
      "That's a miss. Recalibrate.",
      "Negative. Moving on.",
    ],
    timeout: ["Time expired.", "No answer logged.", "Response window closed."],
    streak: ["Streak detected.", "Performance trending up.", "Consistency noted."],
    finishStrong: ["Exceptional result.", "Analysis complete. Impressive.", "High accuracy confirmed."],
    finishWeak: ["Assessment complete. Room to improve.", "Below target. Try again.", "Keep practising."],
  },
};

/** Per-character delivery. GIGA is hyped; ACE is measured. */
const DELIVERY: Record<Character, { rate: number; pitch: number }> = {
  GIGA: { rate: 1.12, pitch: 1.25 },
  ACE: { rate: 0.95, pitch: 0.8 },
};

let muted = false;
if (typeof window !== "undefined") {
  muted = window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function isVoiceMuted() {
  return muted;
}

export function setVoiceMuted(v: boolean) {
  muted = v;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    window.dispatchEvent(new Event(AUDIO_PREFS_EVENT));
    if (v) cancelVoice();
  }
}

export function toggleVoiceMuted() {
  setVoiceMuted(!muted);
  return muted;
}

export function voiceSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// ── Voice selection ─────────────────────────────────────────────────────────

let chosenVoice: SpeechSynthesisVoice | null = null;
let voiceResolved = false;

/** Prefer a natural-sounding English voice; fall back to any English one. */
function pickVoice(): SpeechSynthesisVoice | null {
  if (!voiceSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const english = voices.filter((v) => v.lang?.toLowerCase().startsWith("en"));
  const pool = english.length ? english : voices;

  // Novelty voices on macOS ("Bad News", "Bubbles", …) read as broken, not fun.
  const NOVELTY = /bells|bubbles|cellos|deranged|hysterical|bad news|good news|jester|organ|trinoids|whisper|zarvox|boing|albert|wobble/i;
  const usable = pool.filter((v) => !NOVELTY.test(v.name));
  const candidates = usable.length ? usable : pool;

  const preferred = ["Google US English", "Microsoft Aria", "Microsoft Guy", "Samantha", "Daniel"];
  for (const name of preferred) {
    const hit = candidates.find((v) => v.name.includes(name));
    if (hit) return hit;
  }
  return candidates[0] ?? null;
}

function ensureVoice() {
  if (voiceResolved || !voiceSupported()) return;
  chosenVoice = pickVoice();
  if (chosenVoice) voiceResolved = true;
}

if (typeof window !== "undefined" && voiceSupported()) {
  // Voice list is populated asynchronously in most browsers.
  ensureVoice();
  window.speechSynthesis.onvoiceschanged = () => {
    voiceResolved = false;
    ensureVoice();
  };
}

// ── Speaking ────────────────────────────────────────────────────────────────

/** Avoids hearing the same line twice running. */
const lastLine = new Map<string, string>();

function pickLine(character: Character, event: VoiceEvent): string {
  const bank = LINES[character][event];
  if (bank.length === 1) return bank[0];
  const key = `${character}:${event}`;
  const previous = lastLine.get(key);
  const options = bank.filter((l) => l !== previous);
  const line = options[Math.floor(Math.random() * options.length)];
  lastLine.set(key, line);
  return line;
}

let duckHandler: ((ducked: boolean) => void) | null = null;

/** Lets the music layer duck itself while the AI is talking. */
export function onVoiceDuck(handler: ((ducked: boolean) => void) | null) {
  duckHandler = handler;
}

export function cancelVoice() {
  if (!voiceSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* no-op */
  }
  duckHandler?.(false);
}

let lastSpokeAt = 0;
const MIN_GAP_MS = 350;

/**
 * Speak a reaction. Safe to call on every answer: it cancels anything still
 * playing so lines never pile up, and it is a no-op when muted or unsupported.
 */
export function speak(event: VoiceEvent, character: Character = "GIGA") {
  if (muted || isSfxMuted() || !voiceSupported()) return;

  const now = Date.now();
  if (now - lastSpokeAt < MIN_GAP_MS) return;
  lastSpokeAt = now;

  const line = pickLine(character, event);

  // Pre-recorded clip wins if one has been added for this event.
  if (tryClip(event, character)) return;

  ensureVoice();
  cancelVoice();

  const utter = new SpeechSynthesisUtterance(line);
  const delivery = DELIVERY[character];
  utter.rate = delivery.rate;
  utter.pitch = delivery.pitch;
  utter.volume = 0.95;
  if (chosenVoice) utter.voice = chosenVoice;

  duckHandler?.(true);
  utter.onend = () => duckHandler?.(false);
  utter.onerror = () => duckHandler?.(false);

  try {
    window.speechSynthesis.speak(utter);
  } catch {
    duckHandler?.(false);
  }
}

// ── Optional recorded-clip layer ────────────────────────────────────────────

type ClipStatus = "unknown" | "present" | "absent";
const clipStatus = new Map<string, ClipStatus>();
const clipAudio = new Map<string, HTMLAudioElement>();

/**
 * Plays /voice/<character>-<event>.mp3 if a clip has been CONFIRMED to exist.
 *
 * The confirmation matters: an earlier version called play() and returned true
 * immediately, but play() on a missing file rejects asynchronously — so the
 * first line of every type was swallowed and never reached speech synthesis.
 * Now an unconfirmed clip falls through to TTS and probes in the background, so
 * the AI always says something and recorded audio takes over once it is known
 * to load.
 */
function tryClip(event: VoiceEvent, character: Character): boolean {
  if (typeof window === "undefined") return false;
  const key = `${character}-${event}`.toLowerCase();
  const status = clipStatus.get(key) ?? "unknown";

  if (status === "absent") return false;

  if (status === "present") {
    const audio = clipAudio.get(key);
    if (!audio) return false;
    try {
      audio.currentTime = 0;
      void audio.play().catch(() => clipStatus.set(key, "absent"));
      duckHandler?.(true);
      audio.onended = () => duckHandler?.(false);
      return true;
    } catch {
      clipStatus.set(key, "absent");
      return false;
    }
  }

  // First time we've seen this line: probe now, speak via TTS this round.
  clipStatus.set(key, "unknown");
  const probe = new Audio(`${CLIP_BASE}/${key}.mp3`);
  probe.preload = "auto";
  probe.addEventListener("canplaythrough", () => {
    clipStatus.set(key, "present");
    clipAudio.set(key, probe);
  }, { once: true });
  probe.addEventListener("error", () => clipStatus.set(key, "absent"), { once: true });
  return false;
}
