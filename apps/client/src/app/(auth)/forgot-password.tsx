/**
 * Forgot-password screen (D99) — "Editorial Calm" DS.
 *
 * Single email input + submit; on success shows a generic banner
 * regardless of whether the email exists (avoids account enumeration —
 * the backend already returns the same response either way).
 */

import { postV1AuthForgotPassword } from "@patch-careers/api-client";
import { isValidEmail } from "@patch-careers/auth";
import { AuthShell, Banner, IntroBlock, PrimaryAction } from "@patch-careers/ui/editorial";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import { BackToSignInLink } from "../../components/auth/BackToSignInLink";
import { AuthEmailField } from "../../components/auth/fields";
import { useAuthScreen } from "../../components/auth/hooks/useAuthScreen";
import { useSubmit } from "../../components/auth/hooks/useSubmit";

export default function ForgotPasswordScreen(): ReactElement {
  const { t, router } = useAuthScreen();
  const { submitting, run } = useSubmit();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);

  async function handleSubmit() {
    if (!isValidEmail(email)) {
      setEmailError(t("auth.invalidEmail"));
      return;
    }
    setEmailError(undefined);
    await run(async () => {
      try {
        await postV1AuthForgotPassword({ email: email.trim() });
      } catch {
        // Per-spec we treat any backend response (incl. network errors)
        // the same way to avoid leaking whether the email exists.
      }
      setSent(true);
    });
  }

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
          <AuthEmailField
            value={email}
            onChangeText={(next) => {
              setEmail(next);
              if (emailError) setEmailError(undefined);
            }}
            error={emailError}
            testID="forgot.email"
            onSubmitEditing={handleSubmit}
          />
          <View style={{ marginTop: 8 }}>
            <PrimaryAction
              label={t("common.submit")}
              loading={submitting}
              onPress={handleSubmit}
              testID="forgot.submit"
            />
          </View>
          <BackToSignInLink testID="forgot.backLink" />
        </View>
      )}
    </AuthShell>
  );
}
