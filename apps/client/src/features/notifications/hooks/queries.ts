/**
 * React-Query glue for the Notifications feature.
 *
 * Thin wrappers over the Kubb-generated notification hooks that centralise the
 * bits the screens shouldn't repeat: light polling for liveness (same cadence
 * as Messages), the shared invalidation set (inbox + unread badge), and the
 * mark-read / device-registration mutations.
 */

import {
  getV1NotificationsQueryKey,
  getV1NotificationsUnreadCountQueryKey,
  registerPushDeviceRequestPlatformEnum,
  useDeleteV1NotificationsDevicesToken,
  useGetV1Notifications,
  useGetV1NotificationsUnreadCount,
  usePostV1NotificationsDevices,
  usePostV1NotificationsMarkRead,
} from "@patch-careers/api-client";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { Platform } from "react-native";
import { INBOX_POLL_MS } from "@/lib/polling";
import type { DevicePlatform, NotificationItem } from "../types";

const INBOX_LIMIT = 50;

function inboxKey() {
  return getV1NotificationsQueryKey({ limit: INBOX_LIMIT });
}

/** Invalidate the inbox list + the unread badge after any mutation. */
export function invalidateNotifications(qc: QueryClient): void {
  void qc.invalidateQueries({ queryKey: inboxKey() });
  void qc.invalidateQueries({ queryKey: getV1NotificationsUnreadCountQueryKey() });
}

/** Inbox list — first page, polled (cursor exposed for later infinite scroll). */
export function useNotificationInbox(): {
  items: NotificationItem[];
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  refetch: () => void;
  hasNext: boolean;
  nextCursor: string | null;
} {
  const query = useGetV1Notifications(
    { limit: INBOX_LIMIT },
    { query: { refetchInterval: INBOX_POLL_MS } },
  );
  return {
    items: query.data?.items ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    isRefetching: query.isRefetching,
    refetch: () => void query.refetch(),
    hasNext: query.data?.hasNext ?? false,
    nextCursor: query.data?.nextCursor ?? null,
  };
}

/** Unread count (polled) — the screen header uses it to enable "mark all". */
export function useUnreadCount(): number {
  const query = useGetV1NotificationsUnreadCount({ query: { refetchInterval: INBOX_POLL_MS } });
  return query.data?.count ?? 0;
}

/** Mark-read mutations. `markOne(id)` marks one; `markAll()` omits the id. */
export function useMarkRead(): { markOne: (id: string) => void; markAll: () => void } {
  const qc = useQueryClient();
  const mutation = usePostV1NotificationsMarkRead({
    mutation: { onSuccess: () => invalidateNotifications(qc) },
  });
  const { mutate } = mutation;
  const markOne = useCallback((id: string) => mutate({ data: { notificationId: id } }), [mutate]);
  const markAll = useCallback(() => mutate({ data: {} }), [mutate]);
  return { markOne, markAll };
}

function currentPlatform(): DevicePlatform {
  if (Platform.OS === "ios") return registerPushDeviceRequestPlatformEnum.IOS;
  if (Platform.OS === "android") return registerPushDeviceRequestPlatformEnum.ANDROID;
  return registerPushDeviceRequestPlatformEnum.WEB;
}

/** Register an Expo push token for this device. */
export function useRegisterDevice(): { register: (expoPushToken: string) => void } {
  const mutation = usePostV1NotificationsDevices();
  return {
    register: (expoPushToken: string) =>
      mutation.mutate({ data: { expoPushToken, platform: currentPlatform() } }),
  };
}

/** Unregister a device token (on sign-out, so a shared device stops receiving). */
export function useUnregisterDevice(): { unregister: (token: string) => void } {
  const mutation = useDeleteV1NotificationsDevicesToken();
  return { unregister: (token: string) => mutation.mutate({ token }) };
}
