/**
 * The landing's opt-in sound engine — the prototype's `SND` object, verbatim:
 * four tiny WebAudio tones (`pop`, `bip`, `plim`, `tick`), off by default,
 * remembered in `localStorage("patch-snd")`. Web only; every entry point
 * no-ops on native, so callers never need to guard.
 */

import { Platform } from "react-native";

export type LandingSoundKind = "pop" | "bip" | "plim" | "tick";

interface ToneSpec {
  readonly type: OscillatorType;
  readonly from: number;
  readonly to: number;
  readonly ms: number;
  readonly volume: number;
}

const STORAGE_KEY = "patch-snd";

let enabled = false;
let context: AudioContext | null = null;
let hydrated = false;
const listeners = new Set<(on: boolean) => void>();

function isWeb(): boolean {
  return Platform.OS === "web" && typeof window !== "undefined";
}

function ensureContext(): AudioContext | null {
  if (!isWeb()) return null;
  if (!context) {
    try {
      context = new AudioContext();
    } catch {
      return null;
    }
  }
  if (context.state === "suspended") void context.resume();
  return context;
}

function tone({ type, from, to, ms, volume }: ToneSpec): void {
  const audio = ensureContext();
  if (!audio) return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const at = audio.currentTime;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, at);
  oscillator.frequency.exponentialRampToValueAtTime(to, at + ms / 1000);
  gain.gain.setValueAtTime(volume, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + ms / 1000);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(at);
  oscillator.stop(at + ms / 1000 + 0.02);
}

export const landingSound = {
  /** Reads the persisted preference once, lazily — safe during SSR. */
  isEnabled(): boolean {
    if (!hydrated && isWeb()) {
      hydrated = true;
      try {
        enabled = window.localStorage.getItem(STORAGE_KEY) === "1";
      } catch {
        enabled = false;
      }
    }
    return enabled;
  },

  setEnabled(on: boolean): void {
    enabled = on;
    hydrated = true;
    if (isWeb()) {
      try {
        window.localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
      } catch {
        // Preference just won't survive the session.
      }
    }
    if (on) this.play("plim");
    for (const listener of listeners) listener(on);
  },

  subscribe(listener: (on: boolean) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  play(kind: LandingSoundKind): void {
    if (!this.isEnabled()) return;
    if (kind === "pop") tone({ type: "sine", from: 520, to: 180, ms: 110, volume: 0.12 });
    else if (kind === "bip") {
      const f = Math.random() > 0.5 ? 880 : 1320;
      tone({ type: "square", from: f, to: f, ms: 45, volume: 0.03 });
    } else if (kind === "plim")
      tone({ type: "triangle", from: 1046, to: 1568, ms: 220, volume: 0.07 });
    else tone({ type: "sine", from: 1200, to: 900, ms: 30, volume: 0.02 });
  },
};
