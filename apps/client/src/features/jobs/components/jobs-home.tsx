/**
 * Jobs home — the tab is a menu, not a list (the approved "editorial index"
 * direction). A centered masthead (briefcase glyph sized to the serif title)
 * over three shelves — Todas · Salvas · Candidaturas — each previewing its
 * first three items with a minimal "Ver tudo" that pushes the full-list
 * screen (`/job-list/[scope]`, the previous Jobs screen with filters,
 * recommendations and endless scroll).
 *
 * The signature device is the contents-page leader: a hairline runs from each
 * shelf title to its "Ver tudo", encoding that this page is an index. Empty
 * shelves swap the preview for a dashed hairline box ("Nada ainda por aqui")
 * and hide their "Ver tudo"; Salvas/Candidaturas offer a quiet "Explorar
 * vagas" instead. Desktop lays previews as a 3-up grid; mobile as a snapping
 * horizontal shelf (the Airbnb idiom).
 */

import { Divider, Icon, Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import { BriefcaseBusiness } from "lucide-react-native";
import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, useWindowDimensions } from "react-native";
import { useListMatchScores } from "@/features/match";
import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { useI18n } from "@/providers/i18n-provider";
import { useExternalJobs } from "../hooks/queries";
import { type ApplicationRow, useApplications } from "../hooks/use-applications";
import { useToggleSaveJob } from "../hooks/use-save-job";
import { EMPTY_JOBS_FILTERS, type ExternalJob, type JobsScope } from "../types";
import { ApplicationPreviewCard, JobPreviewCard } from "./job-preview-card";

const PREVIEW_COUNT = 3;

export function JobsHomeScreen(): ReactElement {
  const editorialPalette = useEditorialPalette();
  const tabBarHeight = useBottomTabBarHeight();
  const isDesktopWeb = useIsDesktopWeb();
  const router = useRouter();
  const { t } = useI18n();
  const [now] = useState(() => Date.now());

  const all = useExternalJobs(EMPTY_JOBS_FILTERS, "all");
  const saved = useExternalJobs(EMPTY_JOBS_FILTERS, "saved");
  const apps = useApplications(true);
  const { toggle: toggleSave, pendingId } = useToggleSaveJob();

  const allPreview = all.jobs.slice(0, PREVIEW_COUNT);
  const savedPreview = saved.jobs.slice(0, PREVIEW_COUNT);
  const appsRows = apps.sections.flatMap((s) => s.data);
  const appsPreview = appsRows.slice(0, PREVIEW_COUNT);

  const matchScores = useListMatchScores(allPreview.map((job) => job.id));

  const refreshing = all.isRefetching || saved.isRefetching || apps.isRefetching;
  function refetchAll(): void {
    all.refetch();
    saved.refetch();
    apps.refetch();
  }

  function openJob(job: ExternalJob): void {
    router.push({ pathname: "/job/[id]", params: { id: job.id } });
  }

  function openApplication(application: ApplicationRow): void {
    if (application.jobRouteId === null) return;
    router.push({ pathname: "/job/[id]", params: { id: application.jobRouteId } });
  }

  function seeAll(scope: JobsScope): void {
    router.push({ pathname: "/job-list/[scope]", params: { scope } });
  }

  const titleSize = isDesktopWeb ? 40 : 30;

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarHeight + 32 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refetchAll}
          tintColor={editorialPalette.muted}
        />
      }
    >
      <YStack flex={1} backgroundColor={editorialPalette.bg}>
        {/* Masthead — glyph sized to the serif wordmark, hairline rule below. */}
        <YStack paddingTop={isDesktopWeb ? 44 : 24} paddingHorizontal={20}>
          <XStack alignItems="center" justifyContent="center" gap={isDesktopWeb ? 14 : 10}>
            <Icon
              as={BriefcaseBusiness}
              size={titleSize}
              strokeWidth={1.6}
              color={editorialPalette.ink}
            />
            <Text
              fontFamily={editorialFonts.serif}
              fontSize={titleSize}
              lineHeight={titleSize + 8}
              letterSpacing={-0.4}
              color={editorialPalette.ink}
            >
              {t("jobs.title")}
            </Text>
          </XStack>
          <YStack marginTop={isDesktopWeb ? 32 : 22}>
            <Divider color={editorialPalette.hairlineStrong} />
          </YStack>
        </YStack>

        <YStack paddingTop={isDesktopWeb ? 36 : 28} gap={isDesktopWeb ? 44 : 36}>
          <Shelf
            title={t("jobs.scope.all")}
            count={all.total}
            isLoading={all.isLoading}
            isEmpty={allPreview.length === 0}
            emptyDescription={t("jobs.home.emptyAll")}
            onSeeAll={() => seeAll("all")}
          >
            {allPreview.map((job) => (
              <JobPreviewCard
                key={job.id}
                job={job}
                now={now}
                onPress={openJob}
                onToggleSave={toggleSave}
                savePending={pendingId === job.externalId}
                matchScore={matchScores[job.id]}
              />
            ))}
          </Shelf>

          <Shelf
            title={t("jobs.scope.saved")}
            count={saved.total}
            isLoading={saved.isLoading}
            isEmpty={savedPreview.length === 0}
            emptyDescription={t("jobs.home.emptySaved")}
            onSeeAll={() => seeAll("saved")}
            onExplore={() => seeAll("all")}
          >
            {savedPreview.map((job) => (
              <JobPreviewCard
                key={job.id}
                job={job}
                now={now}
                onPress={openJob}
                onToggleSave={toggleSave}
                savePending={pendingId === job.externalId}
              />
            ))}
          </Shelf>

          <Shelf
            title={t("jobs.scope.applications")}
            count={apps.total}
            isLoading={apps.isLoading}
            isEmpty={appsPreview.length === 0}
            emptyDescription={t("jobs.home.emptyApplications")}
            onSeeAll={() => seeAll("applications")}
            onExplore={() => seeAll("all")}
          >
            {appsPreview.map((application) => (
              <ApplicationPreviewCard
                key={application.id}
                application={application}
                now={now}
                onPress={openApplication}
              />
            ))}
          </Shelf>
        </YStack>
      </YStack>
    </ScrollView>
  );
}

function Shelf({
  title,
  count,
  isLoading,
  isEmpty,
  emptyDescription,
  onSeeAll,
  onExplore,
  children,
}: {
  title: string;
  count: number;
  isLoading: boolean;
  isEmpty: boolean;
  emptyDescription: string;
  onSeeAll: () => void;
  /** Empty-state escape hatch ("Explorar vagas") — omit on the Todas shelf. */
  onExplore?: () => void;
  children: ReactNode;
}): ReactElement {
  const editorialPalette = useEditorialPalette();
  const { t } = useI18n();
  const showEmpty = !isLoading && isEmpty;

  return (
    <YStack paddingHorizontal={20} gap={18}>
      {/* Contents-page header: title · italic count ─ leader ─ Ver tudo. */}
      <XStack alignItems="center" gap={14}>
        <XStack alignItems="baseline" gap={8} flexShrink={0}>
          <Text
            fontFamily={editorialFonts.serif}
            fontSize={22}
            lineHeight={28}
            color={editorialPalette.ink}
          >
            {title}
          </Text>
          <Text
            fontFamily={editorialFonts.serif}
            fontStyle="italic"
            fontSize={14}
            color={editorialPalette.subtle}
          >
            {isLoading ? "…" : count}
          </Text>
        </XStack>
        <YStack flex={1} height={1} backgroundColor={editorialPalette.hairline} />
        {showEmpty ? null : (
          <QuietLink
            label={`${t("jobs.home.seeAll")} →`}
            a11yLabel={t("jobs.home.seeAllA11y", { section: title })}
            onPress={onSeeAll}
          />
        )}
      </XStack>

      {showEmpty ? (
        <YStack
          alignItems="center"
          paddingVertical={44}
          paddingHorizontal={24}
          borderRadius={16}
          borderWidth={1}
          borderStyle="dashed"
          borderColor={editorialPalette.hairlineStrong}
          gap={8}
        >
          <Text
            fontFamily={editorialFonts.serif}
            fontStyle="italic"
            fontSize={18}
            color={editorialPalette.ink}
            textAlign="center"
          >
            {t("jobs.home.emptyTitle")}
          </Text>
          <Text
            preset="caption"
            fontSize={12.5}
            color={editorialPalette.muted}
            textAlign="center"
            maxWidth={340}
          >
            {emptyDescription}
          </Text>
          {onExplore ? (
            <YStack marginTop={8}>
              <QuietLink
                label={`${t("jobs.home.explore")} →`}
                a11yLabel={t("jobs.home.explore")}
                onPress={onExplore}
              />
            </YStack>
          ) : null}
        </YStack>
      ) : (
        <ShelfRow>{children}</ShelfRow>
      )}
    </YStack>
  );
}

/** Minimal text action — ink at rest, accent on hover (web). */
function QuietLink({
  label,
  a11yLabel,
  onPress,
}: {
  label: string;
  a11yLabel: string;
  onPress: () => void;
}): ReactElement {
  const editorialPalette = useEditorialPalette();
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      onPress={onPress}
      hitSlop={8}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      <Text
        preset="caption"
        fontSize={13}
        fontWeight="500"
        color={hovered ? editorialPalette.accent : editorialPalette.ink}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Preview layout: desktop = 3-up grid; mobile = snapping horizontal shelf
 * whose cards take ~78% of the viewport (peek of the next one, Airbnb-style).
 */
function ShelfRow({ children }: { children: ReactNode }): ReactElement {
  const isDesktopWeb = useIsDesktopWeb();
  const { width } = useWindowDimensions();

  if (isDesktopWeb) {
    // Keep the 3-column rhythm even when a shelf has fewer previews.
    const items = Array.isArray(children) ? children : [children];
    const fillers = Math.max(0, PREVIEW_COUNT - items.length);
    return (
      <XStack gap={14} alignItems="stretch">
        {children}
        {Array.from({ length: fillers }, (_, i) => (
          <YStack key={`filler-${String(i)}`} flex={1} />
        ))}
      </XStack>
    );
  }

  const cardWidth = Math.round(width * 0.78);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={cardWidth + 12}
      decelerationRate="fast"
      contentContainerStyle={{ gap: 12, paddingRight: 20 }}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            // Index keys are fine: the shelf is a fixed-size preview window.
            <YStack key={String(index)} width={cardWidth}>
              {child}
            </YStack>
          ))
        : children}
    </ScrollView>
  );
}
