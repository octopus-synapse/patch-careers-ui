/**
 * Detects when the master resume's Readiness grade (S/A/B/C/D/F) changed
 * since the user last opened the Desempenho hub, so the hero can play a
 * one-time "level-up" moment (haptic + a subtle gauge pulse). Persists the
 * last-seen Readiness score in `mundane` so it fires once and survives
 * restarts. Readiness is master-level (one per user), so a single storage
 * key — unlike the per-resume quality `useRankPulse`.
 */
import { mundane } from "@patch-careers/storage";
import { scoreGrade } from "@patch-careers/ui";
import { useEffect, useState } from "react";

const KEY = "readiness-rank";
const GRADE_ORDER = ["F", "D", "C", "B", "A", "S"] as const;

export type ReadinessPulse = {
  /** "up" when the grade improved since last seen, "down" if it dropped. */
  direction: "up" | "down" | null;
  /** Number of grades moved (0 when unchanged); ≥2 warrants a bigger cue. */
  magnitude: number;
};

const NO_PULSE: ReadinessPulse = { direction: null, magnitude: 0 };

function gradeIndex(score: number): number {
  return GRADE_ORDER.indexOf(scoreGrade(score));
}

export function useReadinessPulse(score: number | null): ReadinessPulse {
  // undefined = still loading the persisted value; null = nothing stored yet.
  const [lastSeen, setLastSeen] = useState<number | null | undefined>(undefined);
  const [pulse, setPulse] = useState<ReadinessPulse>(NO_PULSE);

  useEffect(() => {
    let cancelled = false;
    mundane
      .getItem(KEY)
      .then((v) => {
        if (cancelled) return;
        const n = v === null ? null : Number(v);
        setLastSeen(n !== null && Number.isFinite(n) ? n : null);
      })
      .catch(() => setLastSeen(null));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (score === null || lastSeen === undefined) return;
    const moved = lastSeen === null ? 0 : gradeIndex(score) - gradeIndex(lastSeen);
    if (moved !== 0) {
      setPulse({ direction: moved > 0 ? "up" : "down", magnitude: Math.abs(moved) });
    }
    if (lastSeen === null || moved !== 0) {
      void mundane.setItem(KEY, String(Math.round(score)));
    }
  }, [score, lastSeen]);

  return pulse;
}
