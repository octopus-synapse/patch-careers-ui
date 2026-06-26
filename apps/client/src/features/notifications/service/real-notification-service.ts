/**
 * Real notification service — dev/production builds. Talks to Expo's push
 * service for a device token and delegates OS presentation to `expo-bridge`.
 *
 * `getExpoPushTokenAsync` requires the EAS project id (read from
 * `expo.extra.eas.projectId` in app.json). If it's missing or the call fails
 * (e.g. simulator, no credentials yet), we fail soft: log + return null so
 * bootstrap never crashes — the in-app inbox still works without a token.
 */

import { mundane } from "@patch-careers/storage";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import {
  addResponseListener,
  getInitialTap,
  getPermissionStatus,
  requestPermission,
  setForegroundHandler,
  setupAndroidChannel,
} from "./expo-bridge";
import type { NotificationService } from "./notification-service";

const TOKEN_STORAGE_KEY = "push.expoToken";

function resolveProjectId(): string | undefined {
  const extra = (Constants.expoConfig?.extra ?? {}) as { eas?: { projectId?: string } };
  return extra.eas?.projectId;
}

export function createRealNotificationService(): NotificationService {
  return {
    isMock: false,
    requestPermission,
    getPermissionStatus,
    setForegroundHandler,
    addResponseListener,
    getInitialTap,
    setupAndroidChannel,

    async registerForPushToken() {
      const projectId = resolveProjectId();
      if (!projectId) {
        console.warn(
          "[notifications] missing expo.extra.eas.projectId — skipping push token registration",
        );
        return null;
      }
      try {
        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
        await mundane.setItem(TOKEN_STORAGE_KEY, token);
        return token;
      } catch (error) {
        console.warn("[notifications] failed to get Expo push token", error);
        return null;
      }
    },

    async getStoredToken() {
      return mundane.getItem(TOKEN_STORAGE_KEY);
    },
  };
}
