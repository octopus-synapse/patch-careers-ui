import { Text, YStack } from "@patch-careers/ui";
import { useI18n } from "@/providers/i18n-provider";
import { STATISTIC_GREEN, STATISTIC_PAPER } from "../lib/statistic-theme";
import type { ChapterContentProps } from "./chapter-content";
export function StatisticChapter({ chapter }: ChapterContentProps) {
  const { t } = useI18n();
  const key = `landing.statistics.${chapter.key}`;
  return (
    <YStack backgroundColor={STATISTIC_GREEN} padding={24} gap={24}>
      {chapter.key === "qualified" && (
        <Text color={STATISTIC_PAPER} fontSize={32}>
          {t(`${key}.heading`)}
        </Text>
      )}
      {t(`${key}.number`) && (
        <Text color={STATISTIC_PAPER} fontSize={64}>
          {t(`${key}.number`)}
          {chapter.key === "dor" ? "s" : ""}
        </Text>
      )}
      {chapter.key !== "qualified" && (
        <Text color={STATISTIC_PAPER} fontSize={32}>
          {t(`${key}.heading`)}
        </Text>
      )}
      <Text color={STATISTIC_PAPER}>{t(`${key}.body`)}</Text>
      <Text color={STATISTIC_PAPER} fontSize={12}>
        {t(`${key}.source`)}
      </Text>
    </YStack>
  );
}
