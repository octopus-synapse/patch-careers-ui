/**
 * Mock notification service — Expo Go. Remote push tokens can't be minted in
 * Expo Go, so we hand out a fake token but keep the full OS presentation path
 * real (local notifications work in Expo Go), and expose `simulateIncoming` so
 * a dev affordance can fire a notification and exercise the entire flow:
 * foreground toast → tap → deep-link → mark-read → badge.
 *
 * The simulated notification's copy is passed in (resolved via i18n by the dev
 * trigger) so this service stays free of user-facing strings.
 */

import { mundane } from "@patch-careers/storage";
import type { NotificationPayload, NotificationRoutableType } from "../types";
import {
  addResponseListener,
  getInitialTap,
  getPermissionStatus,
  presentLocal,
  requestPermission,
  setForegroundHandler,
  setupAndroidChannel,
} from "./expo-bridge";
import type { NotificationService } from "./notification-service";

const TOKEN_STORAGE_KEY = "push.expoToken";

export function createMockNotificationService(): NotificationService {
  return {
    isMock: true,
    requestPermission,
    getPermissionStatus,
    setForegroundHandler,
    addResponseListener,
    getInitialTap,
    setupAndroidChannel,

    async registerForPushToken() {
      const token = `ExponentPushToken[mock-${Date.now()}]`;
      await mundane.setItem(TOKEN_STORAGE_KEY, token);
      console.log("[notifications] Expo Go mock — using fake push token", token);
      return token;
    },

    async getStoredToken() {
      return mundane.getItem(TOKEN_STORAGE_KEY);
    },

    async simulateIncoming(
      type: NotificationRoutableType,
      content: { title: string; body: string },
    ) {
      const payload: NotificationPayload = { type, entityId: null, entityType: null };
      await presentLocal(content.title, content.body, payload);
    },
  };
}
