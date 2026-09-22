import { authDialogPalette, brandColors } from "@patch-careers/tokens";
import { Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette, useThemeName } from "@patch-careers/ui/editorial";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { Pressable, ScrollView, TextInput, useWindowDimensions } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { AuthStepTitle } from "./auth-step-title";

export type SignupPlan = "free" | "go" | "max";
const plans: SignupPlan[] = ["free", "go", "max"];
const planFeatures = {
  free: [
    "go.freeCardProfile",
    "go.freeCardLanguages",
    "go.freeCardTranslations",
    "go.freeCardReview",
    "go.freeCardPdf",
    "go.freeCardOpportunities",
  ],
  go: [
    "go.goCardTranslations",
    "go.goCardMatch",
    "go.goCardRequirements",
    "go.goCardResume",
    "go.goCardLetter",
    "go.goCardLimit",
  ],
  max: ["go.goCardTranslations", "go.goCardMatch", "go.goCardResume", "go.maxCardLimit"],
} as const;

export function ChoosePlanStep({
  onContinue,
  onBack,
}: {
  readonly onContinue: (plan: SignupPlan, billingCountry: string) => void;
  readonly onBack: () => void;
}): ReactElement {
  const { t, locale } = useI18n();
  const palette = useEditorialPalette();
  const theme = useThemeName();
  const dialogPalette = authDialogPalette[theme];
  const { width } = useWindowDimensions();
  const columns = width >= 1180;
  const [plan, setPlan] = useState<SignupPlan | null>(null);
  const [billingCountry, setBillingCountry] = useState(locale === "pt-BR" ? "BR" : "US");
  const country = billingCountry.trim().toUpperCase();
  const validCountry = /^[A-Z]{2}$/.test(country);
  const canContinue = plan !== null && (plan === "free" || validCountry);
  const selectedBackground = theme === "light" ? "#F0F4E9" : "#2C382B";

  const cards = plans.map((option) => {
    const selected = plan === option;
    const featured = option === "go";
    const title = t(
      option === "free" ? "go.freeTitle" : option === "go" ? "go.paidTitle" : "go.maxTitle",
    );
    const price = t(
      option === "free"
        ? "go.freePrice"
        : option === "go"
          ? country === "BR"
            ? "go.brlPrice"
            : "go.usdPrice"
          : country === "BR"
            ? "go.maxBrlPrice"
            : "go.maxUsdPrice",
    );
    const tagline = t(
      option === "free" ? "go.freeTagline" : option === "go" ? "go.goTagline" : "go.maxTagline",
    );
    const features = planFeatures[option];
    const includes =
      option === "go" ? t("go.includesFree") : option === "max" ? t("go.includesGo") : null;

    return (
      <Pressable
        key={option}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={`${title}, ${price}${featured ? `, ${t("go.mostPopular")}` : ""}`}
        onPress={() => setPlan(option)}
        testID={`authDialog.plan.${option}`}
        style={{ flex: columns ? 1 : undefined, minWidth: 0 }}
      >
        <YStack
          height={columns ? "100%" : undefined}
          minHeight={columns ? 474 : undefined}
          borderWidth={selected ? 2 : 1}
          borderColor={selected ? dialogPalette.brand : dialogPalette.inputBorder}
          borderRadius={16}
          backgroundColor={selected ? selectedBackground : dialogPalette.input}
          paddingHorizontal={columns ? 27 : 25}
          paddingTop={24}
          paddingBottom={28}
        >
          <XStack alignItems="center" justifyContent="space-between" minHeight={30}>
            {featured ? (
              <YStack
                borderRadius={4}
                backgroundColor={brandColors.forest}
                paddingHorizontal={12}
                paddingVertical={7}
              >
                <Text
                  fontFamily={editorialFonts.sans}
                  fontSize={11}
                  lineHeight={15}
                  fontWeight="700"
                  color="#FFFFFF"
                >
                  {t("go.mostPopular")}
                </Text>
              </YStack>
            ) : (
              <YStack />
            )}
            <YStack
              width={24}
              height={24}
              borderRadius={12}
              borderWidth={selected ? 0 : 1}
              borderColor={dialogPalette.inputBorder}
              backgroundColor={selected ? dialogPalette.brand : "transparent"}
              alignItems="center"
              justifyContent="center"
            >
              {selected ? <Check size={15} color={dialogPalette.panel} strokeWidth={3} /> : null}
            </YStack>
          </XStack>
          <Text
            fontFamily={editorialFonts.serif}
            fontSize={columns ? 36 : 37}
            lineHeight={44}
            letterSpacing={-1.2}
            color={palette.ink}
            marginTop={18}
          >
            {title}
          </Text>
          <Text
            fontFamily={editorialFonts.sans}
            fontSize={14}
            lineHeight={21}
            color={dialogPalette.muted}
            marginTop={3}
          >
            {tagline}
          </Text>
          <Text
            fontFamily={editorialFonts.sans}
            fontSize={24}
            lineHeight={30}
            fontWeight="700"
            letterSpacing={-0.5}
            color={dialogPalette.brand}
            marginTop={23}
          >
            {price}
          </Text>
          <YStack
            height={1}
            backgroundColor={dialogPalette.inputBorder}
            marginTop={20}
            marginBottom={20}
          />
          {includes ? (
            <Text
              fontFamily={editorialFonts.sans}
              fontSize={13}
              lineHeight={20}
              fontWeight="700"
              color={dialogPalette.brand}
              marginBottom={16}
            >
              {includes}
            </Text>
          ) : null}
          <YStack gap={14}>
            {features.map((feature) => (
              <XStack key={feature} gap={12} alignItems="flex-start">
                <Check size={16} color={dialogPalette.brandMuted} style={{ marginTop: 3 }} />
                <Text
                  flex={1}
                  fontFamily={editorialFonts.sans}
                  fontSize={14}
                  lineHeight={22}
                  color={palette.ink}
                >
                  {t(feature)}
                </Text>
              </XStack>
            ))}
          </YStack>
        </YStack>
      </Pressable>
    );
  });

  const billingCountryControl = (
    <XStack alignItems="center" gap={12} flexWrap="wrap">
      <Text fontFamily={editorialFonts.sans} fontSize={13} color={palette.ink}>
        {t("go.chooseMarket")}
      </Text>
      <TextInput
        value={billingCountry}
        onChangeText={setBillingCountry}
        autoCapitalize="characters"
        maxLength={2}
        accessibilityLabel={t("go.billingCountry")}
        testID="authDialog.billingCountry"
        style={{
          width: 64,
          borderWidth: 1,
          borderColor: dialogPalette.inputBorder,
          borderRadius: 8,
          padding: 8,
          fontSize: 14,
          textAlign: "center",
          color: palette.ink,
          backgroundColor: dialogPalette.input,
        }}
      />
    </XStack>
  );

  const content = (
    <YStack gap={columns ? 24 : width < 600 ? 26 : 20} width="100%">
      <XStack alignItems="flex-end" justifyContent="space-between" gap={16} flexWrap="wrap">
        <YStack flex={1} minWidth={width < 600 ? 240 : 360}>
          <AuthStepTitle variant="plan">{t("go.choosePlanTitle")}</AuthStepTitle>
          <Text
            fontFamily={editorialFonts.sans}
            fontSize={14}
            lineHeight={21}
            color={dialogPalette.muted}
            marginTop={8}
          >
            {t("go.lead")}
          </Text>
        </YStack>
        {columns && plan !== null && plan !== "free" ? billingCountryControl : null}
      </XStack>
      {columns ? <XStack gap={14}>{cards}</XStack> : <YStack gap={14}>{cards}</YStack>}
      {!columns && plan !== null && plan !== "free" ? billingCountryControl : null}
      {plan !== null && plan !== "free" ? (
        <YStack gap={4}>
          {!validCountry ? (
            <Text color={palette.danger} fontSize={12}>
              {t("go.invalidCountry")}
            </Text>
          ) : null}
          <Text fontFamily={editorialFonts.sans} fontSize={12} color={dialogPalette.muted}>
            {t("go.countryNote")}
          </Text>
        </YStack>
      ) : null}
    </YStack>
  );

  const actions = (
    <XStack gap={12} width="100%">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common.back")}
        onPress={onBack}
        testID="authDialog.planBack"
        style={{ flex: 0.42 }}
      >
        <XStack
          minHeight={56}
          alignItems="center"
          justifyContent="center"
          gap={8}
          paddingHorizontal={16}
          borderWidth={1}
          borderColor={dialogPalette.inputBorder}
          borderRadius={9}
          backgroundColor={dialogPalette.input}
        >
          <ArrowLeft size={17} color={dialogPalette.brand} />
          <Text
            fontFamily={editorialFonts.sans}
            fontWeight="600"
            fontSize={14}
            color={dialogPalette.brand}
          >
            {t("common.back")}
          </Text>
        </XStack>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common.continue")}
        accessibilityState={{ disabled: !canContinue }}
        disabled={!canContinue}
        onPress={() => {
          if (plan) onContinue(plan, country);
        }}
        testID="authDialog.planContinue"
        style={{ flex: 1 }}
      >
        <XStack
          minHeight={56}
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal={20}
          borderRadius={9}
          backgroundColor={dialogPalette.primary}
          opacity={canContinue ? 1 : 0.45}
        >
          <Text
            fontFamily={editorialFonts.sans}
            fontWeight="700"
            fontSize={15}
            color={palette.onPrimary}
          >
            {t("common.continue")}
          </Text>
          <ArrowUpRight size={18} color={palette.onPrimary} />
        </XStack>
      </Pressable>
    </XStack>
  );

  if (width < 600) {
    return (
      <YStack width="100%" flex={1} minHeight={0} overflow="hidden">
        <ScrollView
          style={{ width: "100%", flex: 1, minHeight: 0 }}
          contentContainerStyle={{ paddingTop: 64, paddingBottom: 26 }}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          testID="authDialog.planScroller"
        >
          {content}
        </ScrollView>
        <YStack
          paddingTop={14}
          borderTopWidth={1}
          borderTopColor={dialogPalette.inputBorder}
          backgroundColor={dialogPalette.panel}
          flexShrink={0}
          testID="authDialog.planActions"
        >
          {actions}
        </YStack>
      </YStack>
    );
  }

  return (
    <YStack gap={columns ? 24 : 20} width="100%">
      {content}
      {actions}
    </YStack>
  );
}
