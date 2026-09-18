/**
 * `useCountUp` — a number that counts to its value when its chapter arrives.
 *
 * The value is a number, never copy, so the locale decides how it reads: "7,4"
 * in pt-BR, "7.4" in en. Counting is skipped entirely under reduced motion —
 * the reader still gets the figure, just without the theatre.
 */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "react-native-reanimated";
import { useI18n } from "@/providers/i18n-provider";
import { useLandingMotionContext } from "./use-landing-motion";

const DURATION_MS = 900;

export function useCountUp(value: number, fractionDigits: number, active: boolean): string {
  const { locale } = useI18n();
  const systemReduced = useReducedMotion();
  const reducedMotion = useLandingMotionContext()?.reduced ?? systemReduced;
  const [shown, setShown] = useState(active ? value : 0);
  const current = useRef(shown);

  useEffect(() => {
    if (reducedMotion) {
      current.current = value;
      setShown(value);
      return;
    }
    // Exiting content is still on screen. Preserve its digits, including
    // when a fast gesture interrupts the count; re-entry resumes from here.
    if (!active || current.current === value) return;

    let frame = 0;
    const from = current.current;
    const started = performance.now();
    const tick = (): void => {
      const progress = Math.min(1, (performance.now() - started) / DURATION_MS);
      // Ease-out cubic: fast off the line, gentle into the final digit.
      current.current = from + (value - from) * (1 - (1 - progress) ** 3);
      setShown(current.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, reducedMotion, value]);

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(shown);
}
