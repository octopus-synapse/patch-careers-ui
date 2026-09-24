import { Text, useEditorialPalette, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, PillButton } from "@patch-careers/ui/editorial";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { LayoutGrid, List, SlidersHorizontal } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, SectionList, useWindowDimensions } from "react-native";
import { useAppRouter } from "@/navigation/use-app-router";
import { useAuthState } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import { seedExternalJob } from "../hooks/queries";
import { useDiscovery } from "../hooks/use-discovery";
import { useJobsWorkspace } from "../hooks/use-jobs-workspace";
import { useMasterJobScores } from "../hooks/use-master-job-scores";
import { useToggleSaveJob } from "../hooks/use-save-job";
import type { Opportunity } from "../lib/discovery";
import { discoveryParams, readDiscoveryRoute } from "../lib/discovery-route";
import { jobsViewport } from "../lib/responsive-layout";
import { type JobsLayout, useJobsLayoutStore } from "../model/jobs-layout-store";
import type { JobsFilters, JobsScope } from "../types";
import { ActiveFilterChips } from "./active-filter-chips";
import { DiscoveryFilters } from "./discovery-filters";
import { JobComposer } from "./job-composer";
import { OpportunityCard } from "./opportunity-card";

type JobRow = Opportunity[];

export function JobsMobileScreen() {
  const palette = useEditorialPalette();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const viewport = jobsViewport(width);
  const tablet = viewport.canChooseLayout;
  const columns = viewport.presentation === "compact" ? viewport.gridColumns : 2;
  const bottomInset = useBottomTabBarHeight();
  const router = useAppRouter();
  const client = useQueryClient();
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const routeKey = JSON.stringify(params);
  const { scope, filters } = useMemo(() => readDiscoveryRoute(JSON.parse(routeKey)), [routeKey]);
  useEffect(() => {
    if (scope === "applications") router.replace("/applications");
  }, [router, scope]);
  const workspace = useJobsWorkspace();
  const data = useDiscovery(filters, workspace.entries);
  const save = useToggleSaveJob();
  const { currentUser } = useAuthState();
  const storedLayout = useJobsLayoutStore((state) =>
    currentUser ? (state.layouts[currentUser.userId] ?? "list") : "list",
  );
  const setStoredLayout = useJobsLayoutStore((state) => state.setLayout);
  const layout: JobsLayout = tablet ? storedLayout : "list";
  const [filterOpen, setFilterOpen] = useState(false);
  const allJobs = data.groups.recommended;
  const jobs = scope === "saved" ? data.saved.jobs : allJobs;
  const { scores } = useMasterJobScores(
    jobs
      .filter((job) => (!("source" in job) || job.source !== "imported") && job.id !== job.savedId)
      .map((job) => job.id),
  );
  const rows = useMemo<JobRow[]>(() => {
    const size = layout === "grid" ? columns : 1;
    return Array.from({ length: Math.ceil(jobs.length / size) }, (_, index) =>
      jobs.slice(index * size, index * size + size),
    );
  }, [columns, jobs, layout]);
  const source =
    scope === "saved"
      ? data.saved
      : data.recommended.data?.items.length
        ? data.recommended
        : data.catalog;
  const applyFilters = (next: JobsFilters) => router.setParams(discoveryParams(scope, null, next));
  const navigateScope = (next: JobsScope) => router.setParams(discoveryParams(next, null, filters));
  const loadMore = () => {
    if (source.hasNextPage && !source.isFetchingNextPage) void source.fetchNextPage();
  };

  return (
    <YStack testID="jobs-mobile" flex={1} backgroundColor={palette.bg}>
      <SectionList
        sections={[{ key: "jobs", data: rows }]}
        key={`${layout}-${columns}`}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 28 }}
        ListHeaderComponent={
          <YStack
            width="100%"
            maxWidth={880}
            alignSelf="center"
            paddingHorizontal={20}
            paddingTop={22}
          >
            <YStack gap={8} marginBottom={22}>
              <Text
                accessibilityRole="header"
                fontFamily={editorialFonts.serif}
                fontSize={34}
                lineHeight={42}
                letterSpacing={-0.8}
                color={palette.ink}
              >
                {t("jobs.title")}
              </Text>
              <Text fontSize={12} lineHeight={20} color={palette.muted}>
                {t("jobs.desktop.tagline")}
              </Text>
            </YStack>
            {scope === "all" ? <JobComposer compact /> : null}
          </YStack>
        }
        renderSectionHeader={() => (
          <YStack backgroundColor={palette.bg} paddingTop={8} paddingBottom={10} gap={10}>
            <YStack width="100%" maxWidth={880} alignSelf="center" paddingHorizontal={20} gap={10}>
              <XStack alignItems="center" justifyContent="space-between" gap={10}>
                <XStack gap={8}>
                  {(["all", "saved"] as const).map((value) => (
                    <PillButton
                      key={value}
                      variant={scope === value ? "solid" : "ghost"}
                      label={t(
                        value === "all" ? "jobs.desktop.opportunitiesTab" : "jobs.scope.saved",
                      )}
                      onPress={() => navigateScope(value)}
                    />
                  ))}
                </XStack>
                <XStack gap={6}>
                  <PillButton
                    label={t("jobs.desktop.filters")}
                    minHeight={40}
                    borderRadius={10}
                    onPress={() => setFilterOpen(true)}
                    renderIcon={({ color }) => <SlidersHorizontal size={15} color={color} />}
                  />
                  {tablet
                    ? (["list", "grid"] as const).map((value) => (
                        <Pressable
                          key={value}
                          accessibilityRole="button"
                          accessibilityLabel={t(
                            value === "list" ? "jobs.desktop.viewList" : "jobs.desktop.viewGrid",
                          )}
                          accessibilityState={{ selected: layout === value }}
                          onPress={() => {
                            if (currentUser) setStoredLayout(currentUser.userId, value);
                          }}
                        >
                          <YStack
                            width={38}
                            height={38}
                            borderRadius={8}
                            alignItems="center"
                            justifyContent="center"
                            backgroundColor={
                              layout === value ? `${palette.accent}20` : palette.surface
                            }
                          >
                            {value === "list" ? (
                              <List size={17} color={palette.ink} />
                            ) : (
                              <LayoutGrid size={17} color={palette.ink} />
                            )}
                          </YStack>
                        </Pressable>
                      ))
                    : null}
                </XStack>
              </XStack>
              <ActiveFilterChips filters={filters} onChange={applyFilters} />
            </YStack>
          </YStack>
        )}
        renderItem={({ item }) => (
          <XStack
            width="100%"
            maxWidth={880}
            alignSelf="center"
            paddingHorizontal={20}
            gap={12}
            marginBottom={12}
          >
            {item.map((job) => (
              <YStack key={job.id} flex={1}>
                <OpportunityCard
                  job={job}
                  score={scores[job.id]}
                  list={layout === "list"}
                  pending={save.pendingId === job.externalId}
                  onSave={job.source === "imported" ? undefined : save.toggle}
                  onVisit={(visited) => seedExternalJob(client, visited)}
                />
              </YStack>
            ))}
            {layout === "grid" && item.length === 1 ? <YStack flex={1} /> : null}
          </XStack>
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        ListEmptyComponent={
          data.isLoading ? (
            <YStack padding={48} alignItems="center">
              <ActivityIndicator color={palette.accent} />
            </YStack>
          ) : (
            <YStack padding={48} alignItems="center">
              <Text color={palette.muted}>{t("jobs.desktop.noResults")}</Text>
            </YStack>
          )
        }
        ListFooterComponent={
          source.isFetchingNextPage ? <ActivityIndicator color={palette.accent} /> : null
        }
      />
      <DiscoveryFilters
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onApply={applyFilters}
      />
    </YStack>
  );
}
