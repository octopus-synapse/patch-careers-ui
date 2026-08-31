/**
 * `useCountUp` — a number that counts to its value when its chapter arrives.
 *
 * The value is a number, never copy, so the locale decides how it reads: "7,4"
 * in pt-BR, "7.4" in en. Counting is skipped entirely under reduced motion —
 * the reader still gets the figure, just without the theatre.
 */

import { useEffect, useState } from "react";
import { useReducedMotion } from "react-native-reanimated";
import { useI18n } from "@/providers/i18n-provider";

const DURATION_MS = 900;

export function useCountUp(value: number, fractionDigits: number, active: boolean): string {
  const { locale } = useI18n();
  const reducedMotion = useReducedMotion();
  const [shown, setShown] = useState(active ? value : 0);

  useEffect(() => {
    if (!active) {
      setShown(0);
      return;
    }
    if (reducedMotion) {
      setShown(value);
      return;
    }

    let frame = 0;
    const started = Date.now();
    const tick = (): void => {
      const progress = Math.min(1, (Date.now() - started) / DURATION_MS);
      // Ease-out cubic: fast off the line, gentle into the final digit.
      setShown(value * (1 - (1 - progress) ** 3));
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
