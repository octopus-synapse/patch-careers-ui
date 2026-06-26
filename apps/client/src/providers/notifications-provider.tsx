/**
 * Wires the notification service into the running app. Mounted inside
 * AuthProvider (so it sees auth + the React Query client + useToast + router):
 *
 *   - creates the Android channel
 *   - installs the foreground handler → in-app toast for high-signal types +
 *     refresh the inbox/badge (the OS banner is suppressed in foreground)
 *   - installs the tap (response) listener → mark read + deep-link
 *   - handles a cold-start tap (app opened from a killed state)
 *   - delegates device-token registration to usePushRegistration
 *
 * The OS listeners are installed once on mount and read the latest
 * toast/router/query-client through refs, so re-renders never leak or
 * duplicate subscriptions. `ensureRegistered` is exposed via context so the
 * Notifications tab's soft pre-prompt can register the token immediately after
 * the user opts in.
 */

import { useToast } from "@patch-careers/ui";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  createContext,
  type ReactElement,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  getNotificationService,
  intentForType,
  invalidateNotifications,
  isToastEligible,
  type NotificationPayload,
  routeForNotification,
  toastTitleKeyForType,
  useMarkRead,
  usePushRegistration,
} from "@/features/notifications";
import { useAuthBootstrap, useAuthState } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

type NotificationsContextValue = { ensureRegistered: () => Promise<void> };

const NotificationsContext = createContext<NotificationsContextValue>({
  ensureRegistered: async () => undefined,
});

type ToastApi = ReturnType<typeof useToast>;
type RouterApi = ReturnType<typeof useRouter>;
type Translator = ReturnType<typeof useI18n>["t"];

export function NotificationsProvider({ children }: { children: ReactNode }): ReactElement {
  const { isAuthenticated } = useAuthState();
  const { hasBootstrapped } = useAuthBootstrap();
  const toast = useToast();
  const router = useRouter();
  const qc = useQueryClient();
  const { t } = useI18n();
  const { markOne } = useMarkRead();
  const { ensureRegistered } = usePushRegistration();

  // Latest values, read by the once-installed OS listeners.
  const toastRef = useRef<ToastApi>(toast);
  const routerRef = useRef<RouterApi>(router);
  const qcRef = useRef<QueryClient>(qc);
  const tRef = useRef<Translator>(t);
  const markOneRef = useRef(markOne);
  toastRef.current = toast;
  routerRef.current = router;
  qcRef.current = qc;
  tRef.current = t;
  markOneRef.current = markOne;

  const handleTap = useRef((data: NotificationPayload) => {
    if (data.notificationId) markOneRef.current(data.notificationId);
    routerRef.current.push(routeForNotification(data));
  });

  // Channel + foreground toast + tap listener — installed exactly once.
  useEffect(() => {
    const service = getNotificationService();
    void service.setupAndroidChannel();

    const unsubscribeForeground = service.setForegroundHandler(({ title, body, data }) => {
      if (isToastEligible(data.type)) {
        toastRef.current.show({
          title: title || tRef.current(toastTitleKeyForType(data.type)),
          message: body,
          intent: intentForType(data.type),
        });
      }
      invalidateNotifications(qcRef.current);
    });

    const unsubscribeResponse = service.addResponseListener((data) => handleTap.current(data));
    return () => {
      unsubscribeForeground();
      unsubscribeResponse();
    };
  }, []);

  // Cold-start: if a tap launched the app, route once (auth must be ready).
  const initialHandled = useRef(false);
  useEffect(() => {
    if (initialHandled.current || !(isAuthenticated && hasBootstrapped)) return;
    initialHandled.current = true;
    void getNotificationService()
      .getInitialTap()
      .then((data) => {
        if (data?.type) handleTap.current(data);
      });
  }, [isAuthenticated, hasBootstrapped]);

  const value = useMemo<NotificationsContextValue>(
    () => ({ ensureRegistered }),
    [ensureRegistered],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsContextValue {
  return useContext(NotificationsContext);
}
