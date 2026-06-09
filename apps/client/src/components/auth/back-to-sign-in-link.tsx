/**
 * "Back to sign-in" editorial link — the `<Link>/<Text caption>` pair
 * forgot-password, verify-email and 2fa-verify each hand-rolled.
 */

import { InlineLink } from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import type { ReactElement } from "react";
import { useTranslator } from "@/providers/i18n-provider";

export function BackToSignInLink({ testID }: { testID?: string }): ReactElement {
  const t = useTranslator();
  const router = useRouter();
  return (
    <InlineLink
      label={t("common.back")}
      onPress={() => router.replace("/(auth)/sign-in")}
      align="left"
      {...(testID ? { testID } : {})}
    />
  );
}
