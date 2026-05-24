/**
 * Single-page sign-up (D95): email + password + consent checkbox. The
 * checkbox links to the in-app WebView (D98) so users can read Terms /
 * Privacy without leaving the app.
 *
 * On success we navigate to /verify-email — the backend has just sent
 * an OTP to the user's inbox. We pass the email along (mascarado in
 * the next screen header) so verify-email can render context.
 */

import { signup } from "@patch-careers/api-client";
import { isValidEmail } from "@patch-careers/auth";
import { palette } from "@patch-careers/tokens";
import {
  Button,
  FormField,
  Icon,
  PasswordStrengthBar,
  Text,
  useToast,
  XStack,
  YStack,
} from "@patch-careers/ui";
import { Link, useRouter } from "expo-router";
import { Check, Eye, EyeOff } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { AuthScreenLayout } from "../../components/AuthScreenLayout";
import { useTranslator } from "../../providers/I18nProvider";

// Versions sent with the consent payload. Backend rejects payloads that
// don't match the currently-published version, so these must track the
// live policy. For now we hardcode v1 — the live version comes from a
// runtime config endpoint in a later PR.
const TOS_VERSION = "1.0";
const PRIVACY_VERSION = "1.0";

export default function SignUpScreen(): ReactElement {
  const t = useTranslator();
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [consentError, setConsentError] = useState<string | undefined>(undefined);

  async function handleSubmit() {
    let hasError = false;
    if (!isValidEmail(email)) {
      setEmailError(t("auth.invalidEmail"));
      hasError = true;
    }
    if (!consent) {
      setConsentError(t("auth.consentRequired"));
      hasError = true;
    }
    if (hasError) return;
    setEmailError(undefined);
    setConsentError(undefined);
    setSubmitting(true);
    try {
      await signup({
        email: email.trim(),
        password,
        acceptedTosVersion: TOS_VERSION,
        acceptedPrivacyVersion: PRIVACY_VERSION,
      });
      router.replace({
        pathname: "/(auth)/verify-email",
        params: { email: email.trim() },
      });
    } catch {
      toast.show({ title: t("auth.signupFailed"), intent: "danger" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreenLayout title={t("auth.signUpTitle")}>
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
          testID="signup.email"
        />
        <YStack gap={8}>
          <XStack alignItems="flex-end">
            <YStack flex={1}>
              <FormField
                label={t("auth.password")}
                placeholder={t("auth.passwordPlaceholder")}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                textContentType="newPassword"
                value={password}
                onChangeText={setPassword}
                testID="signup.password"
              />
            </YStack>
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              style={styles.eyeButton}
              testID="signup.passwordToggle"
            >
              <Icon as={showPassword ? EyeOff : Eye} size="md" />
            </Pressable>
          </XStack>
          <PasswordStrengthBar password={password} />
        </YStack>

        <Pressable
          onPress={() => {
            setConsent((v) => !v);
            if (consentError) setConsentError(undefined);
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consent }}
          style={styles.consentRow}
          testID="signup.consent"
        >
          <YStack
            width={20}
            height={20}
            borderRadius={4}
            borderWidth={2}
            borderColor={consent ? palette.blue[600] : palette.gray[400]}
            backgroundColor={consent ? palette.blue[600] : "transparent"}
            alignItems="center"
            justifyContent="center"
          >
            {consent ? <Icon as={Check} size="xs" color="#ffffff" /> : null}
          </YStack>
          <YStack flex={1}>
            <Text preset="caption">
              {t("auth.consentLine", {
                terms: "",
                privacy: "",
              }).replace(/\s+\s+/g, " ")}
            </Text>
            <XStack gap={8} marginTop={2}>
              <Link
                href={{
                  pathname: "/legal-webview",
                  params: { kind: "terms", title: t("auth.legalTerms") },
                }}
                accessibilityRole="link"
                testID="signup.termsLink"
              >
                <Text preset="caption" color={palette.blue[600]}>
                  {t("auth.consentTerms")}
                </Text>
              </Link>
              <Text preset="caption" color="$gray9">
                ·
              </Text>
              <Link
                href={{
                  pathname: "/legal-webview",
                  params: { kind: "privacy", title: t("auth.legalPrivacy") },
                }}
                accessibilityRole="link"
                testID="signup.privacyLink"
              >
                <Text preset="caption" color={palette.blue[600]}>
                  {t("auth.consentPrivacy")}
                </Text>
              </Link>
            </XStack>
            {consentError ? (
              <Text preset="caption" color="$red10" accessibilityLiveRegion="polite">
                {consentError}
              </Text>
            ) : null}
          </YStack>
        </Pressable>

        <Button
          intent="accent"
          size="lg"
          loading={submitting}
          onPress={handleSubmit}
          testID="signup.submit"
        >
          {t("auth.signUp")}
        </Button>

        <XStack justifyContent="center" gap={4} marginTop={4}>
          <Text preset="caption" color="$gray10">
            {t("auth.haveAccount")}
          </Text>
          <Link href="/(auth)/sign-in" accessibilityRole="link" testID="signup.signInLink">
            <Text preset="caption" color={palette.blue[600]}>
              {t("auth.signInInstead")}
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
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginVertical: 4,
  },
});
