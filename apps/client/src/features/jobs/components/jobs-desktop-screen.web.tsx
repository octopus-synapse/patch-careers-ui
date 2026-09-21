import { Text, useEditorialPalette, useToast, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, PillButton } from "@patch-careers/ui/editorial";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import Head from "expo-router/head";
import { ChevronLeft, SlidersHorizontal, X } from "lucide-react-native";
import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView } from "react-native";
import { useNavBarInset } from "@/hooks/use-nav-bar-inset";
import { useI18n } from "@/providers/i18n-provider";
import { seedExternalJob } from "../hooks/queries";
import { useDiscovery } from "../hooks/use-discovery";
import { useJobsWorkspace } from "../hooks/use-jobs-workspace";
import { useMasterJobScores } from "../hooks/use-master-job-scores";
import { useToggleSaveJob } from "../hooks/use-save-job";
import { DISCOVERY_GROUPS, type DiscoveryGroup, type Opportunity } from "../lib/discovery";
import { discoveryParams, readDiscoveryRoute } from "../lib/discovery-route";
import { activeFilterChips } from "../lib/helpers";
import { EMPTY_JOBS_FILTERS, type JobsFilters, type JobsScope } from "../types";
import { ApplicationsBoard } from "./applications-board.web";
import { DiscoveryFilters } from "./discovery-filters";
import { JobComposer } from "./job-composer.web";
import { JobGrid, JobShelf, JobsEmpty } from "./job-shelf.web";
import { OpportunityCard } from "./opportunity-card.web";

export function JobsDesktopScreen() {
  const palette = useEditorialPalette();
  const inset = useNavBarInset();
  const { t, locale } = useI18n();
  const router = useRouter();
  const client = useQueryClient();
  const toast = useToast();
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const routeKey = JSON.stringify(params);
  const { scope, group, filters } = useMemo(
    () => readDiscoveryRoute(JSON.parse(routeKey)),
    [routeKey],
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const workspace = useJobsWorkspace();
  const data = useDiscovery(filters, workspace.entries);
  const save = useToggleSaveJob();
  const visited = (job: Opportunity) => seedExternalJob(client, job);
  const allVisible: Opportunity[] = [
    ...data.groups.recommended,
    ...data.groups.similar,
    ...data.groups.recent,
    ...data.saved.jobs,
  ];
  const { scores } = useMasterJobScores(
    allVisible
      .filter((job) => job.source !== "imported" && job.id !== job.savedId)
      .map((job) => job.id),
  );
  const tabRefs = useRef<Array<HTMLElement | null>>([]);
  const tabs: { key: JobsScope; label: string; count?: number }[] = [
    { key: "all", label: t("jobs.title") },
    { key: "applications", label: t("jobs.scope.applications") },
    { key: "saved", label: t("jobs.scope.saved"), count: data.saved.total },
  ];
  const pageTitle = t(scope === "all" ? "jobs.documentTitle" : `jobs.scope.${scope}`);
  const navigate = (nextScope: JobsScope, nextGroup: DiscoveryGroup | null = null) =>
    router.push({ pathname: "/jobs", params: discoveryParams(nextScope, nextGroup, filters) });
  const applyFilters = (next: JobsFilters) => router.setParams(discoveryParams(scope, group, next));
  const chips = [
    ...(filters.search
      ? [
          {
            key: "search",
            label: filters.search,
            remove: (f: JobsFilters) => ({ ...f, search: "" }),
          },
        ]
      : []),
    ...(filters.location
      ? [
          {
            key: "location",
            label: filters.location,
            remove: (f: JobsFilters) => ({ ...f, location: "" }),
          },
        ]
      : []),
    ...activeFilterChips(filters, t, locale),
  ];
  const card = (job: Opportunity) => (
    <OpportunityCard
      key={job.id}
      job={job}
      score={scores[job.id]}
      onVisit={visited}
      onSave={job.source === "imported" ? undefined : save.toggle}
      pending={save.pendingId === job.externalId}
    />
  );
  const retry = () => {
    data.catalog.refetch();
    data.saved.refetch();
    void data.recommended.refetch();
    void workspace.refetch();
  };
  const groupContent = (section: DiscoveryGroup, full = false) => {
    const jobs =
      section === "recommended" && !data.recommended.data?.items.length
        ? [...data.groups[section]].sort((a, b) => (scores[b.id] ?? -1) - (scores[a.id] ?? -1))
        : data.groups[section];
    const failed =
      section === "recent"
        ? workspace.isError
        : section === "similar"
          ? data.catalog.isError || data.saved.isError
          : data.catalog.isError && data.recommended.isError;
    if (failed)
      return (
        <JobsEmpty
          title={t("jobs.desktop.loadError")}
          action={<PillButton label={t("common.retry")} onPress={retry} />}
        />
      );
    if (data.isLoading || (section === "recent" && workspace.isLoading))
      return (
        <YStack minHeight={160} justifyContent="center" alignItems="center">
          <ActivityIndicator accessibilityLabel={t("jobs.loading")} color={palette.accent} />
        </YStack>
      );
    if (!jobs.length)
      return (
        <YStack gap={17}>
          {!full ? (
            <Text accessibilityRole="header" fontSize={19} fontWeight="600" color={palette.ink}>
              {t(`jobs.desktop.${section}`)}
            </Text>
          ) : null}
          <JobsEmpty
            title={t(chips.length ? "jobs.desktop.noResults" : `jobs.desktop.empty.${section}`)}
            description={t(
              chips.length ? "jobs.desktop.noResultsHelp" : `jobs.desktop.emptyHelp.${section}`,
            )}
            action={
              chips.length ? (
                <PillButton
                  variant="ghost"
                  label={t("jobs.filters.clearAll")}
                  onPress={() => applyFilters(EMPTY_JOBS_FILTERS)}
                />
              ) : undefined
            }
          />
        </YStack>
      );
    return full ? (
      <JobGrid>{jobs.map(card)}</JobGrid>
    ) : (
      <JobShelf
        id={section}
        title={t(`jobs.desktop.${section}`)}
        onSeeAll={() => navigate("all", section)}
      >
        {jobs.map(card)}
      </JobShelf>
    );
  };
  return (
    <>
      <Head>
        <title>{pageTitle} | Patch Careers</title>
      </Head>
      <ScrollView
        testID="jobs-desktop"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: inset + 35,
          paddingBottom: 56,
          backgroundColor: palette.bg,
          flexGrow: 1,
        }}
      >
        <YStack width="100%" maxWidth={1280} paddingHorizontal={40} alignSelf="center" gap={0}>
          <XStack justifyContent="space-between" alignItems="flex-end" gap={24} marginBottom={27}>
            <YStack gap={9}>
              <Text
                accessibilityRole="header"
                fontFamily={editorialFonts.serif}
                fontWeight="400"
                fontSize={42}
                lineHeight={50}
                letterSpacing={-1.2}
                color={palette.ink}
              >
                {t(scope === "all" ? "jobs.title" : `jobs.scope.${scope}`)}
              </Text>
              <Text fontSize={12} lineHeight={20} color={palette.muted}>
                {t("jobs.desktop.tagline")}
              </Text>
            </YStack>
          </XStack>
          <XStack
            role="tablist"
            accessibilityLabel={t("jobs.desktop.tabs")}
            gap={8}
            borderBottomWidth={1}
            borderBottomColor={palette.hairlineStrong}
            paddingBottom={10}
            marginBottom={28}
          >
            {tabs.map((tab, index) => (
              <Pressable
                key={tab.key}
                ref={(node) => {
                  tabRefs.current[index] = node as unknown as HTMLElement;
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: scope === tab.key }}
                tabIndex={scope === tab.key ? 0 : -1}
                nativeID={`jobs-tab-${tab.key}`}
                aria-controls="jobs-tab-panel"
                onPress={() => navigate(tab.key)}
                {...{
                  onKeyDown: (event: React.KeyboardEvent) => {
                    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                    event.preventDefault();
                    const next =
                      event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? tabs.length - 1
                          : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
                            tabs.length;
                    const target = tabs[next];
                    if (target) {
                      navigate(target.key);
                      tabRefs.current[next]?.focus();
                    }
                  },
                }}
              >
                <XStack
                  gap={9}
                  alignItems="center"
                  paddingHorizontal={16}
                  minHeight={40}
                  borderRadius={999}
                  backgroundColor={scope === tab.key ? palette.primary : "transparent"}
                  hoverStyle={{
                    backgroundColor: scope === tab.key ? palette.primaryPress : palette.surface,
                  }}
                >
                  <Text
                    fontSize={13}
                    fontWeight={scope === tab.key ? "600" : "400"}
                    color={scope === tab.key ? palette.onPrimary : palette.muted}
                  >
                    {tab.label}
                  </Text>
                  {tab.count !== undefined ? (
                    <Text fontFamily={editorialFonts.mono} fontSize={10} color={palette.muted}>
                      {tab.count}
                    </Text>
                  ) : null}
                </XStack>
              </Pressable>
            ))}
          </XStack>
          <YStack role="tabpanel" id="jobs-tab-panel" aria-labelledby={`jobs-tab-${scope}`} gap={0}>
            {/* Keep the guided draft mounted during tab changes. */}
            <YStack display={scope === "all" && !group ? "flex" : "none"}>
              <JobComposer />
            </YStack>
            {scope === "all" ? (
              <YStack>
                {group ? (
                  <YStack marginBottom={24}>
                    <PillButton
                      variant="ghost"
                      label={t("jobs.desktop.backGroups")}
                      onPress={() => navigate("all")}
                      renderIcon={({ color }) => <ChevronLeft size={15} color={color} />}
                    />
                  </YStack>
                ) : null}
                <YStack
                  gap={10}
                  paddingBottom={23}
                  borderBottomWidth={1}
                  borderBottomColor={palette.hairline}
                  marginBottom={29}
                >
                  <PillButton
                    label={t("jobs.desktop.filters")}
                    minHeight={42}
                    borderRadius={10}
                    onPress={() => setFilterOpen(true)}
                    renderIcon={({ color }) => <SlidersHorizontal size={15} color={color} />}
                  />
                  {chips.length ? (
                    <XStack gap={8} flexWrap="wrap">
                      {chips.map((chip) => (
                        <Pressable
                          key={chip.key}
                          accessibilityRole="button"
                          accessibilityLabel={t("jobs.filters.removeChipA11y", {
                            label: chip.label,
                          })}
                          onPress={() => applyFilters(chip.remove(filters))}
                        >
                          <XStack
                            gap={7}
                            alignItems="center"
                            paddingHorizontal={9}
                            paddingVertical={6}
                            borderRadius={999}
                            backgroundColor={palette.surface}
                          >
                            <Text fontSize={10} color={palette.body}>
                              {chip.label}
                            </Text>
                            <X size={12} color={palette.body} />
                          </XStack>
                        </Pressable>
                      ))}
                      <PillButton
                        variant="ghost"
                        minHeight={28}
                        label={t("jobs.filters.clearAll")}
                        onPress={() => applyFilters(EMPTY_JOBS_FILTERS)}
                      />
                    </XStack>
                  ) : null}
                </YStack>
                {group ? (
                  <YStack gap={20}>
                    <Text
                      accessibilityRole="header"
                      fontSize={24}
                      fontWeight="600"
                      color={palette.ink}
                    >
                      {t(`jobs.desktop.${group}`)}
                    </Text>
                    {groupContent(group, true)}
                    {group === "recommended" && data.recommended.data?.items.length ? (
                      data.recommended.hasNextPage ? (
                        <PillButton
                          label={t("jobs.desktop.loadMore")}
                          disabled={data.recommended.isFetchingNextPage}
                          onPress={() => void data.recommended.fetchNextPage()}
                        />
                      ) : null
                    ) : group !== "recent" && data.catalog.hasNextPage ? (
                      <PillButton
                        label={t("jobs.desktop.loadMore")}
                        disabled={data.catalog.isFetchingNextPage}
                        onPress={data.catalog.fetchNextPage}
                      />
                    ) : null}
                  </YStack>
                ) : (
                  <YStack gap={36}>
                    {DISCOVERY_GROUPS.map((section) => (
                      <YStack key={section}>{groupContent(section)}</YStack>
                    ))}
                  </YStack>
                )}
              </YStack>
            ) : scope === "saved" ? (
              <YStack gap={24}>
                {data.saved.isError ? (
                  <JobsEmpty
                    title={t("jobs.desktop.loadError")}
                    action={<PillButton label={t("common.retry")} onPress={data.saved.refetch} />}
                  />
                ) : data.saved.isLoading ? (
                  <ActivityIndicator color={palette.accent} />
                ) : data.saved.jobs.length ? (
                  <JobGrid>{data.saved.jobs.map(card)}</JobGrid>
                ) : (
                  <JobsEmpty
                    title={t("jobs.desktop.emptySaved")}
                    description={t("jobs.desktop.emptySavedHelp")}
                    action={
                      <PillButton label={t("jobs.home.explore")} onPress={() => navigate("all")} />
                    }
                  />
                )}
                {data.saved.hasNextPage ? (
                  <PillButton
                    label={t("jobs.desktop.loadMore")}
                    disabled={data.saved.isFetchingNextPage}
                    onPress={data.saved.fetchNextPage}
                  />
                ) : null}
              </YStack>
            ) : (
              <ApplicationsBoard
                entries={workspace.entries}
                workspaceLoading={workspace.isLoading}
                onChange={async (job, stage) => {
                  try {
                    await workspace.update(job, (entry) => ({ ...entry, job, stage }));
                  } catch {
                    toast.show({ title: t("jobs.desktop.saveError"), intent: "danger" });
                  }
                }}
              />
            )}
          </YStack>
          <XStack
            marginTop={56}
            paddingTop={24}
            borderTopWidth={1}
            borderTopColor={palette.hairline}
            justifyContent="space-between"
          >
            <Text fontSize={10} color={palette.muted}>
              {t("jobs.desktop.brand")}
            </Text>
            <Text
              tag="a"
              href="https://www.logo.dev"
              target="_blank"
              rel="noopener noreferrer"
              fontSize={10}
              color={palette.muted}
            >
              {t("jobs.desktop.logoAttribution")}
            </Text>
          </XStack>
        </YStack>
        <DiscoveryFilters
          open={filterOpen}
          onOpenChange={setFilterOpen}
          filters={filters}
          onApply={applyFilters}
        />
      </ScrollView>
    </>
  );
}
