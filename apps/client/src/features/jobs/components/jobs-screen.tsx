/**
 * Jobs tab — external listings from the daily JSearch batch.
 *
 * The whole editorial chrome (serif title, result count, filter button, active
 * chips) lives in the list header and scrolls away; only the frosted scope bar
 * ("Todas | Salvas") stays pinned to the top, with the job list scrolling
 * beneath it so its glass actually frosts live content. Pinning is scroll-
 * driven (translateY tracks the offset, native driver) and a soft shadow fades
 * in once it locks. Filters live in a modal sheet and commit on "Aplicar"; the
 * active ones echo as removable chips. The list is an endless scroll grouped
 * into period sections (Hoje / Esta semana / Anteriores), with pull-to-refresh,
 * a skeleton first paint and recoverable error/empty states. Search happens in
 * the global header — there is no local field.
 */

import { EmptyState, Icon, Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { Bookmark, BriefcaseBusiness, SearchX, Send, SlidersHorizontal } from "lucide-react-native";
import {
  type ComponentType,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  SectionList,
  type SectionListProps,
  View,
} from "react-native";
import { setHeaderCollapsed } from "@/components/header-collapse-store";
import { useI18n } from "@/providers/i18n-provider";
import { useExternalJobs } from "../hooks/queries";
import {
  type ApplicationRow as ApplicationRowData,
  type ApplicationSection,
  useApplications,
} from "../hooks/use-applications";
import { useToggleSaveJob } from "../hooks/use-save-job";
import { groupJobsByPeriod, hasActiveFilters, type JobSection } from "../lib/helpers";
import { EMPTY_JOBS_FILTERS, type ExternalJob, type JobsFilters, type JobsScope } from "../types";
import { ActiveFilterChips } from "./active-filter-chips";
import { ApplicationRow } from "./application-row";
import { JobListSkeleton } from "./job-list-skeleton";
import { JobRow } from "./job-row";
import { JobSectionHeader } from "./job-section-header";
import { JobsFilterSheet } from "./jobs-filter-sheet";
import { JobsScopeTabs } from "./jobs-scope-tabs";

// The list serves all three scopes: discovery/saved render `ExternalJob`s
// grouped by period; the Candidaturas scope renders `ApplicationRow`s grouped
// by status. The renderers discriminate on the `source` field / section key.
type Row = ExternalJob | ApplicationRowData;
type Section = JobSection | ApplicationSection;
const PERIOD_KEYS: ReadonlySet<string> = new Set(["today", "week", "earlier"]);
const isApplicationRow = (item: Row): item is ApplicationRowData => "source" in item;

// createAnimatedComponent widens the generics to `unknown`; recover the typed
// item/section so the row + section-header callbacks stay checked.
const AnimatedSectionList = Animated.createAnimatedComponent(
  SectionList,
) as unknown as ComponentType<Animated.AnimatedProps<SectionListProps<Row, Section>>>;
// Reserve roughly the bar's height before its first onLayout, to avoid the
// initial rows starting under where the floating bar will land.
const SCOPE_BAR_ESTIMATE = 80;

function RowSeparator(): ReactElement {
  const editorialPalette = useEditorialPalette();
  return <View style={{ height: 1, marginLeft: 20, backgroundColor: editorialPalette.hairline }} />;
}

export function JobsScreen(): ReactElement {
  const editorialPalette = useEditorialPalette();
  // Bottom bar floats over content; pad the list so the last rows clear it.
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const { t } = useI18n();
  const [scope, setScope] = useState<JobsScope>("all");
  const [filters, setFilters] = useState<JobsFilters>(EMPTY_JOBS_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const isApplications = scope === "applications";
  const list = useExternalJobs(filters, scope);
  const apps = useApplications(isApplications);
  const { toggle: toggleSave, pendingId } = useToggleSaveJob();
  // One recency anchor per mount — a per-render Date.now() would defeat the
  // section memo below.
  const [now] = useState(() => Date.now());
  const filtersActive = hasActiveFilters(filters);
  const showFilters = scope === "all";

  // Unified view state across the two data sources backing the scopes.
  const isLoading = isApplications ? apps.isLoading : list.isLoading;
  const isError = isApplications ? apps.isError : list.isError;
  const isRefetching = isApplications ? apps.isRefetching : list.isRefetching;
  const total = isApplications ? apps.total : list.total;
  const refetch = isApplications ? apps.refetch : list.refetch;

  const jobSections = useMemo(() => groupJobsByPeriod(list.jobs, now), [list.jobs, now]);
  const sections: Section[] = isApplications ? apps.sections : jobSections;

  // Scroll-driven pinning: the scope bar floats just below the chrome and rides
  // up with the scroll until it locks at the top, where it stays.
  const scrollY = useRef(new Animated.Value(0)).current;
  const [chromeHeight, setChromeHeight] = useState(0);
  const [scopeBarHeight, setScopeBarHeight] = useState(SCOPE_BAR_ESTIMATE);
  const pinRange = Math.max(1, chromeHeight);
  const scopeBarTranslateY = scrollY.interpolate({
    inputRange: [0, pinRange],
    outputRange: [chromeHeight, 0],
    extrapolate: "clamp",
  });
  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
      }),
    [scrollY],
  );

  // Drive the global header's collapse from this list's scroll: down → collapse
  // to just the search; up / near the top → restore. A JS listener on the
  // native-driven value is fine (Animated bridges it periodically).
  useEffect(() => {
    let last = 0;
    const id = scrollY.addListener(({ value }) => {
      if (value < 24) setHeaderCollapsed(false);
      else if (value > last + 4) setHeaderCollapsed(true);
      else if (value < last - 4) setHeaderCollapsed(false);
      last = value;
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  // Never let the collapse leak onto another tab: restore on blur.
  useFocusEffect(
    useCallback(() => {
      return () => setHeaderCollapsed(false);
    }, []),
  );

  const openJob = useCallback(
    (job: ExternalJob) => {
      router.push({ pathname: "/job/[id]", params: { id: job.id } });
    },
    [router],
  );

  const openApplication = useCallback(
    (application: ApplicationRowData) => {
      // Only external self-reported rows map to a cached (saved) job we can open.
      if (application.jobRouteId === null) return;
      router.push({ pathname: "/job/[id]", params: { id: application.jobRouteId } });
    },
    [router],
  );

  function clearFilters(): void {
    setFilters(EMPTY_JOBS_FILTERS);
  }

  function countLine(): string {
    if (isLoading) return t("jobs.count.updatedDaily");
    const variant = isApplications
      ? "applications"
      : scope === "saved"
        ? "saved"
        : filtersActive
          ? "results"
          : "jobs";
    const plural = total === 1 ? "one" : "many";
    return t(`jobs.count.${variant}.${plural}`, { count: total });
  }

  // The chrome that scrolls away (everything but the pinned scope bar), plus a
  // spacer reserving the floating bar's footprint so rows start below it.
  const listHeader = (
    <View>
      <View onLayout={(e) => setChromeHeight(e.nativeEvent.layout.height)}>
        <YStack gap={16} paddingTop={18} paddingBottom={14}>
          <Text
            fontFamily={editorialFonts.serif}
            fontSize={26}
            // Without an explicit lineHeight the serif descenders ("g") get
            // clipped by the default line box.
            lineHeight={34}
            color={editorialPalette.ink}
            textAlign="center"
          >
            {t("jobs.title")}
          </Text>

          <XStack
            paddingHorizontal={20}
            alignItems="center"
            justifyContent="space-between"
            gap={12}
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
      </View>
      {/* Reserve the floating scope bar's footprint. */}
      <View style={{ height: scopeBarHeight }} />
    </View>
  );

  function emptyContent(): ReactElement {
    if (isLoading) return <JobListSkeleton />;

    if (isError) {
      return (
        <YStack flex={1} justifyContent="center" minHeight={320}>
          <EmptyState
            icon={<Icon as={BriefcaseBusiness} size={32} color={editorialPalette.subtle} />}
            title={t("jobs.empty.error.title")}
            description={t("jobs.empty.error.description")}
            ctaLabel={t("jobs.empty.error.cta")}
            onCta={refetch}
          />
        </YStack>
      );
    }

    if (isApplications) {
      return (
        <YStack flex={1} justifyContent="center" minHeight={320}>
          <EmptyState
            icon={<Icon as={Send} size={32} color={editorialPalette.subtle} />}
            title={t("jobs.empty.applications.title")}
            description={t("jobs.empty.applications.description")}
            ctaLabel={t("jobs.empty.applications.cta")}
            onCta={() => setScope("all")}
          />
        </YStack>
      );
    }

    if (scope === "saved") {
      return (
        <YStack flex={1} justifyContent="center" minHeight={320}>
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
      <YStack flex={1} justifyContent="center" minHeight={320}>
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
    <View style={{ flex: 1, backgroundColor: editorialPalette.bg }}>
      <AnimatedSectionList
        sections={sections}
        keyExtractor={(item: Row) => item.id}
        renderItem={({ item }: { item: Row }) =>
          isApplicationRow(item) ? (
            <ApplicationRow application={item} now={now} onPress={openApplication} />
          ) : (
            <JobRow
              job={item}
              now={now}
              onPress={openJob}
              onToggleSave={toggleSave}
              savePending={pendingId === item.externalId}
            />
          )
        }
        renderSectionHeader={({ section }: { section: Section }) => (
          <JobSectionHeader
            title={
              PERIOD_KEYS.has(section.key)
                ? t(`jobs.sections.${section.key}`)
                : t(`jobs.applications.status.${section.key}`)
            }
          />
        )}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={RowSeparator}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyContent()}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          // Only the discovery/saved lists paginate; applications load in one page.
          if (!isApplications && list.hasNextPage && !list.isFetchingNextPage) {
            list.fetchNextPage();
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={editorialPalette.muted}
            // Spinner clears the pinned bar instead of hiding behind it.
            progressViewOffset={scopeBarHeight}
          />
        }
        ListFooterComponent={
          !isApplications && list.isFetchingNextPage ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator size="small" color={editorialPalette.muted} />
            </View>
          ) : null
        }
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 24 }}
      />

      {/* The only thing pinned on scroll: the glass scope capsule. A top fade
          lets rows dissolve into the background as they scroll up under it.
          Hidden until the chrome is measured so it lands in place. */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          stickyStyles.wrap,
          { opacity: chromeHeight > 0 ? 1 : 0, transform: [{ translateY: scopeBarTranslateY }] },
        ]}
        onLayout={(e) => setScopeBarHeight(e.nativeEvent.layout.height)}
      >
        <LinearGradient
          pointerEvents="box-none"
          // 3-stop fade (bg 90% → 60% → transparent) — matches the reference so
          // the capsule emerges from the background instead of a hard band.
          colors={[
            `${editorialPalette.bg}E6`,
            `${editorialPalette.bg}99`,
            `${editorialPalette.bg}00`,
          ]}
          locations={[0, 0.5, 1]}
          style={stickyStyles.fade}
        >
          <JobsScopeTabs value={scope} onChange={setScope} />
        </LinearGradient>
      </Animated.View>

      <JobsFilterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        filters={filters}
        onApply={setFilters}
      />
    </View>
  );
}

const stickyStyles = {
  wrap: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  // Background fade behind the capsule: ~opaque at the top, transparent at the
  // bottom, so rows melt away as they scroll up under the pinned bar.
  fade: {
    paddingTop: 14,
    paddingBottom: 28,
  },
};
