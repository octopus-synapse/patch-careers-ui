/**
 * Job detail — pushed over the tabs from a list row.
 *
 * There is no `GET /v1/jobs/external/:id`: listings exist only inside the
 * list caches (daily batch + the user's saved snapshots), so this screen
 * resolves its data via `findExternalJob`. A cold deep link (cache miss)
 * degrades to a friendly not-found state pointing back to the list.
 *
 * The bookmark toggle keeps a local `saved` mirror: the resolved job is a
 * memoized cache snapshot, so the optimistic cache write alone would not
 * re-render this screen.
 *
 * One primary CTA — "Candidatar-se" — opens the publisher's apply URL in
 * the in-app browser; the caption under it makes the handoff explicit.
 */

import { Divider, EmptyState, Icon, Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, PrimaryAction, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Bookmark, ChevronLeft, FileQuestion } from "lucide-react-native";
import { type ReactElement, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MatchBreakdown } from "@/features/match";
import { useI18n } from "@/providers/i18n-provider";
import { findExternalJob } from "../hooks/queries";
import { useReportApplied } from "../hooks/use-report-applied";
import { useToggleSaveJob } from "../hooks/use-save-job";
import { jobMetaLine, postedAgo, toTitleCase } from "../lib/helpers";
import { DidYouApplySheet } from "./did-you-apply-sheet";

export function JobDetailScreen({ id }: { id: string }): ReactElement {
  const editorialPalette = useEditorialPalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t, locale } = useI18n();
  const { toggle: toggleSave, pendingId } = useToggleSaveJob();
  const { report: reportApplied, pending: reportPending } = useReportApplied();

  const job = useMemo(() => findExternalJob(queryClient, id), [queryClient, id]);
  const [saved, setSaved] = useState(job?.isSaved ?? false);
  const savePending = job !== null && pendingId === job.externalId;
  const [didApplyOpen, setDidApplyOpen] = useState(false);

  // External jobs apply on the publisher's site, so we can't observe the
  // outcome: open the apply URL, then ask "você se candidatou?" on return.
  async function onApply(): Promise<void> {
    if (job === null) return;
    await WebBrowser.openBrowserAsync(job.applyUrl);
    setDidApplyOpen(true);
  }

  async function onDidApplyAnswer(didApply: boolean): Promise<void> {
    if (job !== null) {
      const fresh = findExternalJob(queryClient, id) ?? job;
      await reportApplied({ ...fresh, isSaved: saved, savedId: fresh.savedId }, didApply);
      if (didApply) setSaved(true);
    }
    setDidApplyOpen(false);
  }

  function onToggleSave(): void {
    if (job === null || savePending) return;
    // Re-resolve at press time: a save made on this screen patches the real
    // `savedId` into the cache, which the memoized snapshot never sees. The
    // local flip keeps this snapshot-rendered screen consistent.
    const fresh = findExternalJob(queryClient, id) ?? job;
    toggleSave({ ...fresh, isSaved: saved });
    setSaved((prev) => !prev);
  }

  function goBack(): void {
    if (router.canGoBack()) router.back();
    else router.replace("/jobs");
  }

  return (
    <View style={{ flex: 1, backgroundColor: editorialPalette.bg, paddingTop: insets.top }}>
      <XStack alignItems="center" justifyContent="space-between" height={44} paddingHorizontal={8}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("jobs.detail.back")}
          onPress={goBack}
          hitSlop={8}
        >
          <YStack padding={6}>
            <Icon as={ChevronLeft} size={24} color={editorialPalette.ink} />
          </YStack>
        </Pressable>
        {job !== null ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={saved ? t("jobs.save.remove") : t("jobs.save.add")}
            accessibilityState={{ selected: saved, disabled: savePending }}
            disabled={savePending}
            onPress={onToggleSave}
            hitSlop={8}
            style={{ padding: 6, opacity: savePending ? 0.4 : 1 }}
          >
            <Bookmark
              size={22}
              color={saved ? editorialPalette.ink : editorialPalette.subtle}
              fill={saved ? editorialPalette.ink : "transparent"}
            />
          </Pressable>
        ) : null}
      </XStack>

      {job === null ? (
        <YStack flex={1} justifyContent="center">
          <EmptyState
            icon={<Icon as={FileQuestion} size={32} color={editorialPalette.subtle} />}
            title={t("jobs.detail.notFound.title")}
            description={t("jobs.detail.notFound.description")}
            ctaLabel={t("jobs.detail.notFound.cta")}
            onCta={() => router.replace("/jobs")}
          />
        </YStack>
      ) : (
        <>
          <ScrollView
            // @style-allow inline: RN ScrollView fill (not a Tamagui component)
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 }}
          >
            <YStack gap={14}>
              <Text
                preset="caption"
                fontSize={13}
                letterSpacing={0.8}
                textTransform="uppercase"
                color={editorialPalette.muted}
              >
                {job.company}
              </Text>
              <Text
                fontFamily={editorialFonts.serif}
                fontSize={30}
                lineHeight={40}
                color={editorialPalette.ink}
                accessibilityRole="header"
              >
                {toTitleCase(job.title)}
              </Text>
              {jobMetaLine(job, locale) ? (
                <Text preset="caption" fontSize={14} color={editorialPalette.body}>
                  {jobMetaLine(job, locale)}
                </Text>
              ) : null}
              <Text preset="caption" fontSize={12} color={editorialPalette.subtle}>
                {[
                  postedAgo(job, Date.now(), t, locale),
                  job.publisher ? t("jobs.row.viaPublisher", { publisher: job.publisher }) : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </YStack>

            <YStack marginVertical={28}>
              <Divider color={editorialPalette.hairline} />
            </YStack>

            {job.description ? (
              <Text fontSize={15} lineHeight={25} color={editorialPalette.body}>
                {job.description}
              </Text>
            ) : (
              <Text fontSize={15} lineHeight={25} color={editorialPalette.muted}>
                {t("jobs.detail.noDescription")}
              </Text>
            )}

            <YStack marginVertical={28}>
              <Divider color={editorialPalette.hairline} />
            </YStack>
            <MatchBreakdown
              job={{
                id: job.id,
                title: job.title,
                company: job.company,
                description: job.description,
              }}
            />
          </ScrollView>

          <YStack
            gap={8}
            paddingHorizontal={24}
            paddingTop={12}
            paddingBottom={insets.bottom + 12}
            backgroundColor={editorialPalette.bg}
            borderTopWidth={1}
            borderTopColor={editorialPalette.hairline}
          >
            <PrimaryAction label={t("jobs.detail.apply")} onPress={() => void onApply()} />
            <Text preset="caption" fontSize={12} color={editorialPalette.subtle} textAlign="center">
              {job.publisher
                ? t("jobs.detail.opensPublisherSiteNamed", { publisher: job.publisher })
                : t("jobs.detail.opensPublisherSite")}
            </Text>
          </YStack>
        </>
      )}

      <DidYouApplySheet
        open={didApplyOpen}
        onOpenChange={setDidApplyOpen}
        onAnswer={(didApply) => void onDidApplyAnswer(didApply)}
        pending={reportPending}
      />
    </View>
  );
}
