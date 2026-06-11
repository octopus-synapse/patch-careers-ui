/**
 * One listing row: company kicker · serif title · meta line · recency +
 * publisher footer. Memoized — it renders inside the endless-scroll list.
 */

import { Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { memo, type ReactElement } from "react";
import { Pressable } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { jobMetaLine, postedAgo } from "../lib/helpers";
import type { ExternalJob } from "../types";

function JobCardInner({
  job,
  now,
  onPress,
}: {
  job: ExternalJob;
  now: number;
  onPress: (job: ExternalJob) => void;
}): ReactElement {
  const editorialPalette = useEditorialPalette();
  const { locale } = useI18n();
  const meta = jobMetaLine(job, locale);
  const ago = postedAgo(job, now);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Vaga ${job.title} na ${job.company}`}
      onPress={() => onPress(job)}
      style={({ pressed }) => ({
        backgroundColor: pressed ? editorialPalette.bg : editorialPalette.surface,
      })}
    >
      <YStack gap={6} paddingHorizontal={20} paddingVertical={16}>
        <Text
          preset="caption"
          fontSize={12}
          letterSpacing={0.8}
          textTransform="uppercase"
          color={editorialPalette.muted}
          numberOfLines={1}
        >
          {job.company}
        </Text>
        <Text
          fontFamily={editorialFonts.serif}
          fontSize={18}
          lineHeight={25}
          color={editorialPalette.ink}
          numberOfLines={2}
        >
          {job.title}
        </Text>
        {meta ? (
          <Text preset="caption" fontSize={13} color={editorialPalette.body} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
        <XStack alignItems="center" justifyContent="space-between" gap={8}>
          <Text preset="caption" fontSize={12} color={editorialPalette.subtle}>
            {ago}
          </Text>
          {job.publisher ? (
            <Text preset="caption" fontSize={12} color={editorialPalette.subtle}>
              via {job.publisher}
            </Text>
          ) : null}
        </XStack>
      </YStack>
    </Pressable>
  );
}

export const JobCard = memo(JobCardInner);
