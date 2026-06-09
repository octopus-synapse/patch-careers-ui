/**
 * Forgot-password screen (D99) — "Editorial Calm" DS.
 *
 * Single email input + submit; on success shows a generic banner
 * regardless of whether the email exists (avoids account enumeration —
 * the backend already returns the same response either way).
 *
 * Reference RHF + Zod form (ADR-0005): schema-driven validation via
 * useZodForm, field bound through the FormEmailField Controller adapter.
 */

import { postV1AuthForgotPassword } from "@patch-careers/api-client";
import { isValidEmail } from "@patch-careers/auth";
import { AuthShell, Banner, IntroBlock, PrimaryAction } from "@patch-careers/ui/editorial";
import { type ReactElement, useMemo, useState } from "react";
import { View } from "react-native";
import { z } from "zod";
import { BackToSignInLink } from "@/components/auth/back-to-sign-in-link";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { useSubmit } from "@/components/auth/hooks/use-submit";
import { FormEmailField, useZodForm } from "@/forms";

export default function ForgotPasswordScreen(): ReactElement {
  const { t, router } = useAuthScreen();
  const { submitting, run } = useSubmit();
  const [sent, setSent] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().refine((v) => isValidEmail(v.trim()), t("auth.invalidEmail")),
      }),
    [t],
  );
  const form = useZodForm(schema, { defaultValues: { email: "" } });

  const onSubmit = form.handleSubmit(async ({ email }) => {
    await run(async () => {
      try {
        await postV1AuthForgotPassword({ email: email.trim() });
      } catch {
        // Per-spec we treat any backend response (incl. network errors) the same
        // way to avoid leaking whether the email exists.
      }
      setSent(true);
    });
  });

  return (
    <AuthShell>
      <IntroBlock
        emphasis={t("auth.forgotTitle")}
        subtitle={sent ? t("auth.forgotSuccess") : t("auth.forgotIntro")}
      />

      {sent ? (
        <View style={{ gap: 24 }}>
          <Banner intent="success" testID="forgot.success">
            {t("auth.forgotSuccess")}
          </Banner>
          <PrimaryAction
            label={t("auth.signIn")}
            onPress={() => router.replace("/(auth)/sign-in")}
            testID="forgot.backToSignIn"
          />
        </View>
      ) : (
        <View style={{ gap: 24 }}>
          <FormEmailField
            control={form.control}
            name="email"
            testID="forgot.email"
            onSubmitEditing={onSubmit}
          />
          <View style={{ marginTop: 8 }}>
            <PrimaryAction
              label={t("common.submit")}
              loading={submitting}
              onPress={onSubmit}
              testID="forgot.submit"
            />
          </View>
          <BackToSignInLink testID="forgot.backLink" />
        </View>
      )}
    </AuthShell>
  );
}
