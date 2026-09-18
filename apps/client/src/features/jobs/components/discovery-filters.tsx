import { Input, Sheet, Text, useEditorialPalette, XStack, YStack } from "@patch-careers/ui";
import { PillButton } from "@patch-careers/ui/editorial";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useI18n } from "@/providers/i18n-provider";
import { useEnumLabel } from "../hooks/use-enum-label";
import { EMPLOYMENT_TYPE_OPTIONS, WORK_MODE_OPTIONS } from "../lib/helpers";
import { EMPTY_JOBS_FILTERS, type JobsFilters, type PostedWithin } from "../types";
import { FilterChip } from "./filter-chip";

export function DiscoveryFilters({
  open,
  onOpenChange,
  filters,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: JobsFilters;
  onApply: (filters: JobsFilters) => void;
}) {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const form = useForm<JobsFilters>({ defaultValues: filters });
  const modeLabel = useEnumLabel("RemotePolicy");
  const typeLabel = useEnumLabel("JobType");
  useEffect(() => {
    if (open) form.reset(filters);
  }, [open, filters, form.reset]);
  const periods: { value: PostedWithin | null; label: string }[] = [
    { value: null, label: t("jobs.postedWithin.any") },
    { value: "TODAY", label: t("jobs.postedWithin.today") },
    { value: "LAST_WEEK", label: t("jobs.postedWithin.lastWeek") },
    { value: "LAST_MONTH", label: t("jobs.desktop.lastMonth") },
  ];
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("jobs.desktop.filters")}
      closeLabel={t("jobs.filters.close")}
      presentation="card"
    >
      <YStack gap={24}>
        {(["search", "location"] as const).map((name) => (
          <YStack key={name} gap={8}>
            <Text fontSize={12} color={palette.body}>
              {t(`jobs.desktop.${name}`)}
            </Text>
            <Controller
              control={form.control}
              name={name}
              render={({ field }) => (
                <Input
                  accessibilityLabel={t(`jobs.desktop.${name}`)}
                  value={field.value ?? ""}
                  onChangeText={field.onChange}
                  maxLength={200}
                  placeholder={t(`jobs.desktop.${name}Placeholder`)}
                  backgroundColor={palette.panel}
                  borderColor={palette.hairlineStrong}
                  borderRadius={10}
                  color={palette.ink}
                  fontSize={13}
                />
              )}
            />
          </YStack>
        ))}
        <Controller
          control={form.control}
          name="workModes"
          render={({ field }) => (
            <YStack gap={10}>
              <Text fontSize={12} color={palette.body}>
                {t("jobs.filters.groups.workMode")}
              </Text>
              <XStack gap={8} flexWrap="wrap">
                {WORK_MODE_OPTIONS.map((value) => (
                  <FilterChip
                    key={value}
                    label={modeLabel(value)}
                    selected={field.value.includes(value)}
                    onPress={() =>
                      field.onChange(
                        field.value.includes(value)
                          ? field.value.filter((v) => v !== value)
                          : [...field.value, value],
                      )
                    }
                  />
                ))}
              </XStack>
            </YStack>
          )}
        />
        <Controller
          control={form.control}
          name="employmentTypes"
          render={({ field }) => (
            <YStack gap={10}>
              <Text fontSize={12} color={palette.body}>
                {t("jobs.filters.groups.employmentType")}
              </Text>
              <XStack gap={8} flexWrap="wrap">
                {EMPLOYMENT_TYPE_OPTIONS.map((value) => (
                  <FilterChip
                    key={value}
                    label={typeLabel(value)}
                    selected={field.value.includes(value)}
                    onPress={() =>
                      field.onChange(
                        field.value.includes(value)
                          ? field.value.filter((v) => v !== value)
                          : [...field.value, value],
                      )
                    }
                  />
                ))}
              </XStack>
            </YStack>
          )}
        />
        <Controller
          control={form.control}
          name="postedWithin"
          render={({ field }) => (
            <YStack gap={10}>
              <Text fontSize={12} color={palette.body}>
                {t("jobs.filters.groups.postedWithin")}
              </Text>
              <XStack gap={8} flexWrap="wrap">
                {periods.map(({ value, label }) => (
                  <FilterChip
                    key={value ?? "any"}
                    label={label}
                    selected={field.value === value}
                    onPress={() => field.onChange(value)}
                  />
                ))}
              </XStack>
            </YStack>
          )}
        />
        <XStack
          justifyContent="space-between"
          alignItems="center"
          gap={16}
          borderTopWidth={1}
          borderTopColor={palette.hairline}
          paddingTop={18}
        >
          <PillButton
            variant="ghost"
            label={t("jobs.filters.clearAll")}
            onPress={() => form.reset(EMPTY_JOBS_FILTERS)}
          />
          <PillButton
            borderRadius={10}
            label={t("jobs.desktop.applyFilters")}
            onPress={form.handleSubmit((values) => {
              onApply({
                ...values,
                search: values.search?.trim() ?? "",
                location: values.location?.trim() ?? "",
              });
              onOpenChange(false);
            })}
          />
        </XStack>
      </YStack>
    </Sheet>
  );
}
