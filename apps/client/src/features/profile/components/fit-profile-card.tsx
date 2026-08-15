/**
 * <FitProfileCard> — the profile page's invitation to answer (or renew) the
 * Fit questionnaire, which unlocks per-job Match. Hidden while the fit is
 * current ("responded") — the Desempenho sheet's FitRow covers that state.
 */
import { Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts as fonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import type { ReactElement, ReactNode } from "react";
import { Pressable } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { useMeScores } from "../hooks/use-me-scores";

export function FitProfileCard(): ReactElement | null {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const router = useRouter();
  const { scores } = useMeScores();
  const status = scores?.fit.status;
  if (!status || status === "responded") return null;
  const expired = status === "expired";
  const ctaLabel = expired ? t("profile.fitCard.ctaExpired") : t("profile.fitCard.cta");

  return (
    <YStack
      borderWidth={1}
      borderColor={palette.hairline}
      backgroundColor={palette.panel}
      borderRadius={18}
      padding={18}
      gap={12}
    >
      <Text
        fontFamily={fonts.sans}
        fontSize={10}
        fontWeight="600"
        letterSpacing={1.8}
        textTransform="uppercase"
        color={palette.muted}
      >
        {t("profile.fitCard.title")}
      </Text>
      <Text fontFamily={fonts.sans} fontSize={13.5} lineHeight={19} color={palette.body}>
        {expired ? t("profile.fitCard.bodyExpired") : t("profile.fitCard.body")}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
        onPress={() => router.push("/fit-questionnaire")}
      >
        {({ pressed }: { pressed: boolean }): ReactNode => (
          <XStack
            backgroundColor={palette.ink}
            opacity={pressed ? 0.85 : 1}
            paddingVertical={13}
            paddingHorizontal={22}
            borderRadius={999}
            alignItems="center"
            justifyContent="center"
            gap={8}
          >
            <Text fontFamily={fonts.sans} fontSize={15} fontWeight="600" color={palette.bg}>
              {ctaLabel}
            </Text>
            <ArrowRight size={16} color={palette.bg} strokeWidth={1.75} />
          </XStack>
        )}
      </Pressable>
    </YStack>
  );
}
