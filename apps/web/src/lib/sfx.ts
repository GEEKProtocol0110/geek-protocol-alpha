"use client";

// Lightweight synthesized SFX engine (Web Audio API oscillators - no audio files to fetch/host).

export type SfxName =
  | "click"
  | "correct"
  | "wrong"
  | "tick"
  | "combo"
  | "start"
  | "complete"
  | "fanfare"
  | "cash"
  // Battle layer — one cue per kind of exchange, so the ear can tell a
  // glancing hit from a critical without looking at the damage number.
  | "hitLight"
  | "hitHeavy"
  | "crit"
  | "special"
  | "counter"
  | "ko"
  | "victory";

const STORAGE_KEY = "gp_sfx_muted";

let ctx: AudioContext | null = null;
let muted = false;

if (typeof window !== "undefined") {
  muted = window.localStorage.getItem(STORAGE_KEY) === "1";
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tone(
  c: AudioContext,
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType,
  peakGain: number
) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peakGain, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

function sweep(
  c: AudioContext,
  fromFreq: number,
  toFreq: number,
  start: number,
  duration: number,
  type: OscillatorType,
  peakGain: number
) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(fromFreq, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, toFreq), start + duration);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peakGain, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

/** Filtered noise burst — the body of an impact. */
function noise(c: AudioContext, start: number, duration: number, peakGain: number, freq: number, q = 1) {
  const frames = Math.max(1, Math.floor(c.sampleRate * duration));
  const buf = c.createBuffer(1, frames, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(freq, start);
  filter.Q.value = q;
  const gain = c.createGain();
  gain.gain.setValueAtTime(peakGain, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(start);
  src.stop(start + duration + 0.02);
}

export function isSfxMuted() {
  return muted;
}

export function setSfxMuted(v: boolean) {
  muted = v;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    window.dispatchEvent(new Event(AUDIO_PREFS_EVENT));
  }
}

/** Fired whenever any audio preference changes, so UI can re-read it. */
export const AUDIO_PREFS_EVENT = "gp-audio-prefs";

export function toggleSfxMuted() {
  setSfxMuted(!muted);
  return muted;
}

export function playSfx(name: SfxName, opts: { comboLevel?: number; success?: boolean } = {}) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime;

  switch (name) {
    case "click":
      tone(c, 720, t0, 0.05, "square", 0.05);
      break;

    case "correct":
      [523.25, 659.25, 783.99].forEach((f, i) => tone(c, f, t0 + i * 0.06, 0.16, "triangle", 0.09));
      break;

    case "wrong":
      sweep(c, 220, 100, t0, 0.28, "sawtooth", 0.08);
      break;

    case "tick":
      tone(c, 880, t0, 0.045, "square", 0.035);
      break;

    case "combo": {
      const level = Math.min(opts.comboLevel ?? 1, 12);
      const base = 440 + level * 35;
      [base, base * 1.25].forEach((f, i) => tone(c, f, t0 + i * 0.05, 0.14, "triangle", 0.08));
      break;
    }

    case "start":
      tone(c, 392, t0, 0.12, "triangle", 0.07);
      tone(c, 523.25, t0 + 0.1, 0.16, "triangle", 0.08);
      break;

    case "complete":
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(c, f, t0 + i * 0.09, 0.22, "triangle", 0.1));
      break;

    case "fanfare": {
      const good = opts.success !== false;
      const notes = good ? [523.25, 659.25, 783.99, 1046.5, 1318.5] : [392, 349.23, 293.66];
      notes.forEach((f, i) => tone(c, f, t0 + i * (good ? 0.11 : 0.14), good ? 0.3 : 0.32, "triangle", good ? 0.1 : 0.07));
      break;
    }

    // ── Battle cues ──────────────────────────────────────────────────────
    case "hitLight":
      noise(c, t0, 0.09, 0.16, 1500, 0.8);
      tone(c, 320, t0, 0.08, "square", 0.05);
      break;
    case "hitHeavy":
      noise(c, t0, 0.16, 0.26, 850, 0.7);
      sweep(c, 260, 90, t0, 0.18, "square", 0.09);
      tone(c, 110, t0 + 0.01, 0.16, "sine", 0.12);
      break;
    case "crit":
      noise(c, t0, 0.2, 0.3, 2200, 1.2);
      sweep(c, 900, 180, t0, 0.22, "sawtooth", 0.1);
      tone(c, 1320, t0 + 0.03, 0.14, "square", 0.07);
      tone(c, 90, t0, 0.24, "sine", 0.14);
      break;
    case "special": {
      // A charging swell into a heavy release.
      sweep(c, 220, 1400, t0, 0.26, "sawtooth", 0.08);
      noise(c, t0 + 0.24, 0.3, 0.34, 1100, 0.6);
      sweep(c, 1200, 120, t0 + 0.24, 0.34, "square", 0.11);
      tone(c, 70, t0 + 0.24, 0.4, "sine", 0.16);
      [0, 0.07, 0.14].forEach((d, i) => tone(c, 660 + i * 220, t0 + 0.26 + d, 0.12, "triangle", 0.06));
      break;
    }
    case "counter":
      // The Wraith landing one — lower, dirtier, no sparkle.
      noise(c, t0, 0.18, 0.28, 520, 0.5);
      sweep(c, 200, 60, t0, 0.24, "sawtooth", 0.12);
      tone(c, 84, t0 + 0.02, 0.22, "sine", 0.13);
      break;
    case "ko":
      sweep(c, 420, 50, t0, 0.6, "sawtooth", 0.14);
      noise(c, t0, 0.5, 0.3, 320, 0.4);
      tone(c, 62, t0 + 0.05, 0.7, "sine", 0.16);
      break;
    case "victory":
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        tone(c, f, t0 + i * 0.09, 0.34, "triangle", 0.1)
      );
      noise(c, t0, 0.22, 0.18, 2400, 0.9);
      break;
    case "cash":
      [659.25, 987.77].forEach((f, i) => tone(c, f, t0 + i * 0.08, 0.2, "triangle", 0.09));
      break;
  }
}
