/**
 * Local domain types for the Notifications feature, narrowed straight from the
 * api-client DTOs so the UI layer never re-declares the backend shape (single
 * source of truth = the Kubb-generated SDK).
 */

import type {
  GetV1Notifications200,
  RegisterPushDeviceRequestPlatformEnum,
} from "@patch-careers/api-client";

/** One row in the inbox (`GET /v1/notifications`). */
export type NotificationItem = GetV1Notifications200["items"][number];

/** The actor that caused a notification (null for system/career types). */
export type NotificationActor = NotificationItem["actor"];

/** The types that can appear as a row in the inbox list. */
export type NotificationListType = NotificationItem["type"];

/**
 * Notification types we route/toast on. A superset of the inbox-list enum:
 * `MESSAGE_RECEIVED` is push-only (it never renders a list row) but a push tap
 * still needs to deep-link to the conversation, so routing must know it.
 */
export type NotificationRoutableType = NotificationListType | "MESSAGE_RECEIVED";

/** Minimal payload carried on a push/local notification's `data` field. */
export type NotificationPayload = {
  type: NotificationRoutableType;
  entityId: string | null;
  entityType: string | null;
  notificationId?: string | null;
};

/** Device platform as the backend expects it. */
export type DevicePlatform = RegisterPushDeviceRequestPlatformEnum;
