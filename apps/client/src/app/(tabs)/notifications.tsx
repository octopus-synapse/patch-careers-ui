import type { ReactElement } from "react";
import { PlaceholderScreen } from "@/components/placeholder-screen";
import { useI18n } from "@/providers/i18n-provider";

export default function NotificationsScreen(): ReactElement {
  const { t } = useI18n();
  return <PlaceholderScreen title={t("tabs.notifications")} />;
}
