/**
 * One Candidaturas row — same editorial treatment as `JobRow` (no card
 * surface, company kicker · serif title · meta), plus a small status tag and
 * the "applied N days ago" recency. Pressable only when the row maps to a
 * cached job we can open (external self-reported = its saved snapshot).
 */

import { labelFor } from "@patch-careers/api-client";
import { Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { memo, type ReactElement } from "react";
import { Pressable, View } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import type { ApplicationRow as ApplicationRowData } from "../hooks/use-applications";
import { postedAgo, toTitleCase } from "../lib/helpers";

function ApplicationRowInner({
  application,
  now,
  onPress,
}: {
  application: ApplicationRowData;
  now: number;
  onPress: (application: ApplicationRowData) => void;
}): ReactElement {
  const editorialPalette = useEditorialPalette();
  const { t, locale } = useI18n();
  // Same "Remoto · Tempo integral · São Paulo" shape as the job rows, built
  // from the raw enum values the unified hook carries.
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

  const body = (
    <XStack gap={12} paddingHorizontal={20} paddingVertical={24} alignItems="flex-start">
      <YStack gap={8} flex={1}>
        <Text
          preset="caption"
          fontSize={12}
          letterSpacing={0.8}
          textTransform="uppercase"
          color={editorialPalette.muted}
          numberOfLines={1}
        >
          {application.company}
        </Text>
        <Text
          fontFamily={editorialFonts.serif}
          fontSize={19}
          lineHeight={26}
          color={editorialPalette.ink}
          numberOfLines={2}
        >
          {title}
        </Text>
        {meta ? (
          <Text preset="caption" fontSize={13} color={editorialPalette.body} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
        <XStack alignItems="center" gap={10}>
          {/* Status tag — a quiet ink-on-hairline pill, color reserved. */}
          <View
            style={{
              paddingHorizontal: 10,
              height: 22,
              borderRadius: 11,
              borderWidth: 1,
              borderColor: editorialPalette.hairlineStrong,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text preset="caption" fontSize={11} color={editorialPalette.body}>
              {t(`jobs.applications.status.${application.status}`)}
            </Text>
          </View>
          <Text preset="caption" fontSize={12} color={editorialPalette.subtle}>
            {ago}
          </Text>
        </XStack>
      </YStack>
    </XStack>
  );

  if (!pressable) return body;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("jobs.row.a11y", {
        title,
        company: application.company,
      })}
      onPress={() => onPress(application)}
      style={({ pressed }) => ({
        backgroundColor: pressed ? editorialPalette.surface : "transparent",
      })}
    >
      {body}
    </Pressable>
  );
}

export const ApplicationRow = memo(ApplicationRowInner);
