/**
 * Detects when a résumé's Quality grade (S/A/B/C/D/F) has changed since the
 * user last saw it, so the panel can surface a one-time highlight on reopen.
 * The backend already routes `RESUME_QUALITY_IMPROVED/REGRESSED` notifications;
 * this is the in-app companion. Persists the last-seen overall score per
 * résumé in `mundane` so the signal survives app restarts and fires once.
 */
import { mundane } from "@patch-careers/storage";
import { scoreGrade } from "@patch-careers/ui";
import { useEffect, useState } from "react";

export type RankDelta = "up" | "down" | null;

export function useRankPulse(resumeId: string, overall: number | null): RankDelta {
  const key = `resume-quality-rank:${resumeId}`;
  // undefined = still loading the persisted value; null = nothing stored yet.
  const [lastSeen, setLastSeen] = useState<number | null | undefined>(undefined);
  const [delta, setDelta] = useState<RankDelta>(null);

  useEffect(() => {
    let cancelled = false;
    mundane
      .getItem(key)
      .then((v) => {
        if (cancelled) return;
        const n = v === null ? null : Number(v);
        setLastSeen(n !== null && Number.isFinite(n) ? n : null);
      })
      .catch(() => setLastSeen(null));
    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    if (overall === null || lastSeen === undefined) return;
    const gradeChanged = lastSeen !== null && scoreGrade(overall) !== scoreGrade(lastSeen);
    if (gradeChanged) setDelta(overall > lastSeen ? "up" : "down");
    if (lastSeen === null || gradeChanged) {
      void mundane.setItem(key, String(Math.round(overall)));
    }
  }, [overall, lastSeen, key]);

  return delta;
}
