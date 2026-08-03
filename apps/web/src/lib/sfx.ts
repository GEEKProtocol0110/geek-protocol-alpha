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
  | "cash";

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

    case "cash":
      [659.25, 987.77].forEach((f, i) => tone(c, f, t0 + i * 0.08, 0.2, "triangle", 0.09));
      break;
  }
}
