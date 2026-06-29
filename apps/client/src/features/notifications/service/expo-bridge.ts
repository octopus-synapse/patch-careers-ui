/**
 * Thin wrappers over `expo-notifications` shared by the real and mock services
 * (both present local/remote notifications through the same OS APIs). Keeping
 * these here means the foreground handler, tap listener, Android channel and
 * payload coercion live in exactly one place.
 */

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { NotificationPayload, NotificationRoutableType } from "../types";
import type { ForegroundHandler, PermissionStatus } from "./notification-service";

export const ANDROID_CHANNEL_ID = "default";
// @style-allow color: Android notification accent (brand color, not a theme token)
const BRAND_COLOR = "#2563EB";

/** Coerce a notification's loose `data` bag into our typed payload. */
export function parsePayload(data: unknown): NotificationPayload {
  const bag = (data ?? {}) as Record<string, unknown>;
  return {
    type: (typeof bag.type === "string" ? bag.type : "") as NotificationRoutableType,
    entityId: typeof bag.entityId === "string" ? bag.entityId : null,
    entityType: typeof bag.entityType === "string" ? bag.entityType : null,
    notificationId: typeof bag.notificationId === "string" ? bag.notificationId : null,
  };
}

export function mapPermission(status: string): PermissionStatus {
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "undetermined";
}

export async function getPermissionStatus(): Promise<PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return mapPermission(status);
}

export async function requestPermission(): Promise<PermissionStatus> {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") return "granted";
  const next = await Notifications.requestPermissionsAsync();
  return mapPermission(next.status);
}

/**
 * Suppress the OS banner while the app is foregrounded (decision: show our own
 * in-app toast instead) and forward the received notification to the handler.
 * Returns an unsubscribe fn for the received-notification listener.
 */
export function setForegroundHandler(handler: ForegroundHandler): () => void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  const sub = Notifications.addNotificationReceivedListener((notification) => {
    const { title, body, data } = notification.request.content;
    handler({ title: title ?? "", body: body ?? "", data: parsePayload(data) });
  });
  return () => sub.remove();
}

export function addResponseListener(onTap: (data: NotificationPayload) => void): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    onTap(parsePayload(response.notification.request.content.data));
  });
  return () => sub.remove();
}

export async function getInitialTap(): Promise<NotificationPayload | null> {
  const response = await Notifications.getLastNotificationResponseAsync();
  if (!response) return null;
  return parsePayload(response.notification.request.content.data);
}

export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Geral",
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: BRAND_COLOR,
  });
}

/** Schedule an immediate local notification (used by the mock simulator). */
export async function presentLocal(
  title: string,
  body: string,
  data: NotificationPayload,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: null,
  });
}
