"use client";

/**
 * Background music for the quiz — an upbeat, spacey synth loop.
 *
 * Generated with Web Audio oscillators rather than streamed from a file: no
 * asset to host or license, no download before play, and it loops seamlessly
 * forever. Four layers over an A minor progression:
 *
 *   pad     – two detuned saws through a low-pass, long attack: the "space"
 *   bass    – sine sub on the root of each bar: the weight
 *   arp     – plucky triangle sixteenths cycling chord tones: the "peppy"
 *   shimmer – sparse high sine blips off the beat: the star-field twinkle
 *
 * Notes are scheduled with a lookahead timer. Driving Web Audio off setInterval
 * alone drifts audibly within a few bars; scheduling ahead against the audio
 * clock keeps it tight.
 */

import { isSfxMuted, AUDIO_PREFS_EVENT } from "./sfx";

const STORAGE_KEY = "gp_music_muted";

const BPM = 96;
const BEAT = 60 / BPM;
const STEP = BEAT / 4; // sixteenth notes
const STEPS_PER_BAR = 16;

/** Am – F – C – G, the friendliest "hopeful space" loop there is. */
const PROGRESSION: { root: number; chord: number[] }[] = [
  { root: 55.00, chord: [220.00, 261.63, 329.63] }, // Am
  { root: 43.65, chord: [174.61, 220.00, 261.63] }, // F
  { root: 65.41, chord: [261.63, 329.63, 392.00] }, // C
  { root: 49.00, chord: [196.00, 246.94, 293.66] }, // G
];

/** Which sixteenths the arp plays — a loose, syncopated feel. */
const ARP_PATTERN = [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15];

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let filter: BiquadFilterNode | null = null;
let timer: number | null = null;
let nextNoteTime = 0;
let step = 0;
let bar = 0;
let running = false;
let ducked = false;

const BASE_VOLUME = 0.13;
const DUCKED_VOLUME = 0.04;

let muted = false;
if (typeof window !== "undefined") {
  muted = window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function isMusicMuted() {
  return muted;
}

export function setMusicMuted(v: boolean) {
  muted = v;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    window.dispatchEvent(new Event(AUDIO_PREFS_EVENT));
  }
  if (v) stopMusic();
}

export function toggleMusicMuted() {
  setMusicMuted(!muted);
  return muted;
}

export function isMusicPlaying() {
  return running;
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC();
    filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2200;
    filter.Q.value = 0.6;
    master = ctx.createGain();
    master.gain.value = 0;
    filter.connect(master).connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function voice(
  c: AudioContext,
  dest: AudioNode,
  freq: number,
  at: number,
  dur: number,
  type: OscillatorType,
  peak: number,
  detune = 0
) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (detune) osc.detune.setValueAtTime(detune, at);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + Math.min(0.08, dur * 0.25));
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(dest);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

/** Schedule one sixteenth-note step. */
function scheduleStep(c: AudioContext, dest: AudioNode, s: number, when: number, barIndex: number) {
  const { root, chord } = PROGRESSION[barIndex % PROGRESSION.length];

  // Pad — once per bar, long and soft, two detuned saws for width.
  if (s === 0) {
    const padDur = BEAT * 4 * 0.98;
    chord.forEach((f) => {
      voice(c, dest, f / 2, when, padDur, "sawtooth", 0.016, -7);
      voice(c, dest, f / 2, when, padDur, "sawtooth", 0.016, +7);
    });
  }

  // Bass — root on beats 1 and 3.
  if (s === 0 || s === 8) {
    voice(c, dest, root, when, BEAT * 0.9, "sine", 0.09);
  }

  // Arp — plucky sixteenths through the chord.
  if (ARP_PATTERN.includes(s)) {
    const idx = ARP_PATTERN.indexOf(s);
    const note = chord[idx % chord.length] * (idx % 4 === 3 ? 2 : 1);
    voice(c, dest, note, when, STEP * 1.6, "triangle", 0.05);
  }

  // Shimmer — sparse, high, off-grid twinkle.
  if (s === 6 || s === 14) {
    const note = chord[(barIndex + s) % chord.length] * 4;
    voice(c, dest, note, when, STEP * 2.2, "sine", 0.022);
  }
}

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.12; // seconds

function tick() {
  const c = ctx;
  const dest = filter;
  if (!c || !dest || !running) return;

  while (nextNoteTime < c.currentTime + SCHEDULE_AHEAD) {
    scheduleStep(c, dest, step, nextNoteTime, bar);
    nextNoteTime += STEP;
    step += 1;
    if (step >= STEPS_PER_BAR) {
      step = 0;
      bar += 1;
    }
  }
}

/**
 * Start the loop. Must be called from a user gesture (a click) — browsers block
 * audio that starts on its own.
 */
export function startMusic() {
  if (muted || isSfxMuted() || running) return;
  const c = getCtx();
  if (!c || !master) return;

  running = true;
  step = 0;
  bar = 0;
  nextNoteTime = c.currentTime + 0.06;

  // Fade in so it arrives rather than snapping on.
  master.gain.cancelScheduledValues(c.currentTime);
  master.gain.setValueAtTime(0.0001, c.currentTime);
  master.gain.exponentialRampToValueAtTime(BASE_VOLUME, c.currentTime + 1.6);

  timer = window.setInterval(tick, LOOKAHEAD_MS);
}

export function stopMusic() {
  running = false;
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
  if (ctx && master) {
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  }
}

/** Drop the music under the AI's voice so lines stay intelligible. */
export function duckMusic(on: boolean) {
  if (!ctx || !master || !running || ducked === on) return;
  ducked = on;
  const now = ctx.currentTime;
  const target = on ? DUCKED_VOLUME : BASE_VOLUME;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
  master.gain.exponentialRampToValueAtTime(target, now + (on ? 0.12 : 0.45));
}
