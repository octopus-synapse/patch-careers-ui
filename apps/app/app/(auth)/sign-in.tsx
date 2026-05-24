/**
 * Sign-in screen — D91 layout (centered card + brand on top), D92 form
 * order (email → password → submit → forgot → OAuth), D93 OAuth pills.
 *
 * Flow:
 *   1. Call `login()` from `@patch-careers/auth`.
 *   2. If backend gates with `twoFactorRequired`, route to /2fa-verify
 *      with the userId so the next screen can call `verifyTwoFactor()`.
 *   3. If backend handed back a `sessionExchangeId` (cookie-mode), try
 *      to flip it into a Bearer pair via `exchangeSessionForTokens()`.
 *   4. Otherwise tokens are already persisted — bootstrap to hydrate
 *      the user object and the index/layout redirect drops us into the
 *      tabbed shell.
 */

import {
  bootstrap,
  exchangeSessionForTokens,
  isValidEmail,
  type LoginResult,
  login,
  signInWithProviderNative,
} from "@patch-careers/auth";
import { palette } from "@patch-careers/tokens";
import { Button, FormField, Icon, Text, useToast, XStack, YStack } from "@patch-careers/ui";
// Icon is used for the password eye toggle below.
import Constants from "expo-constants";
import { Link, useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AuthScreenLayout } from "../../components/AuthScreenLayout";
import { useTranslator } from "../../providers/I18nProvider";

function resolveApiBaseURL(): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as { apiBaseURL?: string };
  return (
    extra.apiBaseURL ??
    (process.env["EXPO_PUBLIC_API_BASE_URL"] as string | undefined) ??
    "https://api.patchcareers.com"
  );
}

export default function SignInScreen(): ReactElement {
  const t = useTranslator();
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);

  async function handleSubmit() {
    if (!isValidEmail(email)) {
      setEmailError(t("auth.invalidEmail"));
      return;
    }
    setEmailError(undefined);
    setSubmitting(true);
    try {
      const result: LoginResult = await login(email.trim(), password);
      if (result.twoFactorRequired) {
        router.replace({ pathname: "/(auth)/2fa-verify", params: { userId: result.userId } });
        return;
      }
      if (result.sessionExchangeId) {
        await exchangeSessionForTokens(result.sessionExchangeId);
      }
      await bootstrap().catch(() => undefined);
      router.replace("/(tabs)/jobs");
    } catch {
      toast.show({ title: t("auth.loginFailed"), intent: "danger" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOAuth(provider: "github" | "linkedin") {
    try {
      const apiBaseURL = resolveApiBaseURL();
      const result = await signInWithProviderNative(provider, {
        apiBaseURL,
        redirectUri: "patchcareers://auth/callback",
      });
      if (!result.ok) {
        toast.show({ title: t("auth.oauthFailed"), intent: "danger" });
      }
      // Success path is handled by the deep-link subscription in AuthProvider —
      // completeOAuth() will persist tokens + bootstrap() + the index gate
      // will navigate to /(tabs)/jobs.
    } catch {
      toast.show({ title: t("auth.oauthFailed"), intent: "danger" });
    }
  }

  return (
    <AuthScreenLayout title={t("auth.signInTitle")}>
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
          testID="auth.email"
        />
        <YStack gap={4}>
          <XStack alignItems="flex-end">
            <YStack flex={1}>
              <FormField
                label={t("auth.password")}
                placeholder={t("auth.passwordPlaceholder")}
                secureTextEntry={!showPassword}
                autoComplete="password"
                textContentType="password"
                value={password}
                onChangeText={setPassword}
                testID="auth.password"
              />
            </YStack>
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              style={styles.eyeButton}
              testID="auth.passwordToggle"
            >
              <Icon as={showPassword ? EyeOff : Eye} size="md" />
            </Pressable>
          </XStack>
          <Link
            href="/(auth)/forgot-password"
            accessibilityRole="link"
            style={styles.forgotLink}
            testID="auth.forgotLink"
          >
            <Text preset="caption" color={palette.blue[600]}>
              {t("auth.forgotPassword")}
            </Text>
          </Link>
        </YStack>

        <Button
          intent="accent"
          size="lg"
          loading={submitting}
          onPress={handleSubmit}
          testID="auth.submit"
        >
          {t("auth.signIn")}
        </Button>

        <XStack alignItems="center" gap={12} marginVertical={8}>
          <View style={styles.divider} />
          <Text preset="caption" color="$gray9">
            {t("auth.orDivider")}
          </Text>
          <View style={styles.divider} />
        </XStack>

        <Button
          variant="outlined"
          intent="neutral"
          size="lg"
          onPress={() => handleOAuth("github")}
          testID="auth.github"
        >
          {t("auth.continueWith", { provider: "GitHub" })}
        </Button>
        <Button
          variant="outlined"
          intent="neutral"
          size="lg"
          onPress={() => handleOAuth("linkedin")}
          testID="auth.linkedin"
        >
          {t("auth.continueWith", { provider: "LinkedIn" })}
        </Button>

        <XStack justifyContent="center" gap={4} marginTop={8}>
          <Text preset="caption" color="$gray10">
            {t("auth.noAccount")}
          </Text>
          <Link href="/(auth)/sign-up" accessibilityRole="link" testID="auth.signUpLink">
            <Text preset="caption" color={palette.blue[600]}>
              {t("auth.createOne")}
            </Text>
          </Link>
        </XStack>
      </YStack>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  eyeButton: {
    padding: 12,
    marginLeft: 4,
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  forgotLink: {
    alignSelf: "flex-end",
    marginTop: 4,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: palette.gray[200],
  },
});
