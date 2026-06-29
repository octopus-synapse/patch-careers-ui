/**
 * Filter modal for the Jobs list, hosted in the shared `Sheet` (bottom
 * sheet native / centered card web). Selections are *pending* — the list
 * only refetches when "Aplicar" commits them; "Limpar tudo" resets the
 * pending set without closing, so the user can rebuild from zero.
 */

import { Divider, Sheet, Text, XStack, YStack } from "@patch-careers/ui";
import { PrimaryAction, useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import {
  EMPLOYMENT_TYPE_OPTIONS,
  employmentTypeLabel,
  POSTED_WITHIN_OPTIONS,
  WORK_MODE_OPTIONS,
  workModeLabel,
} from "../lib/helpers";
import { EMPTY_JOBS_FILTERS, type JobsFilters } from "../types";
import { FilterChip } from "./filter-chip";

function GroupHeading({ children }: { children: string }): ReactElement {
  const editorialPalette = useEditorialPalette();
  return (
    <Text
      preset="caption"
      fontSize={11}
      fontWeight="600"
      letterSpacing={1.6}
      textTransform="uppercase"
      color={editorialPalette.muted}
    >
      {children}
    </Text>
  );
}

function toggleValue<T>(values: readonly T[], value: T): readonly T[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

export function JobsFilterSheet({
  open,
  onOpenChange,
  filters,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: JobsFilters;
  onApply: (filters: JobsFilters) => void;
}): ReactElement {
  const editorialPalette = useEditorialPalette();
  const { t, locale } = useI18n();
  const [pending, setPending] = useState<JobsFilters>(filters);

  // Re-seed the pending selection from the applied filters every time the
  // sheet opens (render-time adjustment — no effect needed).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setPending(filters);
  }

  function apply(): void {
    onApply(pending);
    onOpenChange(false);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("jobs.filters.title")}
      closeLabel={t("jobs.filters.close")}
      snapPoints={[85]}
    >
      <YStack flex={1} minHeight={0}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <YStack gap={28} paddingTop={8} paddingBottom={24}>
            <YStack gap={12}>
              <GroupHeading>{t("jobs.filters.groups.workMode")}</GroupHeading>
              <XStack flexWrap="wrap" gap={8}>
                {WORK_MODE_OPTIONS.map((mode) => (
                  <FilterChip
                    key={mode}
                    label={workModeLabel(mode, locale)}
                    selected={pending.workModes.includes(mode)}
                    onPress={() =>
                      setPending((prev) => ({
                        ...prev,
                        workModes: toggleValue(prev.workModes, mode),
                      }))
                    }
                  />
                ))}
              </XStack>
            </YStack>

            <YStack gap={12}>
              <GroupHeading>{t("jobs.filters.groups.employmentType")}</GroupHeading>
              <XStack flexWrap="wrap" gap={8}>
                {EMPLOYMENT_TYPE_OPTIONS.map((type) => (
                  <FilterChip
                    key={type}
                    label={employmentTypeLabel(type, locale)}
                    selected={pending.employmentTypes.includes(type)}
                    onPress={() =>
                      setPending((prev) => ({
                        ...prev,
                        employmentTypes: toggleValue(prev.employmentTypes, type),
                      }))
                    }
                  />
                ))}
              </XStack>
            </YStack>

            <YStack gap={12}>
              <GroupHeading>{t("jobs.filters.groups.postedWithin")}</GroupHeading>
              <XStack flexWrap="wrap" gap={8}>
                {POSTED_WITHIN_OPTIONS.map((option) => (
                  <FilterChip
                    key={option.value ?? "any"}
                    label={t(option.labelKey)}
                    selected={pending.postedWithin === option.value}
                    onPress={() => setPending((prev) => ({ ...prev, postedWithin: option.value }))}
                  />
                ))}
              </XStack>
            </YStack>
          </YStack>
        </ScrollView>

        <Divider color={editorialPalette.hairline} />
        <YStack gap={10} paddingTop={14}>
          <PrimaryAction label={t("jobs.filters.apply")} onPress={apply} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("jobs.filters.clearAllA11y")}
            onPress={() => setPending(EMPTY_JOBS_FILTERS)}
            hitSlop={8}
          >
            <Text preset="caption" fontSize={13} color={editorialPalette.muted} textAlign="center">
              {t("jobs.filters.clearAll")}
            </Text>
          </Pressable>
        </YStack>
      </YStack>
    </Sheet>
  );
}
