/**
 * Sign-in screen — "Editorial Calm" refinement.
 *
 * Layout: brand wordmark + serif italic headline ("Welcome *back.*") +
 * underlined inputs + deep-ink primary CTA + OAuth row + footer prompt.
 * All animations come from `_components/auth-shared` (stagger reveal on
 * mount + animated focus underline + CTA arrow nudge).
 *
 * Flow preserved from the previous version:
 *   1. `login()` from `@patch-careers/auth`
 *   2. `twoFactorRequired` → push `/2fa-verify` with userId
 *   3. `sessionExchangeId` → `exchangeSessionForTokens()`
 *   4. `bootstrap()` then redirect to `/(tabs)/jobs` (index handles
 *      the gate, but we route explicitly for snappier UX)
 */

import {
  bootstrap,
  exchangeSessionForTokens,
  type LoginResult,
  login,
  signInWithProviderNative,
} from "@patch-careers/auth";
import { useToast } from "@patch-careers/ui";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { type ReactElement, useRef, useState } from "react";
import { type TextInput, View } from "react-native";
import {
  AnimatedField,
  AuthShell,
  FieldError,
  FooterPrompt,
  InlineLink,
  IntroBlock,
  OAuthButton,
  OrDivider,
  PasswordInput,
  PrimaryAction,
  UnderlineInput,
} from "../../components/auth/auth-shared";
import {
  type AuthFieldErrors,
  extractApiErrorMessages,
  validateLogin,
} from "../../components/auth/validation";
import { useI18n } from "../../providers/I18nProvider";

function resolveApiBaseURL(): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as { apiBaseURL?: string };
  return (
    extra.apiBaseURL ??
    (process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined) ??
    "https://api.patchcareers.com"
  );
}

export default function SignInScreen(): ReactElement {
  const { t, locale } = useI18n();
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const passwordRef = useRef<TextInput>(null);

  async function handleSubmit() {
    const trimmedEmail = email.trim();
    const clientErrors = validateLogin({ email: trimmedEmail, password }, t);
    if (clientErrors) {
      setFieldErrors(clientErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const result: LoginResult = await login(trimmedEmail, password);
      if (result.twoFactorRequired) {
        router.replace({
          pathname: "/(auth)/2fa-verify",
          params: { userId: result.userId },
        });
        return;
      }
      if (result.sessionExchangeId) {
        await exchangeSessionForTokens(result.sessionExchangeId);
      }
      await bootstrap().catch(() => undefined);
      router.replace("/(tabs)/jobs");
    } catch (err) {
      const { toast: title, fields } = extractApiErrorMessages(err, locale, t, "auth.loginFailed", {
        email: trimmedEmail,
        password,
      });
      if (Object.keys(fields).length > 0) setFieldErrors(fields);
      toast.show({ title, intent: "danger" });
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
    } catch {
      toast.show({ title: t("auth.oauthFailed"), intent: "danger" });
    }
  }

  return (
    <AuthShell>
      <IntroBlock prefix="Welcome " emphasis="back." subtitle="Sign in to continue your search." />

      <View style={{ gap: 24 }}>
        <AnimatedField delay={300}>
          <UnderlineInput
            label={t("auth.email")}
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChangeText={(next) => {
              setEmail(next);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
            hasError={!!fieldErrors.email}
            testID="auth.email"
          />
          {fieldErrors.email ? <FieldError text={fieldErrors.email} /> : null}
        </AnimatedField>

        <AnimatedField delay={380}>
          <PasswordInput
            ref={passwordRef}
            label={t("auth.password")}
            placeholder={t("auth.passwordPlaceholder")}
            value={password}
            onChangeText={(next) => {
              setPassword(next);
              if (fieldErrors.password)
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            returnKeyType="go"
            onSubmitEditing={() => void handleSubmit()}
            showLabel={t("auth.showPassword")}
            hideLabel={t("auth.hidePassword")}
            hasError={!!fieldErrors.password}
            testID="auth.password"
          />
          {fieldErrors.password ? <FieldError text={fieldErrors.password} /> : null}
          <InlineLink
            label={t("auth.forgotPassword")}
            href="/(auth)/forgot-password"
            align="right"
            testID="auth.forgotLink"
          />
        </AnimatedField>
      </View>

      <View style={{ marginTop: 32 }}>
        <PrimaryAction
          label={t("auth.signIn")}
          loading={submitting}
          onPress={handleSubmit}
          testID="auth.submit"
        />
      </View>

      <OrDivider text={t("auth.orDivider")} />

      <View>
        <OAuthButton
          brand="github"
          label={t("auth.continueWith", { provider: "GitHub" })}
          onPress={() => handleOAuth("github")}
          testID="auth.github"
        />
        <OAuthButton
          brand="linkedin"
          label={t("auth.continueWith", { provider: "LinkedIn" })}
          onPress={() => handleOAuth("linkedin")}
          testID="auth.linkedin"
        />
      </View>

      <FooterPrompt
        prompt={t("auth.noAccount")}
        linkLabel={t("auth.createOne")}
        href="/(auth)/sign-up"
        testID="auth.signUpLink"
      />
    </AuthShell>
  );
}
