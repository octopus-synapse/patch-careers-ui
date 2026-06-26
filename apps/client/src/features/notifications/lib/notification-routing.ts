/**
 * Map a notification (type + entityId) to the in-app route a tap should open.
 * Pure so the routing table is unit-testable; the provider/row consume the
 * returned `Href` with expo-router's `router.push`.
 *
 *   MESSAGE_RECEIVED            → conversation thread (push-only type)
 *   MATCH_RECOMMENDATIONS_READY → Jobs tab
 *   RESUME_QUALITY_*            → Profile tab
 *   everything else             → the Notifications tab (no specific entity)
 */

import type { Href } from "expo-router";
import type { NotificationPayload } from "../types";

export function routeForNotification(payload: {
  type: NotificationPayload["type"];
  entityId: string | null;
}): Href {
  switch (payload.type) {
    case "MESSAGE_RECEIVED":
      return payload.entityId
        ? { pathname: "/conversation/[id]", params: { id: payload.entityId } }
        : "/(tabs)/messages";
    case "MATCH_RECOMMENDATIONS_READY":
      return "/(tabs)/jobs";
    case "RESUME_QUALITY_IMPROVED":
    case "RESUME_QUALITY_REGRESSED":
      return "/(tabs)/profile";
    default:
      return "/(tabs)/notifications";
  }
}
