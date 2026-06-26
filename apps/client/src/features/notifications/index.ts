/**
 * Notifications feature — public API. The in-app inbox tab plus the push
 * device-registration + foreground/tap handling that the root notifications
 * provider wires. Import only from "@/features/notifications"; internal paths
 * are private (ADR-0002).
 */

export { MarkAllReadAction } from "./components/mark-all-read-action";
export {
  NotificationEmptyState,
  NotificationErrorState,
} from "./components/notification-empty-state";
export { NotificationListSkeleton } from "./components/notification-list-skeleton";
export { NotificationRow } from "./components/notification-row";
export { NotificationSectionList } from "./components/notification-section-list";
export { PushPrepromptSheet } from "./components/push-preprompt-sheet";
export {
  invalidateNotifications,
  useMarkRead,
  useNotificationInbox,
  useRegisterDevice,
  useUnreadCount,
  useUnregisterDevice,
} from "./hooks/queries";
export { usePushRegistration } from "./hooks/use-push-registration";
export {
  intentForType,
  isToastEligible,
  toastTitleKeyForType,
} from "./lib/notification-presentation";
export { routeForNotification } from "./lib/notification-routing";
export { isExpoGo } from "./service/expo-go";
export type { ForegroundNotification } from "./service/notification-service";
export { getNotificationService } from "./service/notification-service";
export type { NotificationItem, NotificationPayload, NotificationRoutableType } from "./types";
