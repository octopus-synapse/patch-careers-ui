/**
 * NotificationService — the seam between the app and `expo-notifications`.
 *
 * Two implementations exist behind one factory:
 *   - real  (`real-notification-service`)  — dev/production builds; talks to
 *     Expo's push service and the OS notification APIs.
 *   - mock  (`mock-notification-service`)   — Expo Go; fakes token registration
 *     and simulates incoming pushes with local notifications so the entire flow
 *     (foreground toast → tap → deep-link → mark-read → badge) is testable.
 *
 * The factory picks by `isExpoGo()` and memoizes a single instance.
 */

import type { NotificationPayload, NotificationRoutableType } from "../types";
import { isExpoGo } from "./expo-go";
import { createMockNotificationService } from "./mock-notification-service";
import { createRealNotificationService } from "./real-notification-service";

export type PermissionStatus = "granted" | "denied" | "undetermined";

/** Forwarded to the in-app toast/badge when a push arrives in foreground. */
export type ForegroundNotification = {
  title: string;
  body: string;
  data: NotificationPayload;
};

export type ForegroundHandler = (notification: ForegroundNotification) => void;

export interface NotificationService {
  /** Whether this is the Expo Go mock (drives dev-only affordances). */
  readonly isMock: boolean;
  /** Ask the OS for permission (shows the system prompt if undetermined). */
  requestPermission(): Promise<PermissionStatus>;
  getPermissionStatus(): Promise<PermissionStatus>;
  /** Resolve an Expo push token (real) or a fake one (mock); null on failure. */
  registerForPushToken(): Promise<string | null>;
  /** Last token this service handed out, if any (used to unregister on logout). */
  getStoredToken(): Promise<string | null>;
  /** Configure foreground presentation + forward received notifications. Returns an unsubscribe fn. */
  setForegroundHandler(handler: ForegroundHandler): () => void;
  /** Subscribe to notification taps; returns an unsubscribe fn. */
  addResponseListener(onTap: (data: NotificationPayload) => void): () => void;
  /** If the app was cold-started by a tap, the payload that launched it. */
  getInitialTap(): Promise<NotificationPayload | null>;
  /** Create the Android notification channel (no-op elsewhere). */
  setupAndroidChannel(): Promise<void>;
  /** Mock only: fire a local notification to exercise the flow in Expo Go. */
  simulateIncoming?(
    type: NotificationRoutableType,
    content: { title: string; body: string },
  ): Promise<void>;
}

let instance: NotificationService | null = null;

export function getNotificationService(): NotificationService {
  if (instance) return instance;
  instance = isExpoGo() ? createMockNotificationService() : createRealNotificationService();
  return instance;
}
