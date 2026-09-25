import { authDialogPalette, brandColors } from "@patch-careers/tokens";
import { Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette, useThemeName } from "@patch-careers/ui/editorial";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react-native";
import { type ReactElement, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, useWindowDimensions } from "react-native";
import { ConsentDialog } from "@/components/auth/consent-dialog";
import { type BillingOffer, type BillingOfferCode, useBillingOffers } from "@/features/billing";
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

function splitPrice(price: string, cadence: string): { amount: string; cadence?: string } {
  const suffix = ` ${cadence}`;
  if (price.endsWith(suffix)) {
    return { amount: price.slice(0, -suffix.length), cadence };
  }
  return { amount: price };
}

function formatPrice(locale: string, cents: number): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function ChoosePlanStep({
  onContinue,
  onBack,
  requireAccountConsent = false,
  submitting = false,
}: {
  readonly onContinue: (plan: SignupPlan, offerCode?: BillingOfferCode) => void | Promise<void>;
  readonly onBack: () => void;
  readonly requireAccountConsent?: boolean;
  readonly submitting?: boolean;
}): ReactElement {
  const { t, locale } = useI18n();
  const palette = useEditorialPalette();
  const theme = useThemeName();
  const dialogPalette = authDialogPalette[theme];
  const { width } = useWindowDimensions();
  const columns = width >= 1180;
  const [plan, setPlan] = useState<SignupPlan | null>(null);
  const [offerCode, setOfferCode] = useState<BillingOfferCode | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const billingOffers = useBillingOffers();
  const offers = billingOffers.data ?? [];
  const paidOffers = plan === "go" || plan === "max" ? offers.filter((x) => x.plan === plan) : [];
  const selectedOffer = offers.find((offer) => offer.code === offerCode);
  const canContinue =
    plan !== null &&
    (plan === "free" || (billingOffers.checkoutEnabled && selectedOffer?.plan === plan)) &&
    !submitting;
  const selectedBackground = dialogPalette.selected;

  useEffect(() => {
    if (plan !== "go" && plan !== "max") return;
    if (selectedOffer?.plan === plan) return;
    const defaultOffer =
      offers.find((offer) => offer.plan === plan && offer.paymentMethod === "card") ??
      offers.find((offer) => offer.plan === plan);
    setOfferCode(defaultOffer?.code ?? null);
  }, [offers, plan, selectedOffer?.plan]);

  const choosePlan = (option: SignupPlan): void => {
    setPlan(option);
    if (option === "free") setOfferCode(null);
  };

  const submitSelection = (): void | Promise<void> => {
    if (!plan || !canContinue) return;
    return plan === "free" ? onContinue(plan) : onContinue(plan, offerCode ?? undefined);
  };

  const continueWithSelection = (): void => {
    void submitSelection();
  };

  const offerLabel = (offer: BillingOffer): string => {
    if (offer.paymentMethod === "card") return t("go.cardMonthlyOption");
    if (offer.code === "max_pix_year_founder") return t("go.pixFounderOption");
    return offer.termMonths === 3 ? t("go.pixQuarterOption") : t("go.pixYearOption");
  };

  const cards = plans.map((option) => {
    const selected = plan === option;
    const featured = option === "go";
    const title = t(
      option === "free" ? "go.freeTitle" : option === "go" ? "go.paidTitle" : "go.maxTitle",
    );
    const price = t(
      option === "free" ? "go.freePrice" : option === "go" ? "go.brlPrice" : "go.maxBrlPrice",
    );
    const priceParts = splitPrice(price, t("go.monthlyCadence"));
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
        accessibilityLabel={`${title}, ${option === "free" ? tagline : price}${featured ? `, ${t("go.mostPopular")}` : ""}`}
        onPress={submitting ? undefined : () => choosePlan(option)}
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
                  color={dialogPalette.onPrimary}
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
          {option !== "free" ? (
            <XStack alignItems="baseline" gap={7} marginTop={23} minHeight={30}>
              <Text
                fontFamily={editorialFonts.sans}
                fontSize={22}
                lineHeight={27}
                fontWeight="600"
                letterSpacing={-0.35}
                color={palette.ink}
              >
                {priceParts.amount}
              </Text>
              {priceParts.cadence ? (
                <Text
                  fontFamily={editorialFonts.sans}
                  fontSize={12}
                  lineHeight={16}
                  color={dialogPalette.muted}
                >
                  {priceParts.cadence}
                </Text>
              ) : null}
            </XStack>
          ) : null}
          <YStack
            height={1}
            backgroundColor={dialogPalette.inputBorder}
            marginTop={option === "free" ? 26 : 18}
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
                <Check
                  size={16}
                  color={dialogPalette.brandMuted}
                  // @style-allow inline: lucide icons expose alignment only through their native style prop
                  style={{ marginTop: 3 }}
                />
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

  const content = (
    <YStack gap={columns ? 24 : width < 600 ? 26 : 20} width="100%">
      <YStack width="100%" maxWidth={640} alignSelf="center" alignItems="center">
        <AuthStepTitle variant="plan" centered isPage>
          {t("go.choosePlanTitle")}
        </AuthStepTitle>
      </YStack>
      {columns ? <XStack gap={14}>{cards}</XStack> : <YStack gap={14}>{cards}</YStack>}
      {plan === "go" || plan === "max" ? (
        <YStack
          width="100%"
          borderWidth={1}
          borderColor={dialogPalette.inputBorder}
          borderRadius={16}
          backgroundColor={dialogPalette.input}
          padding={20}
          gap={12}
        >
          <Text
            fontFamily={editorialFonts.sans}
            fontSize={15}
            lineHeight={21}
            fontWeight="700"
            color={palette.ink}
          >
            {t("go.choosePaymentOption")}
          </Text>
          {billingOffers.isLoading ? (
            <XStack gap={10} alignItems="center">
              <ActivityIndicator size="small" color={dialogPalette.brand} />
              <Text fontFamily={editorialFonts.sans} fontSize={13} color={dialogPalette.muted}>
                {t("go.pricingLoading")}
              </Text>
            </XStack>
          ) : !billingOffers.checkoutEnabled || paidOffers.length === 0 ? (
            <Text fontFamily={editorialFonts.sans} fontSize={13} color={dialogPalette.muted}>
              {t("go.unavailable")}
            </Text>
          ) : (
            <YStack gap={9} accessibilityRole="radiogroup">
              {paidOffers.map((offer) => {
                const offerSelected = offer.code === offerCode;
                const monthlyCents = Math.round(offer.amountCents / offer.termMonths);
                return (
                  <Pressable
                    key={offer.code}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: offerSelected }}
                    accessibilityLabel={`${offerLabel(offer)}, ${formatPrice(locale, offer.amountCents)}`}
                    disabled={submitting}
                    onPress={() => setOfferCode(offer.code)}
                    testID={`authDialog.offer.${offer.code}`}
                  >
                    <XStack
                      minHeight={62}
                      alignItems="center"
                      gap={12}
                      borderWidth={offerSelected ? 2 : 1}
                      borderColor={offerSelected ? dialogPalette.brand : dialogPalette.inputBorder}
                      borderRadius={10}
                      paddingHorizontal={14}
                      paddingVertical={10}
                      backgroundColor={offerSelected ? selectedBackground : dialogPalette.panel}
                    >
                      <YStack
                        width={20}
                        height={20}
                        borderRadius={10}
                        borderWidth={offerSelected ? 0 : 1}
                        borderColor={dialogPalette.inputBorder}
                        backgroundColor={offerSelected ? dialogPalette.brand : "transparent"}
                        alignItems="center"
                        justifyContent="center"
                      >
                        {offerSelected ? (
                          <Check size={13} color={dialogPalette.panel} strokeWidth={3} />
                        ) : null}
                      </YStack>
                      <YStack flex={1} minWidth={0}>
                        <Text
                          fontFamily={editorialFonts.sans}
                          fontSize={14}
                          lineHeight={20}
                          fontWeight="700"
                          color={palette.ink}
                        >
                          {offerLabel(offer)}
                        </Text>
                        {offer.termMonths > 1 ? (
                          <Text
                            fontFamily={editorialFonts.sans}
                            fontSize={12}
                            lineHeight={18}
                            color={dialogPalette.muted}
                          >
                            {t("go.monthlyEquivalent", {
                              price: formatPrice(locale, monthlyCents),
                            })}
                          </Text>
                        ) : null}
                      </YStack>
                      <YStack alignItems="flex-end">
                        {offer.listAmountCents > offer.amountCents ? (
                          <Text
                            fontFamily={editorialFonts.sans}
                            fontSize={11}
                            lineHeight={16}
                            color={dialogPalette.muted}
                            textDecorationLine="line-through"
                          >
                            {formatPrice(locale, offer.listAmountCents)}
                          </Text>
                        ) : null}
                        <Text
                          fontFamily={editorialFonts.sans}
                          fontSize={15}
                          lineHeight={20}
                          fontWeight="700"
                          color={dialogPalette.brand}
                        >
                          {formatPrice(locale, offer.amountCents)}
                        </Text>
                        {offer.listAmountCents > offer.amountCents ? (
                          <Text
                            fontFamily={editorialFonts.sans}
                            fontSize={11}
                            lineHeight={16}
                            color={dialogPalette.brandMuted}
                          >
                            {t("go.pixDiscount")}
                          </Text>
                        ) : null}
                      </YStack>
                    </XStack>
                  </Pressable>
                );
              })}
            </YStack>
          )}
        </YStack>
      ) : null}
    </YStack>
  );

  const actions = (
    <XStack gap={12} width="100%">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common.back")}
        disabled={submitting}
        onPress={submitting ? undefined : onBack}
        testID="authDialog.planBack"
        style={columns ? { width: 220 } : { flex: 0.42 }}
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
        accessibilityLabel={t(
          requireAccountConsent ? "auth.createAccountAndContinue" : "common.continue",
        )}
        accessibilityState={{ disabled: !canContinue, busy: submitting }}
        disabled={!canContinue}
        onPress={() => {
          if (!plan) return;
          if (requireAccountConsent) {
            setConsentOpen(true);
            return;
          }
          continueWithSelection();
        }}
        testID="authDialog.planContinue"
        // @style-allow inline: native Pressable requires its layout through the style prop
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
          {submitting ? (
            <ActivityIndicator size="small" color={palette.onPrimary} />
          ) : (
            <>
              <Text
                fontFamily={editorialFonts.sans}
                fontWeight="700"
                fontSize={15}
                color={palette.onPrimary}
              >
                {t(requireAccountConsent ? "auth.createAccountAndContinue" : "common.continue")}
              </Text>
              <ArrowUpRight size={18} color={palette.onPrimary} />
            </>
          )}
        </XStack>
      </Pressable>
    </XStack>
  );

  if (width < 600) {
    return (
      <YStack width="100%" flex={1} minHeight={0} overflow="hidden">
        <ScrollView
          // @style-allow inline: native ScrollView requires viewport sizing through the style prop
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
        <ConsentDialog
          open={consentOpen}
          onOpenChange={setConsentOpen}
          loading={submitting}
          onAccept={() => {
            if (!plan) return;
            void Promise.resolve(submitSelection()).finally(() => setConsentOpen(false));
          }}
          testID="authDialog.planConsentDialog"
        />
      </YStack>
    );
  }

  return (
    <YStack gap={columns ? 24 : 20} width="100%">
      {content}
      {actions}
      <ConsentDialog
        open={consentOpen}
        onOpenChange={setConsentOpen}
        loading={submitting}
        onAccept={() => {
          if (!plan) return;
          void Promise.resolve(submitSelection()).finally(() => setConsentOpen(false));
        }}
        testID="authDialog.planConsentDialog"
      />
    </YStack>
  );
}
