/**
 * One listing row, editorial treatment: no card surface — generous vertical
 * padding between hairlines, company kicker · serif title · meta line ·
 * recency + publisher footer, plus a right-aligned bookmark toggle.
 * Memoized — it renders inside the endless-scroll list.
 */

import { Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { Bookmark } from "lucide-react-native";
import { memo, type ReactElement } from "react";
import { Pressable } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { jobMetaLine, postedAgo, toTitleCase } from "../lib/helpers";
import type { ExternalJob } from "../types";

function JobRowInner({
  job,
  now,
  onPress,
  onToggleSave,
  savePending,
}: {
  job: ExternalJob;
  now: number;
  onPress: (job: ExternalJob) => void;
  onToggleSave: (job: ExternalJob) => void;
  savePending: boolean;
}): ReactElement {
  const editorialPalette = useEditorialPalette();
  const { t, locale } = useI18n();
  const meta = jobMetaLine(job, locale);
  const ago = postedAgo(job, now, t, locale);
  const title = toTitleCase(job.title);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("jobs.row.a11y", { title, company: job.company })}
      onPress={() => onPress(job)}
      style={({ pressed }) => ({
        backgroundColor: pressed ? editorialPalette.surface : "transparent",
      })}
    >
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
            {job.company}
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
          <XStack alignItems="center" justifyContent="space-between" gap={8}>
            <Text preset="caption" fontSize={12} color={editorialPalette.subtle}>
              {ago}
            </Text>
            {job.publisher ? (
              <Text preset="caption" fontSize={12} color={editorialPalette.subtle}>
                {t("jobs.row.viaPublisher", { publisher: job.publisher })}
              </Text>
            ) : null}
          </XStack>
        </YStack>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={job.isSaved ? t("jobs.save.remove") : t("jobs.save.add")}
          accessibilityState={{ selected: job.isSaved, disabled: savePending }}
          disabled={savePending}
          onPress={() => onToggleSave(job)}
          hitSlop={12}
          style={{ paddingTop: 2, opacity: savePending ? 0.4 : 1 }}
        >
          <Bookmark
            size={20}
            color={job.isSaved ? editorialPalette.ink : editorialPalette.subtle}
            fill={job.isSaved ? editorialPalette.ink : "transparent"}
          />
        </Pressable>
      </XStack>
    </Pressable>
  );
}

export const JobRow = memo(JobRowInner);
