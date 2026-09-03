/** `react-native-safe-area-context` for jsdom — no notches, insets are zero. */

import type { ReactElement, ReactNode } from "react";
import { View, type ViewProps } from "react-native";

export type EdgeInsets = { top: number; right: number; bottom: number; left: number };
const ZERO: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };

export function useSafeAreaInsets(): EdgeInsets {
  return ZERO;
}
export function useSafeAreaFrame(): { x: number; y: number; width: number; height: number } {
  return { x: 0, y: 0, width: 1024, height: 768 };
}
export function SafeAreaProvider({ children }: { children?: ReactNode }): ReactElement {
  return <>{children}</>;
}
export function SafeAreaView(props: ViewProps): ReactElement {
  return <View {...props} />;
}
export const initialWindowMetrics = {
  insets: ZERO,
  frame: { x: 0, y: 0, width: 1024, height: 768 },
};
