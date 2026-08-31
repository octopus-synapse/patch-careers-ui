/**
 * Reset-password screen — root `/reset-password` path (universal links of
 * the form `https://patchcareers.com/reset-password?token=X` land here).
 *
 * D100: token from the deep link → 2 password inputs + strength meter →
 * POST /v1/auth/reset-password → toast + bounce to /sign-in. "Editorial
 * Calm" DS. Form: React Hook Form (ADR-0005) — the only client check is the
 * confirm-match (the backend validates strength), kept in the resolver.
 */

import { postV1AuthResetPassword } from "@patch-careers/api-client";
import { YStack } from "@patch-careers/ui";
import {
  AuthShell,
  Banner,
  IntroBlock,
  PasswordStrengthMeter,
  PrimaryAction,
} from "@patch-careers/ui/editorial";
import { useLocalSearchParams } from "expo-router";
import type { ReactElement } from "react";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { useSubmit } from "@/components/auth/hooks/use-submit";
import { passwordMeterLabels } from "@/components/auth/password-meter-labels";
import { FormPasswordField, useFieldErrorsForm } from "@/forms";
import { messageOf, validatePassword } from "@/lib/validation";
import { useLocalizedHref } from "@/navigation/locale-prefix";

type ResetForm = { newPassword: string; confirmPassword: string };

export default function ResetPasswordScreen(): ReactElement {
  const { t, router, toast } = useAuthScreen();
  const localized = useLocalizedHref();
  const { submitting, run } = useSubmit();
  const params = useLocalSearchParams<{ token?: string }>();

  const tokenMissing = !params.token || params.token.length === 0;

  // New password is held to the full policy (the backend applies
  // PasswordSchema on reset); confirm only has to match.
  const form = useFieldErrorsForm<ResetForm>(
    (v) => {
      const errors: Partial<Record<keyof ResetForm, string>> = {};
      const pw = messageOf(validatePassword(v.newPassword), t);
      if (pw) errors.newPassword = pw;
      if (v.confirmPassword && v.newPassword !== v.confirmPassword) {
        errors.confirmPassword = t("validation.passwordMismatch");
      }
      return Object.keys(errors).length > 0 ? errors : null;
    },
    { defaultValues: { newPassword: "", confirmPassword: "" } },
  );
  const newPassword = form.watch("newPassword");

  const onSubmit = form.handleSubmit(async ({ newPassword: pw }) => {
    if (tokenMissing) return;
    await run(async () => {
      try {
        await postV1AuthResetPassword({ token: params.token as string, newPassword: pw });
        toast.show({ title: t("auth.resetSuccess"), intent: "success" });
        router.replace(localized("/(auth)/sign-in"));
      } catch {
        toast.show({ title: t("auth.resetInvalidToken"), intent: "danger" });
      }
    });
  });

  if (tokenMissing) {
    return (
      <AuthShell>
        <IntroBlock emphasis={t("auth.resetTitle")} subtitle={t("auth.resetInvalidToken")} />
        <YStack gap={24}>
          <Banner intent="danger" testID="reset.invalidToken">
            {t("auth.resetInvalidToken")}
          </Banner>
          <PrimaryAction
            label={t("auth.forgotPassword")}
            onPress={() => router.replace(localized("/(auth)/forgot-password"))}
            testID="reset.requestNew"
          />
        </YStack>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <IntroBlock emphasis={t("auth.resetTitle")} subtitle={t("auth.resetNewPassword")} />
      <YStack gap={24}>
        <FormPasswordField
          control={form.control}
          name="newPassword"
          label={t("auth.resetNewPassword")}
          testID="reset.password"
          isNew
          returnKeyType="next"
        >
          <PasswordStrengthMeter password={newPassword} {...passwordMeterLabels(t)} />
        </FormPasswordField>

        <FormPasswordField
          control={form.control}
          name="confirmPassword"
          label={t("auth.resetConfirmPassword")}
          testID="reset.confirm"
          isNew
          returnKeyType="go"
          onSubmitEditing={onSubmit}
        />

        <YStack marginTop={8}>
          <PrimaryAction
            label={t("common.submit")}
            loading={submitting}
            onPress={onSubmit}
            testID="reset.submit"
          />
        </YStack>
      </YStack>
    </AuthShell>
  );
}
