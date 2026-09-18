import type { ReactNode } from "react";
import type { SharedValue } from "react-native-reanimated";
export interface StatisticBackdropProps {
  readonly offset: SharedValue<number>;
  readonly heights: SharedValue<number[]>;
  readonly height: number;
  readonly reduced: boolean;
  readonly children?: ReactNode;
}
export function StatisticBackdrop(_props: StatisticBackdropProps) {
  return null;
}
export function StatisticHeader({ children }: StatisticBackdropProps) {
  return <>{children}</>;
}
