import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import {
  cancelAnimation,
  Easing,
  type SharedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export interface LandingMotion {
  readonly x: SharedValue<number>;
  readonly y: SharedValue<number>;
  readonly ambient: SharedValue<number>;
  readonly intro: SharedValue<number>;
  readonly reduced: boolean;
}

export const LandingMotionContext = createContext<LandingMotion | null>(null);
export const useLandingMotionContext = (): LandingMotion | null => useContext(LandingMotionContext);

/** A single clock and pointer for every plane; no React updates per frame. */
export function useLandingMotion(paused: boolean): LandingMotion {
  const systemReduced = useReducedMotion();
  const [reduced, setReduced] = useState(systemReduced);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const ambient = useSharedValue(0);
  const intro = useSharedValue(1);

  useEffect(() => {
    if (reduced) {
      intro.value = 0;
      return;
    }
    if (intro.value === 0) return;
    intro.value = withDelay(
      480,
      withTiming(0, { duration: 1100, easing: Easing.out(Easing.cubic) }),
    );
    // Restart a cancelled opening during React Strict Mode's effect replay.
    return () => cancelAnimation(intro);
  }, [intro, reduced]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = (): void => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const stop = (): void => {
      cancelAnimation(ambient);
      cancelAnimation(x);
      cancelAnimation(y);
    };
    if (reduced || paused) {
      stop();
      x.value = 0;
      y.value = 0;
      ambient.value = 0;
      return;
    }
    const start = (): void => {
      ambient.value = 0;
      ambient.value = withRepeat(
        withTiming(Math.PI * 2, { duration: 24000, easing: Easing.linear }),
        -1,
      );
    };
    start();
    if (Platform.OS !== "web") return stop;

    const move = (event: PointerEvent): void => {
      if (event.pointerType !== "mouse") return;
      x.value = withTiming((event.clientX / window.innerWidth - 0.5) * 2, { duration: 650 });
      y.value = withTiming((event.clientY / window.innerHeight - 0.5) * 2, { duration: 650 });
    };
    const reset = (): void => {
      x.value = withTiming(0, { duration: 650 });
      y.value = withTiming(0, { duration: 650 });
    };
    const visibility = (): void => {
      if (document.hidden) stop();
      else start();
    };
    if (document.hidden) stop();
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      stop();
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", reset);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [ambient, paused, reduced, x, y]);

  return useMemo(() => ({ x, y, ambient, intro, reduced }), [x, y, ambient, intro, reduced]);
}
