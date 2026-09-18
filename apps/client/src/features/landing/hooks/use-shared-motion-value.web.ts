import { type MotionValue, useMotionValue } from "framer-motion";
import { useLayoutEffect, useState } from "react";
import type { SharedValue } from "react-native-reanimated";

// Reanimated's animation mappers use positive IDs. Our subscriptions own this range.
let nextListener = -100_000;

/** Bridge the existing scroll geometry to Motion without React renders per frame. */
export function useSharedMotionValue<T>(
  source: SharedValue<T> | undefined,
  fallback: T,
): MotionValue<T> {
  const value = useMotionValue(source?.value ?? fallback);
  const [listener] = useState(() => nextListener--);
  useLayoutEffect(() => {
    if (!source) {
      value.set(fallback);
      return;
    }
    value.set(source.value);
    source.addListener(listener, (next) => value.set(next));
    return () => source.removeListener(listener);
  }, [source, fallback, listener, value]);
  return value;
}
