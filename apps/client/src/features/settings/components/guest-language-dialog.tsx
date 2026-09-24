import type { Locale } from "@patch-careers/i18n";
import { authDialogPalette } from "@patch-careers/tokens";
import { YStack } from "@patch-careers/ui";
import { BrandMark, editorialFonts, useThemeName } from "@patch-careers/ui/editorial";
import { ArrowUpRight, Check } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useLocaleSwitch } from "@/navigation/use-locale-switch";
import { localeFromLanguageTag, useI18n } from "@/providers/i18n-provider";

const LANGUAGES: { value: Locale; label: string; region: string }[] = [
  { value: "pt-BR", label: "Português", region: "Brasil" },
  { value: "en", label: "English", region: "United States" },
];

export function GuestLanguageDialog({
  onConfirm,
}: {
  readonly onConfirm: () => void;
}): ReactElement {
  const { t } = useI18n();
  const colors = authDialogPalette[useThemeName()];
  const switchLocale = useLocaleSwitch();
  const { width, height } = useWindowDimensions();
  const compact = height < 550;
  const [selected, setSelected] = useState<Locale>(() => localeFromLanguageTag(navigator.language));

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
            style={{
              color: colors.brand,
              fontFamily: editorialFonts.serif,
              fontSize: width < 400 ? 34 : 38,
              lineHeight: width < 400 ? 38 : 41,
              letterSpacing: -1.2,
              marginBottom: compact ? 44 : 48,
            }}
          >
            {t("landing.languageConfirm.title")}
          </Text>

          <YStack accessibilityRole="radiogroup" gap={9}>
            {LANGUAGES.map((language) => {
              const active = selected === language.value;
              return (
                <Pressable
                  key={language.value}
                  testID={`guestLanguage.${language.value}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  onPress={() => setSelected(language.value)}
                  style={{
                    minHeight: compact ? 54 : 58,
                    borderWidth: 1,
                    borderColor: active ? colors.brand : colors.inputBorder,
                    backgroundColor: colors.input,
                    borderRadius: 7,
                    paddingHorizontal: 17,
                    paddingVertical: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <YStack flex={1} gap={2}>
                    <Text
                      style={{
                        color: colors.brand,
                        fontFamily: editorialFonts.sans,
                        fontSize: 15,
                        fontWeight: active ? "600" : "400",
                      }}
                    >
                      {language.label}
                    </Text>
                    <Text
                      style={{ color: colors.muted, fontFamily: editorialFonts.sans, fontSize: 12 }}
                    >
                      {language.region}
                    </Text>
                  </YStack>
                  {active ? <Check size={19} color={colors.brand} strokeWidth={2} /> : null}
                </Pressable>
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
              {t("landing.languageConfirm.confirm")}
            </Text>
            <ArrowUpRight size={18} color={colors.onPrimary} strokeWidth={1.8} />
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}
