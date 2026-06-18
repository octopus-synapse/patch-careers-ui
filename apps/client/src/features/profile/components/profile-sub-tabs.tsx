/**
 * Instagram-style sub-tab bar for the Profile screen: icon-only segments
 * (profile / resumes) over the shared editorial `SegmentedTabs` with its
 * sliding ink indicator. Labels still feed accessibilityLabel for VoiceOver.
 */
import { type SegmentedTab, SegmentedTabs } from "@patch-careers/ui/editorial";
import { FileText, User } from "lucide-react-native";
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
  const tabs: ReadonlyArray<SegmentedTab<ProfileSubTab>> = [
    {
      key: "perfil",
      label: t("profile.subTabs.profile"),
      icon: (color) => <User size={20} color={color} strokeWidth={1.75} />,
    },
    {
      key: "curriculos",
      label: t("profile.subTabs.resumes"),
      icon: (color) => <FileText size={20} color={color} strokeWidth={1.75} />,
    },
  ];
  return <SegmentedTabs tabs={tabs} value={value} onChange={onChange} variant="icon" />;
}
