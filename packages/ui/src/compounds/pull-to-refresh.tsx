/**
 * `<PullToRefresh>` — thin wrapper around RN's `RefreshControl` so we
 * can swap in custom indicators later without changing every callsite.
 */

import type { ReactElement, ReactNode } from "react";
import { RefreshControl, ScrollView } from "react-native";

export type PullToRefreshProps = {
  refreshing: boolean;
  onRefresh: () => void;
  children: ReactNode;
  /** Optional custom scroll container; defaults to ScrollView. */
  renderContainer?: (props: { refreshControl: ReactElement; children: ReactNode }) => ReactElement;
};

export function PullToRefresh({
  refreshing,
  onRefresh,
  children,
  renderContainer,
}: PullToRefreshProps) {
  const refreshControl = <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />;
  if (renderContainer) return renderContainer({ refreshControl, children });
  return <ScrollView refreshControl={refreshControl}>{children}</ScrollView>;
}
