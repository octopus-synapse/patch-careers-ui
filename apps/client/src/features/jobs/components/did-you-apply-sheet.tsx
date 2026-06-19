/**
 * "Você se candidatou?" prompt — shown on return from an external apply site
 * (applying happens off-app, so we can't observe it). A "yes" records the
 * self-reported application (saving the listing first if needed) so it appears
 * in the Candidaturas scope; "Ainda não" / "Agora não" just dismiss.
 *
 * Built from the shared `Sheet` + `PrimaryAction` primitives — no new chrome.
 */

import { Sheet, Text, YStack } from "@patch-careers/ui";
import { PrimaryAction, useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { Pressable } from "react-native";
import { useI18n } from "@/providers/i18n-provider";

export function DidYouApplySheet({
  open,
  onOpenChange,
  onAnswer,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `true` = "sim, me candidatei"; `false` = "ainda não". */
  onAnswer: (didApply: boolean) => void;
  pending: boolean;
}): ReactElement {
  const editorialPalette = useEditorialPalette();
  const { t } = useI18n();

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("jobs.didApply.title")}
      closeLabel={t("jobs.didApply.dismiss")}
      snapPoints={[42]}
    >
      <YStack gap={20} paddingTop={4} paddingBottom={8}>
        <Text fontSize={15} lineHeight={22} color={editorialPalette.body}>
          {t("jobs.didApply.description")}
        </Text>
        <YStack gap={10}>
          <PrimaryAction
            label={t("jobs.didApply.yes")}
            onPress={() => onAnswer(true)}
            disabled={pending}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("jobs.didApply.no")}
            disabled={pending}
            onPress={() => onAnswer(false)}
            hitSlop={8}
          >
            <Text preset="caption" fontSize={14} color={editorialPalette.muted} textAlign="center">
              {t("jobs.didApply.no")}
            </Text>
          </Pressable>
        </YStack>
      </YStack>
    </Sheet>
  );
}
