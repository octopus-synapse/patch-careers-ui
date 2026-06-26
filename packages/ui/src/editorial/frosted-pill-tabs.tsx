/**
 * FrostedPillTabs — a centered, horizontally-scrollable row of `FrostedPill`s
 * used as a tab / scope selector. The Jobs scope tabs ("Todas · Salvas ·
 * Candidaturas") AND the Profile sub-tabs ("Perfil · Currículos") both render
 * through this, so they share the EXACT same frosted-glass material, row
 * layout, selection guard and haptic feel (DRY). The pill material itself comes
 * from `FrostedPill` (and its `FROSTED_PILL_STATE` tokens, also reused by the
 * Profile "add section" CTA), so all three surfaces stay in lockstep.
 *
 * Icon-agnostic by design: each tab supplies a `renderIcon` render-prop that
 * receives the resolved per-state ink color, the size-appropriate icon size and
 * the active flag, so callers own their icon set (Ionicons, lucide…) without
 * this package depending on any icon library.
 *
 * The row centers when the pills fit and scrolls horizontally when they don't.
 */
import * as Haptics from "expo-haptics";
import type { ReactElement, ReactNode } from "react";
import { Platform, ScrollView } from "react-native";
import { FrostedPill, type FrostedPillSize } from "./frosted-pill";

export interface FrostedPillTab<T extends string> {
  key: T;
  label: string;
  /** Leading glyph; receives the resolved ink color, icon size and active flag. */
  renderIcon?: (color: string, size: number, active: boolean) => ReactNode;
}

export interface FrostedPillTabsProps<T extends string> {
  tabs: ReadonlyArray<FrostedPillTab<T>>;
  value: T;
  onChange: (key: T) => void;
  /** Pill density. Defaults to `sm` — the compact tab/scope size. */
  size?: FrostedPillSize;
}

export function FrostedPillTabs<T extends string>({
  tabs,
  value,
  onChange,
  size = "sm",
}: FrostedPillTabsProps<T>): ReactElement {
  return (
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
      {tabs.map((tab) => {
        const focused = tab.key === value;
        const { renderIcon } = tab;
        // Spread the leading render-prop only when present — `exactOptionalPropertyTypes`
        // forbids passing `renderLeading={undefined}` explicitly.
        const leading = renderIcon
          ? {
              renderLeading: (color: string, iconSize: number) =>
                renderIcon(color, iconSize, focused),
            }
          : {};
        return (
          <FrostedPill
            key={tab.key}
            active={focused}
            size={size}
            label={tab.label}
            {...leading}
            onPress={() => {
              if (focused) return;
              if (Platform.OS !== "web") void Haptics.selectionAsync();
              onChange(tab.key);
            }}
          />
        );
      })}
    </ScrollView>
  );
}
