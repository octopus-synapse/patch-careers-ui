import type { Locale } from "@patch-careers/i18n";
import { authDialogPalette } from "@patch-careers/tokens";
import { YStack } from "@patch-careers/ui";
import {
  BrandMark,
  editorialFonts,
  LanguageOptionCard,
  useEditorialPalette,
  useThemeName,
} from "@patch-careers/ui/editorial";
import { ArrowUpRight } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useLocaleSwitch } from "@/navigation/use-locale-switch";
import { localeFromLanguageTag } from "@/providers/i18n-locale";
import { translatorFor } from "@/providers/i18n-provider";

const LANGUAGES: Locale[] = ["pt-BR", "en"];

export function GuestLanguageDialog({
  onConfirm,
}: {
  readonly onConfirm: () => void;
}): ReactElement {
  const colors = authDialogPalette[useThemeName()];
  const palette = useEditorialPalette();
  const switchLocale = useLocaleSwitch();
  const { width, height } = useWindowDimensions();
  const compact = height < 550;
  const [selected, setSelected] = useState<Locale>(() => localeFromLanguageTag(navigator.language));
  const selectedT = translatorFor(selected);

  const confirm = async (): Promise<void> => {
    if (await switchLocale(selected)) onConfirm();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => undefined}>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.scrim,
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <ScrollView
          accessibilityViewIsModal
          testID="guestLanguage.dialog"
          style={{
            width: Math.min(width - 32, 550),
            maxHeight: height - 32,
            flexGrow: 0,
            backgroundColor: colors.panel,
            borderColor: colors.panelBorder,
            borderWidth: 1,
            borderRadius: 17,
            boxShadow: "0 24px 70px rgba(0, 0, 0, 0.22)",
          }}
          contentContainerStyle={{
            paddingHorizontal: width < 540 ? 33 : 37,
            paddingTop: compact ? 31 : 38,
            paddingBottom: compact ? 31 : 38,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 9,
              marginBottom: compact ? 32 : 38,
            }}
          >
            <BrandMark size={29} />
            <Text
              style={{
                fontFamily: editorialFonts.sans,
                fontSize: 35,
                lineHeight: 37,
                fontWeight: "800",
                letterSpacing: -2.2,
                color: colors.wordmark,
              }}
            >
              patch
            </Text>
          </View>

          <Text
            numberOfLines={2}
            style={{
              color: palette.ink,
              fontFamily: editorialFonts.serif,
              fontSize: width < 400 ? 34 : 38,
              lineHeight: width < 400 ? 38 : 41,
              height: width < 400 ? 76 : 82,
              letterSpacing: -1.2,
              marginBottom: compact ? 22 : 24,
            }}
          >
            {selectedT("landing.languageConfirm.title")}
          </Text>

          <YStack accessibilityRole="radiogroup" gap={16}>
            {LANGUAGES.map((language) => {
              const active = selected === language;
              return (
                <LanguageOptionCard
                  key={language}
                  testID={`guestLanguage.${language}`}
                  label={selectedT(language === "en" ? "landing.nav.langEn" : "landing.nav.langPt")}
                  description={selectedT(
                    language === "en" ? "landing.nav.langEnRegion" : "landing.nav.langPtRegion",
                  )}
                  selected={active}
                  onPress={() => setSelected(language)}
                />
              );
            })}
          </YStack>

          <Pressable
            testID="guestLanguage.confirm"
            accessibilityRole="button"
            onPress={() => void confirm()}
            style={{
              minHeight: 51,
              backgroundColor: colors.primary,
              borderRadius: 7,
              paddingHorizontal: 18,
              marginTop: compact ? 20 : 24,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                color: colors.onPrimary,
                fontFamily: editorialFonts.sans,
                fontSize: 13,
                fontWeight: "500",
              }}
            >
              {selectedT("landing.languageConfirm.confirm")}
            </Text>
            <ArrowUpRight size={18} color={colors.onPrimary} strokeWidth={1.8} />
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}
