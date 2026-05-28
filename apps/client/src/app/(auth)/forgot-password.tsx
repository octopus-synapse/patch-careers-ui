/**
 * Forgot-password screen (D99): single email input + submit, success
 * state shows a generic banner regardless of whether the email exists
 * (avoids account enumeration — backend already returns the same
 * response in both cases).
 */

import { postV1AuthForgotPassword } from "@patch-careers/api-client";
import { isValidEmail } from "@patch-careers/auth";
import { palette } from "@patch-careers/tokens";
import { Button, FormField, Text, YStack } from "@patch-careers/ui";
import { Link, useRouter } from "expo-router";
import { type ReactElement, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AuthScreenLayout } from "../../components/AuthScreenLayout";
import { useTranslator } from "../../providers/I18nProvider";

export default function ForgotPasswordScreen(): ReactElement {
  const t = useTranslator();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);

  async function handleSubmit() {
    if (!isValidEmail(email)) {
      setEmailError(t("auth.invalidEmail"));
      return;
    }
    setEmailError(undefined);
    setSubmitting(true);
    try {
      await postV1AuthForgotPassword({ email: email.trim() });
    } catch {
      // Per-spec we treat any backend response the same way to avoid
      // leaking whether the email exists — including network errors,
      // which the user can retry from the success screen.
    }
    setSent(true);
    setSubmitting(false);
  }

  return (
    <AuthScreenLayout
      title={t("auth.forgotTitle")}
      subtitle={sent ? undefined : t("auth.forgotIntro")}
    >
      {sent ? (
        <YStack gap={16}>
          <View style={styles.successBanner}>
            <Text preset="body" color={palette.green[700]}>
              {t("auth.forgotSuccess")}
            </Text>
          </View>
          <Button
            intent="accent"
            size="lg"
            onPress={() => router.replace("/(auth)/sign-in")}
            testID="forgot.backToSignIn"
          >
            {t("auth.signIn")}
          </Button>
        </YStack>
      ) : (
        <YStack gap={12}>
          <FormField
            label={t("auth.email")}
            placeholder={t("auth.emailPlaceholder")}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="username"
            value={email}
            onChangeText={(next: string) => {
              setEmail(next);
              if (emailError) setEmailError(undefined);
            }}
            {...(emailError ? { error: emailError } : {})}
            testID="forgot.email"
          />
          <Button
            intent="accent"
            size="lg"
            loading={submitting}
            onPress={handleSubmit}
            testID="forgot.submit"
          >
            {t("common.submit")}
          </Button>
          <Link
            href="/(auth)/sign-in"
            accessibilityRole="link"
            style={styles.backLink}
            testID="forgot.backLink"
          >
            <Text preset="caption" color={palette.blue[600]}>
              {t("common.back")}
            </Text>
          </Link>
        </YStack>
      )}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  successBanner: {
    backgroundColor: palette.green[50],
    borderColor: palette.green[200],
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  backLink: {
    alignSelf: "center",
    marginTop: 8,
  },
});
