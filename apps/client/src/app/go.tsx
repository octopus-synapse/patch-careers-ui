import { fetcher } from "@patch-careers/api-client";
import { Text, useToast, YStack } from "@patch-careers/ui";
import { editorialFonts, PrimaryAction, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { type ReactElement, useCallback, useEffect, useState } from "react";
import { Alert, Platform, ScrollView } from "react-native";
import { AuthFlowPanel } from "@/components/auth/auth-dialog/auth-flow-panel";
import { ChoosePlanStep, type SignupPlan } from "@/components/auth/auth-dialog/choose-plan-step";
import { AuthPageFrame } from "@/components/auth/auth-page-frame";
import {
  type BillingOfferCode,
  cancelBillingCheckout,
  createBillingCheckoutRoute,
  PendingCheckoutDialog,
  useBillingOffers,
  usePatchPlan,
} from "@/features/billing";
import { AUTH_ROUTE } from "@/navigation/auth-redirect";
import { useAppRouter } from "@/navigation/use-app-router";
import { useAuthBootstrap, useAuthState } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

type BillingPayment = {
  id: string;
  status: string;
  amountCents: number;
  currency: string;
  paidAt: string | null;
};

export default function PatchGoScreen(): ReactElement | null {
  const { t, locale } = useI18n();
  const palette = useEditorialPalette();
  const router = useAppRouter();
  const toast = useToast();
  const { checkout } = useLocalSearchParams<{
    checkout?: string;
  }>();
  const { hasBootstrapped } = useAuthBootstrap();
  const { isAuthenticated, currentUser } = useAuthState();
  const [opening, setOpening] = useState(false);
  const [requestedChoice, setRequestedChoice] = useState<{
    plan: SignupPlan;
    offerCode?: BillingOfferCode;
  } | null>(null);
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const billing = usePatchPlan(checkout === "success");
  const billingOffers = useBillingOffers();
  const [payments, setPayments] = useState<BillingPayment[]>([]);
  const offers = billingOffers.data ?? [];
  const state = billing.data;
  const openCheckoutId = state?.openCheckout?.id;
  const resumeCheckout = (offerCode: BillingOfferCode) => {
    void openBilling(offerCode.startsWith("max_") ? "max" : "go", offerCode);
  };

  useEffect(() => {
    if (!billing.data?.active) return;
    void fetcher<{ items: BillingPayment[] }>({
      method: "GET",
      url: "/api/v1/billing/subscription/payments?page=1&limit=12",
    })
      .then((response) => setPayments(response.data.items))
      .catch(() => setPayments([]));
  }, [billing.data?.active]);

  useEffect(() => {
    if (checkout === "success" && isAuthenticated) void billing.refetch();
  }, [checkout, isAuthenticated, billing.refetch]);

  useEffect(() => {
    if (
      checkout === "success" &&
      billing.data?.active &&
      currentUser &&
      !currentUser.hasCompletedOnboarding
    ) {
      router.replace("/onboarding");
    }
  }, [checkout, billing.data?.active, currentUser, router]);

  const openBilling = useCallback(
    async (plan?: "go" | "max", requestedOffer?: BillingOfferCode): Promise<void> => {
      if (!isAuthenticated) {
        router.push(AUTH_ROUTE);
        return;
      }
      setOpening(true);
      try {
        if (!plan) return;
        if (Platform.OS !== "web") {
          toast.show({ title: t("go.mobileBillingComingSoon"), intent: "neutral" });
          return;
        }
        const selectedOffer = requestedOffer ?? `${plan}_card_month`;
        const latest = await billing.refetch();
        if (latest.isError || !latest.data) throw new Error("billing-status-unavailable");
        const open = latest.data.openCheckout;
        if (open) {
          if (open.offerCode === selectedOffer) {
            // Repeating the same offer is idempotent and also recovers a Pix
            // order whose provider response was lost before we saved its QR.
            const route = await createBillingCheckoutRoute(selectedOffer);
            window.location.assign(String(route));
            return;
          }
          if (open.offerCode.includes("_pix_")) {
            setSwitchError(null);
            setRequestedChoice({ plan, offerCode: selectedOffer });
            return;
          }
          toast.show({ title: t("go.continuePayment"), intent: "neutral" });
          return;
        }
        const route = await createBillingCheckoutRoute(selectedOffer);
        window.location.assign(String(route));
      } catch {
        toast.show({ title: t("go.error"), intent: "danger" });
      } finally {
        setOpening(false);
      }
    },
    [billing.refetch, isAuthenticated, router, t, toast],
  );

  const cancelSubscription = useCallback(async () => {
    setOpening(true);
    try {
      await fetcher({ method: "POST", url: "/api/v1/billing/subscription/cancel" });
      await billing.refetch();
    } catch {
      toast.show({ title: t("go.error"), intent: "danger" });
    } finally {
      setOpening(false);
    }
  }, [billing.refetch, t, toast]);

  const confirmCancellation = useCallback(() => {
    if (Platform.OS === "web") {
      if (window.confirm(`${t("go.cancelConfirmTitle")}\n\n${t("go.cancelConfirmBody")}`)) {
        void cancelSubscription();
      }
      return;
    }
    Alert.alert(t("go.cancelConfirmTitle"), t("go.cancelConfirmBody"), [
      { text: t("go.keepSubscription"), style: "cancel" },
      {
        text: t("go.cancelConfirmAction"),
        style: "destructive",
        onPress: () => void cancelSubscription(),
      },
    ]);
  }, [cancelSubscription, t]);

  const updatePaymentMethod = useCallback(async () => {
    setOpening(true);
    try {
      const returnUrl =
        Platform.OS === "web"
          ? `${window.location.origin}/go?paymentMethod=success`
          : "patchcareers://go?paymentMethod=success";
      const response = await fetcher<{ url: string }>({
        method: "POST",
        url: "/api/v1/billing/subscription/payment-method-session",
        data: { returnUrl },
      });
      if (Platform.OS === "web") window.location.assign(response.data.url);
      else await WebBrowser.openAuthSessionAsync(response.data.url, returnUrl);
      await billing.refetch();
    } catch {
      toast.show({ title: t("go.error"), intent: "danger" });
    } finally {
      setOpening(false);
    }
  }, [billing.refetch, t, toast]);

  const scheduleDowngrade = useCallback(async () => {
    setOpening(true);
    try {
      await fetcher({
        method: "POST",
        url: "/api/v1/billing/subscription/change-plan",
        data: { plan: "go" },
      });
      await billing.refetch();
    } catch {
      toast.show({ title: t("go.error"), intent: "danger" });
    } finally {
      setOpening(false);
    }
  }, [billing.refetch, t, toast]);

  const cancelDowngrade = useCallback(async () => {
    setOpening(true);
    try {
      await fetcher({
        method: "POST",
        url: "/api/v1/billing/subscription/change-plan/cancel",
      });
      await billing.refetch();
    } catch {
      toast.show({ title: t("go.error"), intent: "danger" });
    } finally {
      setOpening(false);
    }
  }, [billing.refetch, t, toast]);

  if (!hasBootstrapped) return null;

  const selectPlan = async (plan: SignupPlan, offerCode?: BillingOfferCode) => {
    try {
      const latest = await billing.refetch();
      if (latest.isError || !latest.data) throw new Error("billing-status-unavailable");
      const open = latest.data.openCheckout;
      if (open) {
        if (offerCode && offerCode === open.offerCode) {
          await openBilling(plan === "free" ? undefined : plan, offerCode);
          return;
        }
        if (!open.offerCode.includes("_pix_")) {
          toast.show({ title: t("go.continuePayment"), intent: "neutral" });
          return;
        }
        setSwitchError(null);
        setRequestedChoice({ plan, ...(offerCode ? { offerCode } : {}) });
        return;
      }
      if (plan === "free") router.back();
      else if (offerCode) await openBilling(plan, offerCode);
    } catch {
      toast.show({ title: t("go.error"), intent: "danger" });
    }
  };

  const confirmSwitch = async () => {
    if (!requestedChoice || switching) return;
    setSwitching(true);
    setSwitchError(null);
    try {
      const latest = await billing.refetch();
      if (latest.isError || !latest.data) throw new Error("billing-status-unavailable");
      const open = latest.data.openCheckout;
      if (open) {
        const result = await cancelBillingCheckout(open.id);
        if (result === "approved") {
          setRequestedChoice(null);
          await billing.refetch();
          toast.show({ title: t("go.switchCheckoutPaid"), intent: "neutral" });
          if (!currentUser?.hasCompletedOnboarding) router.replace("/onboarding");
          return;
        }
        if (result !== "canceled") throw new Error("checkout-not-canceled");
      }
      const choice = requestedChoice;
      if (choice.plan === "free") {
        void billing.refetch();
        router.back();
      } else if (choice.offerCode) await openBilling(choice.plan, choice.offerCode);
      setRequestedChoice(null);
    } catch {
      setSwitchError(t("go.switchCheckoutError"));
    } finally {
      setSwitching(false);
    }
  };

  if (isAuthenticated && state && !state.active) {
    const pendingCard = state.openCheckout;
    if (pendingCard && !pendingCard.offerCode.includes("_pix_")) {
      return (
        <YStack flex={1} backgroundColor={palette.bg} padding={24} justifyContent="center">
          <YStack width="100%" maxWidth={560} alignSelf="center" gap={18}>
            <Text fontFamily={editorialFonts.serif} fontSize={38} color={palette.ink}>
              {t("go.checkoutPendingTitle")}
            </Text>
            <Text fontFamily={editorialFonts.sans} fontSize={16} color={palette.body}>
              {t("go.checkoutProcessing")}
            </Text>
            <PrimaryAction
              label={t("go.continuePayment")}
              onPress={() => resumeCheckout(pendingCard.offerCode)}
            />
          </YStack>
        </YStack>
      );
    }
    return (
      <>
        <AuthPageFrame plan>
          {openCheckoutId ? (
            <YStack alignSelf="center" width="100%" maxWidth={560} gap={12} padding={18}>
              <Text fontFamily={editorialFonts.sans} fontWeight="700" color={palette.ink}>
                {t("go.checkoutPendingTitle")}
              </Text>
              <Text fontFamily={editorialFonts.sans} color={palette.body}>
                {t("go.checkoutPendingBody")}
              </Text>
              <PrimaryAction
                label={t("go.continuePayment")}
                onPress={() => {
                  const open = state.openCheckout;
                  if (open) resumeCheckout(open.offerCode);
                }}
              />
            </YStack>
          ) : null}
          <AuthFlowPanel variant="page" isPlanStep>
            <ChoosePlanStep
              submitting={opening || switching}
              onBack={() => router.back()}
              onContinue={selectPlan}
            />
          </AuthFlowPanel>
        </AuthPageFrame>
        <PendingCheckoutDialog
          visible={Boolean(requestedChoice)}
          busy={switching}
          error={switchError}
          onKeep={() => {
            if (!switching) setRequestedChoice(null);
          }}
          onCancelAndSwitch={() => void confirmSwitch()}
        />
      </>
    );
  }

  const endDate = state?.periodEnd ? new Date(state.periodEnd).toLocaleDateString(locale) : null;
  const offerFor = (plan: "go" | "max", months: 3 | 12) =>
    offers.find(
      (offer) =>
        offer.plan === plan && offer.paymentMethod === "pix" && offer.termMonths === months,
    );
  const cardOfferFor = (plan: "go" | "max") =>
    offers.find((offer) => offer.plan === plan && offer.paymentMethod === "card");
  const offerPrice = (plan: "go" | "max", months: 3 | 12) => {
    const offer = offerFor(plan, months);
    return offer
      ? new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" }).format(
          offer.amountCents / 100,
        )
      : "";
  };

  return (
    <YStack flex={1} backgroundColor={palette.bg}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack
          width="100%"
          maxWidth={720}
          alignSelf="center"
          gap={22}
          paddingHorizontal={24}
          paddingTop={32}
          paddingBottom={48}
        >
          <Text fontFamily={editorialFonts.serif} fontSize={38} color={palette.ink}>
            {t("go.title")}
          </Text>
          {state?.creditBalanceCents ? (
            <Text fontFamily={editorialFonts.sans} fontSize={14} color={palette.accent}>
              {t("go.creditBalance", {
                value: new Intl.NumberFormat(locale, {
                  style: "currency",
                  currency: "BRL",
                }).format(state.creditBalanceCents / 100),
              })}
            </Text>
          ) : null}
          <Text fontFamily={editorialFonts.sans} fontSize={16} lineHeight={24} color={palette.body}>
            {t("go.lead")}
          </Text>

          {openCheckoutId && Platform.OS === "web" ? (
            <PrimaryAction
              label={t("go.continuePayment")}
              onPress={() => {
                const open = state?.openCheckout;
                if (open) resumeCheckout(open.offerCode);
              }}
            />
          ) : null}

          <YStack
            borderWidth={1}
            borderColor={palette.hairline}
            borderRadius={18}
            padding={20}
            gap={8}
          >
            <Text
              fontFamily={editorialFonts.sans}
              fontWeight="700"
              fontSize={18}
              color={palette.ink}
            >
              {t("go.freeTitle")} · {t("go.freePrice")}
            </Text>
            <Text
              fontFamily={editorialFonts.sans}
              fontSize={14}
              lineHeight={21}
              color={palette.body}
            >
              {t("go.freeBody")}
            </Text>
            {state?.plan === "free" && state.enabled ? (
              <Text fontFamily={editorialFonts.sans} fontSize={13} color={palette.muted}>
                {t("go.freeTranslationsUsed", {
                  used: state.freeTranslationsUsed,
                  limit: state.freeTranslationsLimit,
                })}
              </Text>
            ) : null}
          </YStack>

          <YStack
            borderWidth={1}
            borderColor={palette.accent}
            borderRadius={18}
            padding={20}
            gap={12}
          >
            <Text
              fontFamily={editorialFonts.sans}
              fontWeight="700"
              fontSize={18}
              color={palette.ink}
            >
              {t("go.paidTitle")} · {t("go.brlPrice")}
            </Text>
            <Text
              fontFamily={editorialFonts.sans}
              fontSize={14}
              lineHeight={21}
              color={palette.body}
            >
              {t("go.paidBody")}
            </Text>
            {state?.active && state.plan === "go" ? (
              <YStack gap={10}>
                <Text fontFamily={editorialFonts.sans} fontSize={14} color={palette.ink}>
                  {t("go.used", { used: state.used, limit: state.limit })}
                </Text>
                {endDate ? (
                  <Text fontFamily={editorialFonts.sans} fontSize={13} color={palette.muted}>
                    {t("go.renews", { date: endDate })}
                  </Text>
                ) : null}
                {state.cancelAtPeriodEnd ? (
                  <Text fontFamily={editorialFonts.sans} fontSize={13} color={palette.muted}>
                    {t("go.ending")}
                  </Text>
                ) : null}
                <Text fontFamily={editorialFonts.sans} fontWeight="700" color={palette.accent}>
                  {t("go.currentPlan")}
                </Text>
                {offerFor("go", 3) ? (
                  <PrimaryAction
                    label={t("go.payPixQuarter", { price: offerPrice("go", 3) })}
                    onPress={() => void openBilling("go", offerFor("go", 3)?.code)}
                    loading={opening}
                  />
                ) : null}
                {offerFor("go", 12) ? (
                  <PrimaryAction
                    label={t("go.payPixYear", { price: offerPrice("go", 12) })}
                    onPress={() => void openBilling("go", offerFor("go", 12)?.code)}
                    loading={opening}
                  />
                ) : null}
              </YStack>
            ) : state?.active ? (
              <YStack gap={10}>
                {state.renews && !state.pendingPlan ? (
                  <PrimaryAction
                    label={t("go.scheduleDowngrade")}
                    onPress={() => void scheduleDowngrade()}
                    loading={opening}
                  />
                ) : null}
                <Text fontFamily={editorialFonts.sans} fontSize={13} color={palette.muted}>
                  {t("go.downgradeAtPeriodEnd")}
                </Text>
              </YStack>
            ) : !isAuthenticated ? (
              <PrimaryAction label={t("go.signIn")} onPress={() => router.push(AUTH_ROUTE)} />
            ) : billing.isLoading ? (
              <Text fontFamily={editorialFonts.sans} fontSize={13} color={palette.muted}>
                {t("go.checking")}
              </Text>
            ) : !state?.enabled ? (
              <Text fontFamily={editorialFonts.sans} fontSize={13} color={palette.muted}>
                {t("go.unavailable")}
              </Text>
            ) : (
              <YStack gap={10}>
                {checkout === "success" ? (
                  <Text fontFamily={editorialFonts.sans} fontSize={13} color={palette.muted}>
                    {t("go.pending")}
                  </Text>
                ) : null}
                {cardOfferFor("go") ? (
                  <PrimaryAction
                    label={t("go.subscribeMonthly")}
                    onPress={() => void openBilling("go")}
                    loading={opening}
                  />
                ) : null}
                {offerFor("go", 3) ? (
                  <PrimaryAction
                    label={t("go.payPixQuarter", { price: offerPrice("go", 3) })}
                    onPress={() => void openBilling("go", offerFor("go", 3)?.code)}
                    loading={opening}
                  />
                ) : null}
                {offerFor("go", 12) ? (
                  <PrimaryAction
                    label={t("go.payPixYear", { price: offerPrice("go", 12) })}
                    onPress={() => void openBilling("go", offerFor("go", 12)?.code)}
                    loading={opening}
                  />
                ) : null}
              </YStack>
            )}
          </YStack>

          <YStack
            borderWidth={1}
            borderColor={palette.accent}
            borderRadius={18}
            padding={20}
            gap={12}
          >
            <Text
              fontFamily={editorialFonts.sans}
              fontWeight="700"
              fontSize={18}
              color={palette.ink}
            >
              {t("go.maxTitle")} · {t("go.maxBrlPrice")}
            </Text>
            <Text
              fontFamily={editorialFonts.sans}
              fontSize={14}
              lineHeight={21}
              color={palette.body}
            >
              {t("go.maxBody")}
            </Text>
            {state?.active && state.plan === "max" ? (
              <YStack gap={10}>
                <Text fontFamily={editorialFonts.sans} fontSize={14} color={palette.ink}>
                  {t("go.used", { used: state.used, limit: state.limit })}
                </Text>
                {endDate ? (
                  <Text fontFamily={editorialFonts.sans} fontSize={13} color={palette.muted}>
                    {t("go.renews", { date: endDate })}
                  </Text>
                ) : null}
                {state.cancelAtPeriodEnd ? (
                  <Text fontFamily={editorialFonts.sans} fontSize={13} color={palette.muted}>
                    {t("go.ending")}
                  </Text>
                ) : null}
                <Text fontFamily={editorialFonts.sans} fontWeight="700" color={palette.accent}>
                  {t("go.currentPlan")}
                </Text>
                {offerFor("max", 3) ? (
                  <PrimaryAction
                    label={t("go.payPixQuarter", { price: offerPrice("max", 3) })}
                    onPress={() => void openBilling("max", offerFor("max", 3)?.code)}
                    loading={opening}
                  />
                ) : null}
                {offerFor("max", 12) ? (
                  <PrimaryAction
                    label={t("go.payPixYear", { price: offerPrice("max", 12) })}
                    onPress={() => void openBilling("max", offerFor("max", 12)?.code)}
                    loading={opening}
                  />
                ) : null}
              </YStack>
            ) : state?.active ? (
              <YStack gap={10}>
                {state.renews && cardOfferFor("max") ? (
                  <PrimaryAction
                    label={t("go.changePlan")}
                    onPress={() => void openBilling("max")}
                    loading={opening}
                  />
                ) : null}
                {offerFor("max", 3) ? (
                  <PrimaryAction
                    label={t("go.payPixQuarter", { price: offerPrice("max", 3) })}
                    onPress={() => void openBilling("max", offerFor("max", 3)?.code)}
                    loading={opening}
                  />
                ) : null}
                {offerFor("max", 12) ? (
                  <PrimaryAction
                    label={t("go.payPixYear", { price: offerPrice("max", 12) })}
                    onPress={() => void openBilling("max", offerFor("max", 12)?.code)}
                    loading={opening}
                  />
                ) : null}
              </YStack>
            ) : !isAuthenticated ? (
              <PrimaryAction label={t("go.signIn")} onPress={() => router.push(AUTH_ROUTE)} />
            ) : billing.isLoading ? (
              <Text fontFamily={editorialFonts.sans} fontSize={13} color={palette.muted}>
                {t("go.checking")}
              </Text>
            ) : !state?.enabled ? (
              <Text fontFamily={editorialFonts.sans} fontSize={13} color={palette.muted}>
                {t("go.unavailable")}
              </Text>
            ) : (
              <YStack gap={10}>
                {cardOfferFor("max") ? (
                  <PrimaryAction
                    label={t("go.subscribeMonthly")}
                    onPress={() => void openBilling("max")}
                    loading={opening}
                  />
                ) : null}
                {offerFor("max", 3) ? (
                  <PrimaryAction
                    label={t("go.payPixQuarter", { price: offerPrice("max", 3) })}
                    onPress={() => void openBilling("max", offerFor("max", 3)?.code)}
                    loading={opening}
                  />
                ) : null}
                {offerFor("max", 12) ? (
                  <PrimaryAction
                    label={t("go.payPixYear", { price: offerPrice("max", 12) })}
                    onPress={() => void openBilling("max", offerFor("max", 12)?.code)}
                    loading={opening}
                  />
                ) : null}
                {offerFor("max", 12)?.founderRemaining != null ? (
                  <Text fontFamily={editorialFonts.sans} fontSize={12} color={palette.muted}>
                    {t("go.founderRemaining", {
                      count: offerFor("max", 12)?.founderRemaining ?? 0,
                    })}
                  </Text>
                ) : null}
              </YStack>
            )}
          </YStack>

          {state?.pendingPlan ? (
            <YStack gap={8}>
              <Text fontFamily={editorialFonts.sans} fontSize={14} color={palette.ink}>
                {t("go.pendingPlan", { plan: state.pendingPlan === "max" ? "Max" : "Go" })}
              </Text>
              <PrimaryAction
                label={t("go.cancelPlanChange")}
                onPress={() => void cancelDowngrade()}
                loading={opening}
              />
            </YStack>
          ) : null}

          {state?.active && state.paymentMode === "card_recurring" && state.renews ? (
            <YStack gap={10}>
              <PrimaryAction
                label={t("go.updatePaymentMethod")}
                onPress={() => void updatePaymentMethod()}
                loading={opening}
              />
              {!state.cancelAtPeriodEnd ? (
                <PrimaryAction
                  label={t("go.cancelSubscription")}
                  onPress={confirmCancellation}
                  loading={opening}
                />
              ) : null}
            </YStack>
          ) : null}

          {payments.length > 0 ? (
            <YStack gap={8}>
              <Text fontFamily={editorialFonts.sans} fontWeight="700" color={palette.ink}>
                {t("go.paymentHistory")}
              </Text>
              {payments.map((payment) => (
                <Text
                  key={payment.id}
                  fontFamily={editorialFonts.sans}
                  fontSize={13}
                  color={palette.body}
                >
                  {payment.paidAt
                    ? new Date(payment.paidAt).toLocaleDateString(locale)
                    : t("go.paymentPending")}{" "}
                  ·{" "}
                  {new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency: payment.currency,
                  }).format(payment.amountCents / 100)}{" "}
                  ·{" "}
                  {t(
                    `go.paymentStatus${payment.status
                      .split("_")
                      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                      .join("")}`,
                  )}
                </Text>
              ))}
            </YStack>
          ) : null}

          {checkout === "success" && isAuthenticated ? (
            <PrimaryAction label={t("go.refresh")} onPress={() => void billing.refetch()} />
          ) : null}
          <Text
            fontFamily={editorialFonts.sans}
            fontSize={12}
            lineHeight={18}
            color={palette.muted}
          >
            {t("go.note")}
          </Text>
        </YStack>
      </ScrollView>
      <PendingCheckoutDialog
        visible={Boolean(requestedChoice)}
        busy={switching}
        error={switchError}
        onKeep={() => {
          if (!switching) setRequestedChoice(null);
        }}
        onCancelAndSwitch={() => void confirmSwitch()}
      />
    </YStack>
  );
}
