/**
 * Notifications — a stacked screen reached from the AppHeader bell (the tab
 * slot it used to occupy now belongs to Currículos). A grouped, polled inbox
 * (Hoje / Esta semana / Antes) with a "mark all read" action; tapping a row
 * marks it read and deep-links to the related entity.
 *
 * On the first visit we show a soft pre-prompt before the OS permission dialog
 * (a denial is permanent until the user opens system settings), and only
 * request permission + register the push token when they opt in.
 */

import { mundane } from "@patch-careers/storage";
import { XStack, YStack } from "@patch-careers/ui";
import { useFocusEffect, useRouter } from "expo-router";
import { type ReactElement, useCallback, useState } from "react";
import { SettingsScreenShell } from "@/components/settings-screen-shell";
import {
  getNotificationService,
  MarkAllReadAction,
  NotificationEmptyState,
  NotificationErrorState,
  type NotificationItem,
  NotificationListSkeleton,
  NotificationSectionList,
  PushPrepromptSheet,
  routeForNotification,
  useMarkRead,
  useNotificationInbox,
  useUnreadCount,
} from "@/features/notifications";
import { useI18n } from "@/providers/i18n-provider";
import { useNotifications } from "@/providers/notifications-provider";

const PREPROMPT_SEEN_KEY = "push.prepromptSeen";

export default function NotificationsScreen(): ReactElement {
  const { t } = useI18n();
  const router = useRouter();
  const inbox = useNotificationInbox();
  const unread = useUnreadCount();
  const { markAll, markOne } = useMarkRead();
  const { ensureRegistered } = useNotifications();
  const [prepromptOpen, setPrepromptOpen] = useState(false);
  const now = Date.now();

  const onPressItem = useCallback(
    (item: NotificationItem) => {
      if (!item.read) markOne(item.id);
      router.push(routeForNotification({ type: item.type, entityId: item.entityId }));
    },
    [markOne, router],
  );

  // First-visit soft pre-prompt: only when permission is still undetermined and
  // we haven't shown it before.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        if ((await mundane.getItem(PREPROMPT_SEEN_KEY)) === "1") return;
        const status = await getNotificationService().getPermissionStatus();
        if (active && status === "undetermined") setPrepromptOpen(true);
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const dismissPreprompt = useCallback(() => {
    setPrepromptOpen(false);
    void mundane.setItem(PREPROMPT_SEEN_KEY, "1");
  }, []);

  const enablePush = useCallback(() => {
    setPrepromptOpen(false);
    void mundane.setItem(PREPROMPT_SEEN_KEY, "1");
    void (async () => {
      await getNotificationService().requestPermission();
      await ensureRegistered();
    })();
  }, [ensureRegistered]);

  return (
    <SettingsScreenShell title={t("notifications.title")} scroll={false}>
      <XStack justifyContent="flex-end" paddingHorizontal={20} minHeight={24}>
        <MarkAllReadAction disabled={unread === 0} onPress={markAll} />
      </XStack>

      <YStack flex={1} marginTop={4}>
        {inbox.isLoading ? (
          <NotificationListSkeleton />
        ) : inbox.isError ? (
          <NotificationErrorState onRetry={inbox.refetch} />
        ) : inbox.items.length === 0 ? (
          <NotificationEmptyState />
        ) : (
          <NotificationSectionList items={inbox.items} now={now} onPressItem={onPressItem} />
        )}
      </YStack>

      <PushPrepromptSheet
        open={prepromptOpen}
        onOpenChange={setPrepromptOpen}
        onEnable={enablePush}
        onDismiss={dismissPreprompt}
      />
    </SettingsScreenShell>
  );
}
