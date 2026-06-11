/**
 * Always-visible filter row (no hidden filter drawer): a "Remoto" toggle
 * followed by single-select employment-type chips. Selected chips invert to
 * the editorial ink fill — the same primary treatment the CTA uses — so the
 * active filter reads at a glance in both themes.
 */

import { type JobType, labelFor } from "@patch-careers/api-client";
import { Text } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { Pressable, ScrollView } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { EMPLOYMENT_TYPE_OPTIONS } from "../lib/helpers";
import type { JobsFilters } from "../types";

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}): ReactElement {
  const editorialPalette = useEditorialPalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Filtro ${label}`}
      onPress={onPress}
      // Visual height is 34 — extend the hit area to the 44pt minimum.
      hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
      style={({ pressed }) => ({
        paddingHorizontal: 14,
        height: 34,
        borderRadius: 17,
        borderWidth: 1,
        justifyContent: "center" as const,
        borderColor: selected ? editorialPalette.primary : editorialPalette.hairlineStrong,
        backgroundColor: selected
          ? editorialPalette.primary
          : pressed
            ? editorialPalette.bg
            : editorialPalette.surface,
      })}
    >
      <Text
        preset="caption"
        fontSize={13}
        fontWeight={selected ? "600" : "400"}
        color={selected ? editorialPalette.onPrimary : editorialPalette.body}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function JobFilterChips({
  filters,
  onToggleRemote,
  onSelectEmploymentType,
}: {
  filters: JobsFilters;
  onToggleRemote: () => void;
  onSelectEmploymentType: (type: JobType | null) => void;
}): ReactElement {
  const { locale } = useI18n();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
    >
      <Chip label="Remoto" selected={filters.remoteOnly} onPress={onToggleRemote} />
      {EMPLOYMENT_TYPE_OPTIONS.map((type) => {
        const selected = filters.employmentType === type;
        return (
          <Chip
            key={type}
            label={labelFor("JobType", type, locale)}
            selected={selected}
            onPress={() => onSelectEmploymentType(selected ? null : type)}
          />
        );
      })}
    </ScrollView>
  );
}
