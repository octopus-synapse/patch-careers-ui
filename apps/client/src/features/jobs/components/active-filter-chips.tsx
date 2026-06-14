/**
 * Horizontal row of the *active* filters as removable chips (one per
 * selected value). Renders nothing when no filter is on — the row only
 * appears as feedback, never as permanent chrome.
 */

import type { ReactElement } from "react";
import { ScrollView } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { activeFilterChips } from "../lib/helpers";
import type { JobsFilters } from "../types";
import { FilterChip } from "./filter-chip";

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
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
    >
      {chips.map((chip) => (
        <FilterChip
          key={chip.key}
          label={chip.label}
          selected
          removable
          onPress={() => onChange(chip.remove(filters))}
        />
      ))}
    </ScrollView>
  );
}
