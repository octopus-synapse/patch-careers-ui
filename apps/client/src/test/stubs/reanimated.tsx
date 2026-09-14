/**
 * `react-native-reanimated` for jsdom.
 *
 * The package's own `mock` still reaches `TurboModuleRegistry`, which
 * react-native-web does not have, so it cannot load here. This stub keeps the
 * public surface the design system and the app use (audited by grep, not
 * guessed): shared values become plain boxes, every `with*` returns its
 * target immediately, animated styles/props resolve synchronously, and
 * `Animated.*` are the RN primitives. Animation is out of scope for a
 * component test; the *end state* is what a spec asserts.
 */

import type { ComponentType } from "react";
import { Image, ScrollView, Text, View } from "react-native";

export type SharedValue<T> = { value: T };
export type AnimatedStyle = Record<string, unknown>;
export type EasingFunction = (t: number) => number;
export type EasingFunctionFactory = { factory: () => EasingFunction };

export function useSharedValue<T>(initial: T): SharedValue<T> {
  return { value: initial };
}
export function useAnimatedStyle<T>(updater: () => T): T {
  return updater();
}
export function useAnimatedProps<T>(updater: () => T): T {
  return updater();
}
export function useReducedMotion(): boolean {
  return false;
}
export function useDerivedValue<T>(updater: () => T): SharedValue<T> {
  return { value: updater() };
}

const identity = <T,>(value: T): T => value;
export const withTiming = identity;
export const withSpring = identity;
export const withDelay = <T,>(_ms: number, value: T): T => value;
export const withRepeat = identity;
export const withSequence = <T,>(...values: T[]): T => values[values.length - 1] as T;
export const cancelAnimation = (): void => undefined;
export const runOnJS = <T extends (...args: never[]) => unknown>(fn: T): T => fn;
export const runOnUI = <T extends (...args: never[]) => unknown>(fn: T): T => fn;

export function interpolate(value: number, input: number[], output: number[]): number {
  const [i0 = 0, i1 = 1] = input;
  const [o0 = 0, o1 = 1] = output;
  if (i1 === i0) return o0;
  const t = Math.min(1, Math.max(0, (value - i0) / (i1 - i0)));
  return o0 + t * (o1 - o0);
}
export function interpolateColor(_value: number, _input: number[], output: string[]): string {
  return output[0] ?? "transparent";
}
export const Extrapolation = { CLAMP: "clamp", EXTEND: "extend", IDENTITY: "identity" } as const;

const easing: EasingFunction = (t) => t;
export const Easing = {
  linear: easing,
  ease: easing,
  quad: easing,
  cubic: easing,
  sin: easing,
  exp: easing,
  circle: easing,
  bounce: easing,
  poly: () => easing,
  elastic: () => easing,
  back: () => easing,
  bezier: () => ({ factory: () => easing }),
  bezierFn: () => easing,
  in: () => easing,
  out: () => easing,
  inOut: () => easing,
  steps: () => easing,
};

const entering = {
  duration: () => entering,
  delay: () => entering,
  springify: () => entering,
  damping: () => entering,
  easing: () => entering,
  withInitialValues: () => entering,
};
export const FadeIn = entering;
export const FadeOut = entering;
export const FadeInDown = entering;
export const FadeInUp = entering;
export const SlideInRight = entering;
export const SlideOutLeft = entering;
export const LinearTransition = entering;
export const Layout = entering;

const Animated = {
  View,
  Text,
  Image,
  ScrollView,
  createAnimatedComponent: <P,>(component: ComponentType<P>): ComponentType<P> => component,
};
export default Animated;
