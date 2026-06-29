/**
 * Loading placeholder for the messages inbox — the shared `InboxListSkeleton`
 * with this surface's line widths.
 */

import type { ReactElement } from "react";
import { InboxListSkeleton } from "@/components/inbox-list-skeleton";

export function ConversationListSkeleton({ rows = 7 }: { rows?: number }): ReactElement {
  return <InboxListSkeleton rows={rows} lineWidths={["45%", "80%"]} />;
}
