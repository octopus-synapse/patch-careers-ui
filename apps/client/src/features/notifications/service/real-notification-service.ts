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

function messageFromError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Erro desconhecido";
  }
}

function validProjectId(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "REPLACE_WITH_EAS_PROJECT_ID") return undefined;
  return trimmed;
}

function resolveProjectId(): string | undefined {
  const extra = (Constants.expoConfig?.extra ?? {}) as { eas?: { projectId?: string } };
  const constants = Constants as typeof Constants & { easConfig?: { projectId?: string } };
  return (
    validProjectId(process.env.EXPO_PUBLIC_EAS_PROJECT_ID) ??
    validProjectId(extra.eas?.projectId) ??
    validProjectId(constants.easConfig?.projectId)
  );
}

export function createRealNotificationService(): NotificationService {
  let lastRegistrationError: string | null = null;

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
        lastRegistrationError =
          "EAS projectId ausente. Rode eas init ou defina EXPO_PUBLIC_EAS_PROJECT_ID.";
        console.warn(
          "[notifications] missing expo.extra.eas.projectId — skipping push token registration",
        );
        return null;
      }
      try {
        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
        await mundane.setItem(TOKEN_STORAGE_KEY, token);
        lastRegistrationError = null;
        return token;
      } catch (error) {
        lastRegistrationError = messageFromError(error);
        console.warn("[notifications] failed to get Expo push token", error);
        return null;
      }
    },

    getLastRegistrationError() {
      return lastRegistrationError;
    },

    async getStoredToken() {
      return mundane.getItem(TOKEN_STORAGE_KEY);
    },
  };
}
