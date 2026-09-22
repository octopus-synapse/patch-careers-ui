import { fetcher } from "@patch-careers/api-client";
import { Text, useToast, YStack } from "@patch-careers/ui";
import { editorialFonts, PrimaryAction, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useLocalSearchParams } from "expo-router";
import { type ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { Linking, Platform, ScrollView, TextInput } from "react-native";
import { usePatchPlan } from "@/features/billing/use-patch-plan";
import { AUTH_ROUTE } from "@/navigation/auth-redirect";
import { useAppRouter } from "@/navigation/use-app-router";
import { useAuthBootstrap, useAuthState } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

export default function PatchGoScreen(): ReactElement | null {
  const { t, locale } = useI18n();
  const palette = useEditorialPalette();
  const router = useAppRouter();
  const toast = useToast();
  const {
    checkout,
    startCheckout,
    billingCountry: requestedCountry,
  } = useLocalSearchParams<{
    checkout?: string;
    startCheckout?: string;
    billingCountry?: string;
  }>();
  const { hasBootstrapped } = useAuthBootstrap();
  const { isAuthenticated, currentUser } = useAuthState();
  const [opening, setOpening] = useState(false);
  const [billingCountry, setBillingCountry] = useState(
    requestedCountry ?? (locale === "pt-BR" ? "BR" : "US"),
  );
  const autoCheckoutStarted = useRef(false);
  const country = billingCountry.trim().toUpperCase();
  const billing = usePatchPlan(checkout === "success");

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
    async (plan?: "go" | "max"): Promise<void> => {
      if (!isAuthenticated) {
        router.push(AUTH_ROUTE);
        return;
      }
      if (plan && !/^[A-Z]{2}$/.test(country)) {
        toast.show({ title: t("go.invalidCountry"), intent: "danger" });
        return;
      }
      setOpening(true);
      try {
        const path = plan ? "checkout" : "portal";
        const response = await fetcher<{ url: string }>({
          method: "POST",
          url: `/api/v1/billing/patch-go/${path}`,
          ...(plan ? { data: { plan, billingCountry: country } } : {}),
        });
        if (Platform.OS === "web") {
          window.location.assign(response.data.url);
        } else {
          await Linking.openURL(response.data.url);
        }
      } catch {
        toast.show({ title: t("go.error"), intent: "danger" });
      } finally {
        setOpening(false);
      }
    },
    [country, isAuthenticated, router, t, toast],
  );

  useEffect(() => {
    if (
      autoCheckoutStarted.current ||
      !hasBootstrapped ||
      !isAuthenticated ||
      !billing.data?.enabled ||
      billing.data.active ||
      (startCheckout !== "go" && startCheckout !== "max")
    )
      return;
    autoCheckoutStarted.current = true;
    void openBilling(startCheckout);
  }, [
    hasBootstrapped,
    isAuthenticated,
    billing.data?.enabled,
    billing.data?.active,
    startCheckout,
    openBilling,
  ]);

  if (!hasBootstrapped) return null;

  const state = billing.data;
  const endDate = state?.periodEnd ? new Date(state.periodEnd).toLocaleDateString(locale) : null;

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
          <Text fontFamily={editorialFonts.sans} fontSize={16} lineHeight={24} color={palette.body}>
            {t("go.lead")}
          </Text>

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

          <YStack gap={8}>
            <Text fontFamily={editorialFonts.sans} fontSize={14} color={palette.body}>
              {t("go.billingCountry")}
            </Text>
            <TextInput
              value={billingCountry}
              onChangeText={setBillingCountry}
              autoCapitalize="characters"
              maxLength={2}
              accessibilityLabel={t("go.billingCountry")}
              placeholder="BR / US / GB"
              style={{
                borderWidth: 1,
                borderColor: palette.hairline,
                borderRadius: 12,
                padding: 12,
                color: palette.ink,
              }}
            />
            <Text fontFamily={editorialFonts.sans} fontSize={12} color={palette.muted}>
              {t("go.countryNote")}
            </Text>
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
              {t("go.paidTitle")} · {t(country === "BR" ? "go.brlPrice" : "go.usdPrice")}
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
                <PrimaryAction
                  label={t("go.manage")}
                  onPress={() => void openBilling()}
                  loading={opening}
                />
              </YStack>
            ) : state?.active ? (
              <PrimaryAction
                label={t("go.changePlan")}
                onPress={() => void openBilling()}
                loading={opening}
              />
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
                <PrimaryAction
                  label={t("go.subscribe")}
                  onPress={() => void openBilling("go")}
                  loading={opening}
                />
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
              {t("go.maxTitle")} · {t(country === "BR" ? "go.maxBrlPrice" : "go.maxUsdPrice")}
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
                <PrimaryAction
                  label={t("go.manage")}
                  onPress={() => void openBilling()}
                  loading={opening}
                />
              </YStack>
            ) : state?.active ? (
              <PrimaryAction
                label={t("go.changePlan")}
                onPress={() => void openBilling()}
                loading={opening}
              />
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
              <PrimaryAction
                label={t("go.subscribe")}
                onPress={() => void openBilling("max")}
                loading={opening}
              />
            )}
          </YStack>

          {state?.status === "country_mismatch" ? (
            <Text fontFamily={editorialFonts.sans} fontSize={14} color={palette.ink}>
              {t("go.countryMismatch")}
            </Text>
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
    </YStack>
  );
}
