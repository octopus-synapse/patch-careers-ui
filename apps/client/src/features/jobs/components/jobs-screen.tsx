/**
 * Jobs tab — external listings from the daily JSearch batch.
 *
 * Editorial chrome (serif heading, "Todas | Salvas" segments, a single
 * filter button) stays fixed; only the list scrolls. Filters live in a
 * modal sheet and commit on "Aplicar"; the active ones echo back as
 * removable chips with a result count underneath. The list is an endless
 * scroll grouped into period sections (Hoje / Esta semana / Anteriores),
 * with pull-to-refresh, skeleton first paint and recoverable error/empty
 * states. Search happens in the global header — there is no local field.
 */

import { EmptyState, Icon, Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, SegmentedTabs, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import { Bookmark, BriefcaseBusiness, SearchX, SlidersHorizontal } from "lucide-react-native";
import { type ReactElement, useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, SectionList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useI18n } from "@/providers/i18n-provider";
import { useExternalJobs } from "../hooks/queries";
import { useToggleSaveJob } from "../hooks/use-save-job";
import { groupJobsByPeriod, hasActiveFilters } from "../lib/helpers";
import { EMPTY_JOBS_FILTERS, type ExternalJob, type JobsFilters, type JobsScope } from "../types";
import { ActiveFilterChips } from "./active-filter-chips";
import { JobListSkeleton } from "./job-list-skeleton";
import { JobRow } from "./job-row";
import { JobSectionHeader } from "./job-section-header";
import { JobsFilterSheet } from "./jobs-filter-sheet";

function RowSeparator(): ReactElement {
  const editorialPalette = useEditorialPalette();
  return <View style={{ height: 1, marginLeft: 20, backgroundColor: editorialPalette.hairline }} />;
}

export function JobsScreen(): ReactElement {
  const editorialPalette = useEditorialPalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const [scope, setScope] = useState<JobsScope>("all");
  const [filters, setFilters] = useState<JobsFilters>(EMPTY_JOBS_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const list = useExternalJobs(filters, scope);
  const { toggle: toggleSave, pendingId } = useToggleSaveJob();
  // One recency anchor per mount — a per-render Date.now() would defeat the
  // section memo below.
  const [now] = useState(() => Date.now());
  const filtersActive = hasActiveFilters(filters);
  const showFilters = scope === "all";

  const sections = useMemo(() => groupJobsByPeriod(list.jobs, now), [list.jobs, now]);

  const scopeTabs = useMemo<ReadonlyArray<{ key: JobsScope; label: string }>>(
    () => [
      { key: "all", label: t("jobs.scope.all") },
      { key: "saved", label: t("jobs.scope.saved") },
    ],
    [t],
  );

  const openJob = useCallback(
    (job: ExternalJob) => {
      router.push({ pathname: "/job/[id]", params: { id: job.id } });
    },
    [router],
  );

  function clearFilters(): void {
    setFilters(EMPTY_JOBS_FILTERS);
  }

  function countLine(): string {
    if (list.isLoading) return t("jobs.count.updatedDaily");
    const variant = scope === "saved" ? "saved" : filtersActive ? "results" : "jobs";
    const plural = list.total === 1 ? "one" : "many";
    return t(`jobs.count.${variant}.${plural}`, { count: list.total });
  }

  function body(): ReactElement {
    if (list.isLoading) return <JobListSkeleton />;

    if (list.isError) {
      return (
        <YStack flex={1} justifyContent="center">
          <EmptyState
            icon={<Icon as={BriefcaseBusiness} size={32} color={editorialPalette.subtle} />}
            title={t("jobs.empty.error.title")}
            description={t("jobs.empty.error.description")}
            ctaLabel={t("jobs.empty.error.cta")}
            onCta={list.refetch}
          />
        </YStack>
      );
    }

    if (list.jobs.length === 0) {
      if (scope === "saved") {
        return (
          <YStack flex={1} justifyContent="center">
            <EmptyState
              icon={<Icon as={Bookmark} size={32} color={editorialPalette.subtle} />}
              title={t("jobs.empty.saved.title")}
              description={t("jobs.empty.saved.description")}
              ctaLabel={t("jobs.empty.saved.cta")}
              onCta={() => setScope("all")}
            />
          </YStack>
        );
      }
      return (
        <YStack flex={1} justifyContent="center">
          {filtersActive ? (
            <EmptyState
              icon={<Icon as={SearchX} size={32} color={editorialPalette.subtle} />}
              title={t("jobs.empty.filtered.title")}
              description={t("jobs.empty.filtered.description")}
              ctaLabel={t("jobs.empty.filtered.cta")}
              onCta={clearFilters}
            />
          ) : (
            <EmptyState
              icon={<Icon as={BriefcaseBusiness} size={32} color={editorialPalette.subtle} />}
              title={t("jobs.empty.none.title")}
              description={t("jobs.empty.none.description")}
            />
          )}
        </YStack>
      );
    }

    return (
      <SectionList
        sections={sections}
        keyExtractor={(job) => job.id}
        renderItem={({ item }) => (
          <JobRow
            job={item}
            now={now}
            onPress={openJob}
            onToggleSave={toggleSave}
            savePending={pendingId === item.externalId}
          />
        )}
        renderSectionHeader={({ section }) => <JobSectionHeader sectionKey={section.key} />}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={RowSeparator}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage();
        }}
        refreshControl={
          <RefreshControl
            refreshing={list.isRefetching}
            onRefresh={list.refetch}
            tintColor={editorialPalette.muted}
          />
        }
        ListFooterComponent={
          list.isFetchingNextPage ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator size="small" color={editorialPalette.muted} />
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: editorialPalette.bg }}>
      <YStack gap={20} paddingTop={28} paddingBottom={16}>
        <YStack paddingHorizontal={20}>
          <Text
            fontFamily={editorialFonts.serif}
            fontSize={34}
            // Without an explicit lineHeight the serif descenders ("g") get
            // clipped by the default line box.
            lineHeight={46}
            color={editorialPalette.ink}
            textAlign="center"
          >
            {t("jobs.title")}
          </Text>
        </YStack>

        <SegmentedTabs tabs={scopeTabs} value={scope} onChange={setScope} />

        <XStack
          paddingHorizontal={20}
          alignItems="center"
          justifyContent="space-between"
          gap={12}
          // The filter pill (34px) dictates the row height; keep it stable in
          // the saved scope too so the list doesn't jump between tabs.
          minHeight={34}
        >
          <Text preset="caption" fontSize={12} color={editorialPalette.subtle}>
            {countLine()}
          </Text>
          {showFilters ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("jobs.filters.buttonA11y")}
              accessibilityState={{ selected: filtersActive }}
              onPress={() => setSheetOpen(true)}
              hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
              style={({ pressed }) => ({
                flexDirection: "row" as const,
                alignItems: "center" as const,
                gap: 8,
                paddingHorizontal: 14,
                height: 34,
                borderRadius: 17,
                borderWidth: 1,
                borderColor: editorialPalette.hairlineStrong,
                backgroundColor: pressed ? editorialPalette.bg : editorialPalette.surface,
              })}
            >
              <Icon as={SlidersHorizontal} size={14} color={editorialPalette.body} />
              <Text preset="caption" fontSize={13} color={editorialPalette.body}>
                {t("jobs.filters.button")}
              </Text>
              {filtersActive ? (
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: editorialPalette.primary,
                  }}
                />
              ) : null}
            </Pressable>
          ) : null}
        </XStack>

        {showFilters ? <ActiveFilterChips filters={filters} onChange={setFilters} /> : null}
      </YStack>
      <View style={{ height: 1, backgroundColor: editorialPalette.hairline }} />
      {body()}

      <JobsFilterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        filters={filters}
        onApply={setFilters}
      />
    </View>
  );
}
