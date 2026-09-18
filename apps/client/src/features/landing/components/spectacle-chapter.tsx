import { YStack } from "@patch-careers/ui";
import type { ReactElement } from "react";
import { useI18n } from "@/providers/i18n-provider";
import type { ChapterContentProps } from "./chapter-content";
import { ChapterHeading, ChapterParagraph } from "./chapter-copy";

export function SpectacleChapter({ chapter, accent, width }: ChapterContentProps): ReactElement {
  const { t } = useI18n();
  const key = `landing.cinema.${chapter.key}`;
  return (
    <YStack padding={32} gap={24}>
      <ChapterHeading
        lead={t(`${key}.lead`)}
        emphasis={t(`${key}.emphasis`)}
        accent={accent}
        width={width}
      />
      <ChapterParagraph>{t(`${key}.caption`)}</ChapterParagraph>
    </YStack>
  );
}
