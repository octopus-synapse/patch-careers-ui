/**
 * Editorial section header for the grouped list — small-caps muted label with
 * generous top breathing room. Used for both the period sections of the jobs
 * list ("Hoje" / "Esta semana" / "Anteriores") and the status sections of the
 * Candidaturas scope ("Em análise" / "Resposta" / …). The caller resolves the
 * display title so this stays a pure presenter.
 */

import { Text, YStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";

export function JobSectionHeader({ title }: { title: string }): ReactElement {
  const editorialPalette = useEditorialPalette();
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
        {title}
      </Text>
    </YStack>
  );
}
