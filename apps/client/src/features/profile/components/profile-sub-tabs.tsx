/**
 * Sub-tab bar for the Profile screen ("Perfil · Currículos") — rendered through
 * the shared `FrostedPillTabs` primitive, the EXACT same frosted-glass pill row
 * as the Jobs scope tabs ("Todas · Salvas · Candidaturas"). This file owns only
 * the two profile scopes, their icons, and the i18n labels.
 *
 * Icons use Ionicons filled/outline PAIRS (like the Jobs tabs): the filled
 * Ionicons are purpose-drawn solids (inner detail kept as negative space), so
 * they read clean when active — unlike filling a lucide stroke glyph.
 */
import { Ionicons } from "@expo/vector-icons";
import { type FrostedPillTab, FrostedPillTabs } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { useI18n } from "@/providers/i18n-provider";

type IoniconName = keyof typeof Ionicons.glyphMap;

export type ProfileSubTab = "perfil" | "curriculos";

// Filled glyph when active, outline when inactive — same pattern as Jobs.
const ionIcon =
  (filled: IoniconName, outline: IoniconName) =>
  (color: string, size: number, active: boolean): ReactElement => (
    <Ionicons name={active ? filled : outline} size={size} color={color} />
  );

export function ProfileSubTabs({
  value,
  onChange,
}: {
  value: ProfileSubTab;
  onChange: (tab: ProfileSubTab) => void;
}): ReactElement {
  const { t } = useI18n();
  const tabs: ReadonlyArray<FrostedPillTab<ProfileSubTab>> = [
    {
      key: "perfil",
      label: t("profile.subTabs.profile"),
      renderIcon: ionIcon("person", "person-outline"),
    },
    {
      key: "curriculos",
      label: t("profile.subTabs.resumes"),
      renderIcon: ionIcon("documents", "documents-outline"),
    },
  ];
  return <FrostedPillTabs tabs={tabs} value={value} onChange={onChange} size="md" />;
}
