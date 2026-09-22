import { Button, Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { Link } from "expo-router";
import { ArrowUpRight } from "lucide-react-native";
import type { ReactElement } from "react";
import { useWindowDimensions } from "react-native";
import { useLocalizedHref } from "@/navigation/locale-prefix";
import { useAppRouter } from "@/navigation/use-app-router";
import { useI18n } from "@/providers/i18n-provider";
import type { ChapterContentProps } from "./chapter-content";
import { ChapterLayer } from "./chapter-frame";

/** The closing invitation keeps its action beside the promise at every viewport size. */
export function CallToAction({ accent, width }: ChapterContentProps): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const router = useAppRouter();
  const localized = useLocalizedHref();
  const { height } = useWindowDimensions();
  const desktop = width >= 1024;
  const narrow = width < 640;
  const headingSize = desktop ? Math.min(86, width * 0.059) : narrow ? 46 : 68;

  return (
    <YStack
      testID="landing-cta"
      minHeight={height}
      backgroundColor={palette.bg}
      paddingHorizontal={desktop ? 88 : 24}
      paddingTop={desktop ? 128 : 112}
      paddingBottom={80}
      alignItems="center"
    >
      <YStack width="100%" maxWidth={1120} flex={1} justifyContent="center">
        <ChapterLayer depth={0}>
          <YStack gap={desktop ? 36 : 24}>
            <XStack gap={12} alignItems="center">
              <YStack width={28} height={2} backgroundColor={accent} />
              <Text
                fontFamily={editorialFonts.mono}
                fontSize={11}
                lineHeight={18}
                letterSpacing={1.1}
                color={palette.muted}
              >
                {t("landing.chapters.cta.eyebrow")}
              </Text>
            </XStack>

            <XStack
              flexDirection={desktop ? "row" : "column"}
              alignItems={desktop ? "center" : "stretch"}
              gap={desktop ? 64 : 32}
            >
              <Text
                accessibilityRole="header"
                flex={desktop ? 1 : undefined}
                minWidth={0}
                fontFamily={editorialFonts.serif}
                fontSize={headingSize}
                lineHeight={headingSize * 1.16}
                letterSpacing={-headingSize * 0.045}
                fontWeight="400"
                color={palette.ink}
              >
                {t("landing.chapters.cta.headingLead")}
                {"\n"}
                <Text
                  fontFamily={editorialFonts.serif}
                  fontSize={headingSize}
                  lineHeight={headingSize * 1.16}
                  letterSpacing={-headingSize * 0.045}
                  fontWeight="400"
                  fontStyle="italic"
                  color={accent}
                >
                  {t("landing.chapters.cta.headingEm")}
                </Text>
              </Text>

              <YStack width={desktop ? 320 : "100%"} maxWidth={480} gap={24}>
                <Text
                  fontFamily={editorialFonts.sans}
                  fontSize={17}
                  lineHeight={28}
                  color={palette.body}
                >
                  {t("landing.chapters.cta.body")}
                </Text>
                <YStack gap={12}>
                  <Button
                    testID="landing-cta-sign-up"
                    onPress={() => router.push(localized("/(auth)/auth"))}
                    accessibilityLabel={t("landing.chapters.cta.button")}
                    backgroundColor={palette.primary}
                    color={palette.onPrimary}
                    borderWidth={0}
                    borderRadius={12}
                    height={60}
                    paddingHorizontal={24}
                    justifyContent="space-between"
                    fontFamily={editorialFonts.sans}
                    fontSize={16}
                    fontWeight="600"
                    hoverStyle={{ backgroundColor: palette.primaryPress }}
                    pressStyle={{ backgroundColor: palette.primaryPress }}
                    focusVisibleStyle={{
                      outlineColor: accent,
                      outlineWidth: 2,
                      outlineOffset: 4,
                    }}
                  >
                    {t("landing.chapters.cta.button")}
                    <ArrowUpRight size={21} color={palette.onPrimary} aria-hidden />
                  </Button>
                  <Button
                    onPress={() => router.push(localized("/go"))}
                    accessibilityLabel={t("go.title")}
                    backgroundColor="transparent"
                    color={palette.ink}
                    borderWidth={1}
                    borderColor={palette.hairline}
                    borderRadius={12}
                    height={48}
                    fontFamily={editorialFonts.sans}
                    fontSize={14}
                  >
                    {t("go.title")}
                  </Button>
                  <Text
                    fontFamily={editorialFonts.sans}
                    fontSize={12}
                    lineHeight={18}
                    color={palette.muted}
                  >
                    {t("landing.chapters.cta.noCard")}
                  </Text>
                </YStack>
              </YStack>
            </XStack>
          </YStack>
        </ChapterLayer>

        <ChapterLayer depth={1}>
          <XStack
            flexDirection={narrow ? "column" : "row"}
            gap={narrow ? 20 : 32}
            marginTop={desktop ? 72 : 40}
            paddingTop={24}
            borderTopWidth={1}
            borderColor={palette.hairlineStrong}
          >
            {["profile", "job", "fit"].map((step, index) => (
              <XStack key={step} flex={narrow ? undefined : 1} gap={14} alignItems="baseline">
                <Text fontFamily={editorialFonts.mono} fontSize={11} color={accent}>
                  {String(index + 1).padStart(2, "0")}
                </Text>
                <Text
                  fontFamily={editorialFonts.sans}
                  fontSize={14}
                  lineHeight={22}
                  color={palette.body}
                  flexShrink={1}
                >
                  {t(`landing.chapters.cta.steps.${step}`)}
                </Text>
              </XStack>
            ))}
          </XStack>
        </ChapterLayer>
      </YStack>

      <XStack
        width="100%"
        maxWidth={1120}
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={16}
        marginTop={64}
        paddingTop={24}
        borderTopWidth={1}
        borderColor={palette.hairline}
      >
        <Text fontFamily={editorialFonts.sans} fontSize={12} color={palette.muted}>
          {t("landing.footer.copyright")}
        </Text>
        <XStack gap={24}>
          {(["privacy", "terms"] as const).map((kind) => (
            <Link key={kind} href={`https://patchcareers.org/${kind}`} target="_blank" asChild>
              <Text
                fontFamily={editorialFonts.sans}
                fontSize={12}
                color={palette.muted}
                paddingVertical={12}
                hoverStyle={{ color: palette.ink }}
              >
                {t(`landing.footer.${kind}`)}
              </Text>
            </Link>
          ))}
        </XStack>
      </XStack>
    </YStack>
  );
}
