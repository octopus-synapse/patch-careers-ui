/**
 * Shelf preview cards for the Jobs home (the Airbnb-style menu screen).
 *
 * Unlike the full-list rows (hairline-separated, no surface), previews are
 * true cards: surface + hairline border + rounded corners, company kicker ·
 * serif title · meta line, then a hairline-divided footer with recency/source
 * on the left and the compatibility chip (jobs) or a quiet status pill
 * (candidaturas) on the right. Jobs carry the bookmark toggle top-right.
 */

import { labelFor } from "@patch-careers/api-client";
import { Divider, MatchScoreChip, Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { Bookmark } from "lucide-react-native";
import { memo, type ReactElement, type ReactNode, useState } from "react";
import { Pressable } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import type { ApplicationRow } from "../hooks/use-applications";
import { jobMetaLine, postedAgo, toTitleCase } from "../lib/helpers";
import type { ExternalJob } from "../types";

function CardFrame({
  a11yLabel,
  onPress,
  disabled = false,
  children,
}: {
  a11yLabel: string;
  onPress?: (() => void) | undefined;
  disabled?: boolean;
  children: ReactNode;
}): ReactElement {
  const editorialPalette = useEditorialPalette();
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      disabled={disabled || !onPress}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.96 : 1 })}
    >
      <YStack
        flex={1}
        padding={20}
        borderRadius={16}
        borderWidth={1}
        borderColor={hovered ? editorialPalette.hairlineStrong : editorialPalette.hairline}
        backgroundColor={editorialPalette.surface}
        gap={0}
      >
        {children}
      </YStack>
    </Pressable>
  );
}

function JobPreviewCardInner({
  job,
  now,
  onPress,
  onToggleSave,
  savePending,
  matchScore,
}: {
  job: ExternalJob;
  now: number;
  onPress: (job: ExternalJob) => void;
  onToggleSave: (job: ExternalJob) => void;
  savePending: boolean;
  /** Compatibility for this listing; undefined = not (yet) computed → no chip. */
  matchScore?: number | undefined;
}): ReactElement {
  const editorialPalette = useEditorialPalette();
  const { t, locale } = useI18n();
  const meta = jobMetaLine(job, locale);
  const ago = postedAgo(job, now, t, locale);
  const title = toTitleCase(job.title);

  return (
    <CardFrame
      a11yLabel={t("jobs.row.a11y", { title, company: job.company })}
      onPress={() => onPress(job)}
    >
      <XStack alignItems="flex-start" justifyContent="space-between" gap={12}>
        <Text
          preset="caption"
          fontSize={11}
          letterSpacing={1}
          textTransform="uppercase"
          color={editorialPalette.muted}
          numberOfLines={1}
          flex={1}
        >
          {job.company}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={job.isSaved ? t("jobs.save.remove") : t("jobs.save.add")}
          accessibilityState={{ selected: job.isSaved, disabled: savePending }}
          disabled={savePending}
          onPress={() => onToggleSave(job)}
          hitSlop={10}
          style={{ opacity: savePending ? 0.4 : 1 }}
        >
          <Bookmark
            size={16}
            color={job.isSaved ? editorialPalette.ink : editorialPalette.subtle}
            fill={job.isSaved ? editorialPalette.ink : "transparent"}
          />
        </Pressable>
      </XStack>

      <Text
        fontFamily={editorialFonts.serif}
        fontSize={17}
        lineHeight={23}
        color={editorialPalette.ink}
        numberOfLines={2}
        marginTop={10}
        // Two-line reserve so footers align across the shelf.
        minHeight={46}
      >
        {title}
      </Text>
      {meta ? (
        <Text
          preset="caption"
          fontSize={12.5}
          color={editorialPalette.muted}
          numberOfLines={1}
          marginTop={6}
        >
          {meta}
        </Text>
      ) : null}

      <YStack flex={1} justifyContent="flex-end" marginTop={16}>
        <Divider color={editorialPalette.hairline} />
        <XStack alignItems="center" justifyContent="space-between" gap={8} paddingTop={12}>
          <Text preset="caption" fontSize={11.5} color={editorialPalette.subtle} numberOfLines={1}>
            {job.publisher
              ? `${ago} · ${t("jobs.row.viaPublisher", { publisher: job.publisher })}`
              : ago}
          </Text>
          {typeof matchScore === "number" ? (
            <MatchScoreChip
              score={matchScore}
              size="sm"
              accessibilityLabel={`${matchScore}% ${t("match.compatLabel")}`}
            />
          ) : null}
        </XStack>
      </YStack>
    </CardFrame>
  );
}

export const JobPreviewCard = memo(JobPreviewCardInner);

function ApplicationPreviewCardInner({
  application,
  now,
  onPress,
}: {
  application: ApplicationRow;
  now: number;
  onPress: (application: ApplicationRow) => void;
}): ReactElement {
  const editorialPalette = useEditorialPalette();
  const { t, locale } = useI18n();
  const meta = [
    application.workMode ? labelFor("RemotePolicy", application.workMode, locale) : null,
    application.employmentType ? labelFor("JobType", application.employmentType, locale) : null,
    application.location,
  ]
    .filter(Boolean)
    .join(" · ");
  const ago = postedAgo(
    { postedAt: application.appliedAtIso, fetchedAt: application.appliedAtIso },
    now,
    t,
    locale,
  );
  const title = toTitleCase(application.title);
  const pressable = application.jobRouteId !== null;

  return (
    <CardFrame
      a11yLabel={t("jobs.row.a11y", { title, company: application.company })}
      onPress={pressable ? () => onPress(application) : undefined}
    >
      <Text
        preset="caption"
        fontSize={11}
        letterSpacing={1}
        textTransform="uppercase"
        color={editorialPalette.muted}
        numberOfLines={1}
      >
        {application.company}
      </Text>
      <Text
        fontFamily={editorialFonts.serif}
        fontSize={17}
        lineHeight={23}
        color={editorialPalette.ink}
        numberOfLines={2}
        marginTop={10}
        minHeight={46}
      >
        {title}
      </Text>
      {meta ? (
        <Text
          preset="caption"
          fontSize={12.5}
          color={editorialPalette.muted}
          numberOfLines={1}
          marginTop={6}
        >
          {meta}
        </Text>
      ) : null}

      <YStack flex={1} justifyContent="flex-end" marginTop={16}>
        <Divider color={editorialPalette.hairline} />
        <XStack alignItems="center" justifyContent="space-between" gap={8} paddingTop={12}>
          <Text preset="caption" fontSize={11.5} color={editorialPalette.subtle} numberOfLines={1}>
            {ago}
          </Text>
          {/* Quiet status pill — dot in accent only while awaiting a response. */}
          <XStack
            alignItems="center"
            gap={6}
            paddingHorizontal={10}
            height={22}
            borderRadius={11}
            borderWidth={1}
            borderColor={editorialPalette.hairlineStrong}
          >
            <YStack
              width={6}
              height={6}
              borderRadius={3}
              backgroundColor={
                application.status === "response"
                  ? editorialPalette.accent
                  : editorialPalette.subtle
              }
            />
            <Text preset="caption" fontSize={11} color={editorialPalette.body}>
              {t(`jobs.applications.status.${application.status}`)}
            </Text>
          </XStack>
        </XStack>
      </YStack>
    </CardFrame>
  );
}

export const ApplicationPreviewCard = memo(ApplicationPreviewCardInner);
