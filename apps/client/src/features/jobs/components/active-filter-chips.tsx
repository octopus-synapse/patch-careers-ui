/**
 * Horizontal row of the *active* filters as removable chips (one per selected
 * value). Renders nothing when no filter is on — the row only appears as
 * feedback, never as permanent chrome.
 *
 * The chips reuse the shared `FrostedPill` in its ACTIVE state, so an applied
 * filter reads with the exact same "active pill" material as the selected
 * scope tab (Todas/Salvas/Candidaturas) — DRY. Tapping a chip removes that one
 * filter; the trailing × is the affordance.
 */

import { Ionicons } from "@expo/vector-icons";
import { FrostedPill } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { ScrollView } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { activeFilterChips } from "../lib/helpers";
import type { JobsFilters } from "../types";

export function ActiveFilterChips({
  filters,
  onChange,
}: {
  filters: JobsFilters;
  onChange: (filters: JobsFilters) => void;
}): ReactElement | null {
  const { t, locale } = useI18n();
  const chips = activeFilterChips(filters, t, locale);
  if (chips.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
    >
      {chips.map((chip) => (
        <FrostedPill
          key={chip.key}
          active
          size="sm"
          label={chip.label}
          accessibilityLabel={t("jobs.filters.removeChipA11y", { label: chip.label })}
          renderTrailing={(color, iconSize) => (
            <Ionicons name="close" size={iconSize} color={color} />
          )}
          onPress={() => onChange(chip.remove(filters))}
        />
      ))}
    </ScrollView>
  );
}
