/**
 * Jobs scope tabs ("Todas · Salvas · Candidaturas") — a row of INDIVIDUAL
 * frosted pills (not a single segmented capsule). Each scope is its own
 * rounded-full glass capsule: the active one is bright frosted glass with dark
 * ink text + a filled glyph; the inactive ones are deep translucent glass with
 * light text + an outline glyph.
 *
 * The pill material comes from the shared `FrostedPill` primitive
 * (`@patch-careers/ui/editorial`), so these scope tabs and the active filter
 * chips render the EXACT same thing (DRY). This file owns only the scope set,
 * the per-scope icons, and the navigation wiring.
 */
import { Ionicons } from "@expo/vector-icons";
import { FrostedPill } from "@patch-careers/ui/editorial";
import * as Haptics from "expo-haptics";
import type { ReactElement } from "react";
import { Platform, ScrollView } from "react-native";
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
    // Centered when the three pills fit; horizontally scrollable when
    // "Candidaturas" pushes them past a narrow viewport.
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        flexGrow: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        paddingHorizontal: 16,
      }}
    >
      {SCOPES.map((scope) => {
        const focused = scope.key === value;
        return (
          <FrostedPill
            key={scope.key}
            active={focused}
            size="sm"
            label={t(`jobs.scope.${scope.key}`)}
            renderLeading={(color, iconSize) => (
              <Ionicons
                name={focused ? scope.filled : scope.outline}
                size={iconSize}
                color={color}
              />
            )}
            onPress={() => {
              if (focused) return;
              if (Platform.OS !== "web") void Haptics.selectionAsync();
              onChange(scope.key);
            }}
          />
        );
      })}
    </ScrollView>
  );
}
