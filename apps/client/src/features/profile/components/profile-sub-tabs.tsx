/**
 * Instagram-style sub-tab bar for the Profile screen. Thin wrapper over
 * the shared editorial `SegmentedTabs` (promoted when the Jobs tab grew
 * its own "Todas | Salvas" segments).
 */
import { SegmentedTabs } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { useI18n } from "@/providers/i18n-provider";

export type ProfileSubTab = "perfil" | "curriculos";

export function ProfileSubTabs({
  value,
  onChange,
}: {
  value: ProfileSubTab;
  onChange: (tab: ProfileSubTab) => void;
}): ReactElement {
  const { t } = useI18n();
  const tabs: ReadonlyArray<{ key: ProfileSubTab; label: string }> = [
    { key: "perfil", label: t("profile.subTabs.profile") },
    { key: "curriculos", label: t("profile.subTabs.resumes") },
  ];
  return <SegmentedTabs tabs={tabs} value={value} onChange={onChange} />;
}
