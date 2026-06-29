/**
 * Loading placeholder for the notification inbox — the shared
 * `InboxListSkeleton` with this surface's line widths.
 */

import type { ReactElement } from "react";
import { InboxListSkeleton } from "@/components/inbox-list-skeleton";

export function NotificationListSkeleton({ rows = 7 }: { rows?: number }): ReactElement {
  return <InboxListSkeleton rows={rows} lineWidths={["80%", "35%"]} />;
}
