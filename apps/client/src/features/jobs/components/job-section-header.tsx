/**
 * Editorial period header for the grouped list ("Hoje" / "Esta semana" /
 * "Anteriores"): small-caps muted label with generous top breathing room.
 * Receives the section *key* and resolves the display title itself.
 */

import { Text, YStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { useI18n } from "@/providers/i18n-provider";
import type { JobSection } from "../lib/helpers";

export function JobSectionHeader({ sectionKey }: { sectionKey: JobSection["key"] }): ReactElement {
  const editorialPalette = useEditorialPalette();
  const { t } = useI18n();
  return (
    <YStack paddingHorizontal={20} paddingTop={28} paddingBottom={6}>
      <Text
        preset="caption"
        fontSize={11}
        fontWeight="600"
        letterSpacing={1.6}
        textTransform="uppercase"
        color={editorialPalette.muted}
      >
        {t(`jobs.sections.${sectionKey}`)}
      </Text>
    </YStack>
  );
}
