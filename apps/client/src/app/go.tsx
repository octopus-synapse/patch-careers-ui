import { fetcher } from "@patch-careers/api-client";
import { Text, useToast, YStack } from "@patch-careers/ui";
import { editorialFonts, PrimaryAction, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { type ReactElement, useState } from "react";
import { Linking, ScrollView } from "react-native";
import { AUTH_SIGN_IN_ROUTE } from "@/navigation/auth-redirect";
import { useAuthBootstrap, useAuthState } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

type BillingStatus = {
  enabled: boolean;
  status: string;
  active: boolean;
  used: number;
  limit: number;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

const billingKey = ["patch-go-billing"] as const;

export default function PatchGoScreen(): ReactElement | null {
  const { t, locale } = useI18n();
  const palette = useEditorialPalette();
  const router = useRouter();
  const toast = useToast();
  const { checkout } = useLocalSearchParams<{ checkout?: string }>();
  const { hasBootstrapped } = useAuthBootstrap();
  const { isAuthenticated } = useAuthState();
  const [opening, setOpening] = useState(false);
  const billing = useQuery({
    queryKey: billingKey,
    queryFn: async () =>
      (await fetcher<BillingStatus>({ method: "GET", url: "/api/v1/billing/patch-go" })).data,
    enabled: hasBootstrapped && isAuthenticated,
  });

  if (!hasBootstrapped) return null;

  const openBilling = async (market?: "BRL" | "USD"): Promise<void> => {
    if (!isAuthenticated) {
      router.push(AUTH_SIGN_IN_ROUTE);
      return;
    }
    setOpening(true);
    try {
      const path = market ? "checkout" : "portal";
      const response = await fetcher<{ url: string }, unknown, { market?: "BRL" | "USD" }>({
        method: "POST",
        url: `/api/v1/billing/patch-go/${path}`,
        ...(market ? { data: { market } } : {}),
      });
      await Linking.openURL(response.data.url);
    } catch {
      toast.show({ title: t("go.error"), intent: "danger" });
    } finally {
      setOpening(false);
    }
  };

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
              {t("go.freeTitle")}
            </Text>
            <Text
              fontFamily={editorialFonts.sans}
              fontSize={14}
              lineHeight={21}
              color={palette.body}
            >
              {t("go.freeBody")}
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
              {t("go.paidTitle")}
            </Text>
            <Text
              fontFamily={editorialFonts.sans}
              fontSize={14}
              lineHeight={21}
              color={palette.body}
            >
              {t("go.paidBody")}
            </Text>
            {state?.active ? (
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
            ) : !isAuthenticated ? (
              <PrimaryAction
                label={t("go.signIn")}
                onPress={() => router.push(AUTH_SIGN_IN_ROUTE)}
              />
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
                <Text fontFamily={editorialFonts.sans} fontSize={13} color={palette.muted}>
                  {t("go.chooseMarket")}
                </Text>
                <PrimaryAction
                  label={`${t("go.subscribe")} · ${t("go.brlPrice")}`}
                  onPress={() => void openBilling("BRL")}
                  loading={opening}
                />
                <PrimaryAction
                  label={`${t("go.subscribe")} · ${t("go.usdPrice")}`}
                  onPress={() => void openBilling("USD")}
                  loading={opening}
                />
              </YStack>
            )}
          </YStack>

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
