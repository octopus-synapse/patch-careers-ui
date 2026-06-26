/**
 * Device push-token lifecycle, scoped to auth.
 *
 *   - When the user is authenticated AND has already granted OS permission,
 *     mint/register the Expo push token (idempotent within a session).
 *   - On sign-out, unregister the stored token so a shared device stops
 *     receiving the previous user's pushes.
 *
 * Permission itself is gated by the soft pre-prompt (see PushPrepromptSheet);
 * this hook only registers once permission is "granted". The pre-prompt calls
 * `ensureRegistered()` right after the user opts in so registration happens
 * without waiting for the next mount.
 */

import { useCallback, useEffect, useRef } from "react";
import { useAuthBootstrap, useAuthState } from "@/providers/auth-provider";
import { getNotificationService } from "../service/notification-service";
import { useRegisterDevice, useUnregisterDevice } from "./queries";

export function usePushRegistration(): { ensureRegistered: () => Promise<void> } {
  const { isAuthenticated } = useAuthState();
  const { hasBootstrapped } = useAuthBootstrap();
  const { register } = useRegisterDevice();
  const { unregister } = useUnregisterDevice();
  const registeredRef = useRef(false);

  const ensureRegistered = useCallback(async () => {
    if (registeredRef.current) return;
    const service = getNotificationService();
    if ((await service.getPermissionStatus()) !== "granted") return;
    const token = await service.registerForPushToken();
    if (token) {
      registeredRef.current = true;
      register(token);
    }
  }, [register]);

  // Auto-register when already authorized (permission granted in a prior run).
  useEffect(() => {
    if (isAuthenticated && hasBootstrapped) void ensureRegistered();
  }, [isAuthenticated, hasBootstrapped, ensureRegistered]);

  // Unregister on the authenticated → signed-out transition.
  const prevAuth = useRef(isAuthenticated);
  useEffect(() => {
    if (prevAuth.current && !isAuthenticated) {
      registeredRef.current = false;
      void getNotificationService()
        .getStoredToken()
        .then((token) => {
          if (token) unregister(token);
        });
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated, unregister]);

  return { ensureRegistered };
}
