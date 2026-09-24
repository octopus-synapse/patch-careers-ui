import { labelFor } from "@patch-careers/api-client";
import { Text, useEditorialPalette, XStack, YStack } from "@patch-careers/ui";
import { Bookmark } from "lucide-react-native";
import { Pressable } from "react-native";
import { AppLink } from "@/navigation/app-link";
import { useI18n } from "@/providers/i18n-provider";
import type { Opportunity } from "../lib/discovery";
import { toTitleCase } from "../lib/helpers";
import { JobLogo } from "./job-logo";
import { JobScore } from "./job-score";

export function OpportunityCard({
  job,
  score,
  onSave,
  pending = false,
  onVisit,
  list = false,
}: {
  job: Opportunity;
  score?: number | undefined;
  onSave?: ((job: Opportunity) => void) | undefined;
  pending?: boolean;
  onVisit?: (job: Opportunity) => void;
  list?: boolean;
}) {
  const palette = useEditorialPalette();
  const { t, locale } = useI18n();
  return (
    <YStack
      testID={`opportunity-${job.id}`}
      minHeight={list ? 140 : 221}
      height={list ? undefined : "100%"}
      gap={0}
      borderRadius={20}
      borderWidth={1}
      borderColor={palette.hairline}
      backgroundColor={palette.panel}
      hoverStyle={{ borderColor: palette.accent, backgroundColor: palette.surface }}
    >
      <AppLink href={{ pathname: "/job/[id]", params: { id: job.id } }} asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t("jobs.row.a11y", { title: job.title, company: job.company })}
          onPress={() => onVisit?.(job)}
          // @style-allow inline: React Native Pressable needs flex to make its link cover the complete card.
          style={{ flex: 1 }}
        >
          <YStack padding={22} flex={1}>
            <XStack alignItems="center" gap={10} paddingRight={24} minHeight={38}>
              <JobLogo job={job} />
              <Text fontSize={12} lineHeight={18} color={palette.body} numberOfLines={2} flex={1}>
                {job.company}
              </Text>
            </XStack>
            <YStack marginTop={list ? 8 : 20} marginBottom={list ? 4 : 9} minHeight={list ? 0 : 45}>
              <Text
                fontSize={list ? 20 : 15}
                lineHeight={list ? 27 : 22.5}
                fontWeight="600"
                color={palette.ink}
                numberOfLines={2}
              >
                {toTitleCase(job.title)}
              </Text>
            </YStack>
            <Text fontSize={11} lineHeight={18} color={palette.muted} numberOfLines={2}>
              {[
                job.location,
                job.workModeKnown !== false ? labelFor("RemotePolicy", job.workMode, locale) : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>
            <XStack
              marginTop={list ? 12 : "auto"}
              paddingTop={list ? 0 : 17}
              alignItems="center"
              justifyContent="space-between"
              gap={10}
            >
              <Text fontSize={10} color={palette.muted}>
                {job.employmentType ? labelFor("JobType", job.employmentType, locale) : ""}
              </Text>
              <JobScore score={score} ring={list} />
            </XStack>
          </YStack>
        </Pressable>
      </AppLink>
      {onSave ? (
        <YStack position="absolute" top={17} right={14}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(job.isSaved ? "jobs.save.remove" : "jobs.save.add")}
            accessibilityState={{ selected: job.isSaved, disabled: pending }}
            disabled={pending}
            onPress={() => onSave(job)}
          >
            <YStack padding={5} opacity={pending ? 0.35 : 1}>
              <Bookmark
                size={17}
                color={job.isSaved ? palette.ink : palette.muted}
                fill={job.isSaved ? palette.ink : "none"}
                strokeWidth={1.5}
              />
            </YStack>
          </Pressable>
        </YStack>
      ) : null}
    </YStack>
  );
}
