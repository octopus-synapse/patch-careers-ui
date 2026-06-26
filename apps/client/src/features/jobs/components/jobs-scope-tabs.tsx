/**
 * Jobs scope tabs ("Todas · Salvas · Candidaturas") — a row of INDIVIDUAL
 * frosted pills (not a single segmented capsule). Each scope is its own
 * rounded-full glass capsule: the active one is bright frosted glass with dark
 * ink text + a filled glyph; the inactive ones are deep translucent glass with
 * light text + an outline glyph.
 *
 * The row + pill material come from the shared `FrostedPillTabs` primitive
 * (`@patch-careers/ui/editorial`), which the Profile sub-tabs render through
 * too, so the two stay byte-for-byte identical (DRY). This file owns only the
 * scope set, the per-scope icons, and the navigation wiring.
 */
import { Ionicons } from "@expo/vector-icons";
import { FrostedPillTabs } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { useI18n } from "@/providers/i18n-provider";
import type { JobsScope } from "../types";

type IoniconName = keyof typeof Ionicons.glyphMap;

const SCOPES: ReadonlyArray<{ key: JobsScope; outline: IoniconName; filled: IoniconName }> = [
  { key: "all", outline: "briefcase-outline", filled: "briefcase" },
  { key: "saved", outline: "bookmark-outline", filled: "bookmark" },
  { key: "applications", outline: "paper-plane-outline", filled: "paper-plane" },
];

export function JobsScopeTabs({
  value,
  onChange,
}: {
  value: JobsScope;
  onChange: (scope: JobsScope) => void;
}): ReactElement {
  const { t } = useI18n();

  return (
    <FrostedPillTabs
      value={value}
      onChange={onChange}
      tabs={SCOPES.map((scope) => ({
        key: scope.key,
        label: t(`jobs.scope.${scope.key}`),
        renderIcon: (color, size, active) => (
          <Ionicons name={active ? scope.filled : scope.outline} size={size} color={color} />
        ),
      }))}
    />
  );
}
