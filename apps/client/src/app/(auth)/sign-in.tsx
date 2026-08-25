/**
 * Sign-in screen — "Editorial Calm", on a standalone card.
 *
 * The whole form lives inside `AuthCard`: a 90%-wide panel, vertically
 * centered, on the scheme's `panel` paper — a lift off the screen in both
 * light and dark.
 *
 * Above the fields sits a row of small brand-colored provider chips, each in
 * its provider's own fixed colors (they do not flip with the scheme — a brand
 * mark that restyled itself would stop reading as that brand). They are
 * deliberately small: the credentials form is the primary path.
 *
 * Form: React Hook Form (ADR-0005) with a resolver that reuses validateLogin
 * (same Zod-backed checks + i18n messages); backend field errors are bridged
 * onto the form via setError. Flow preserved:
 *   1. `login()` from `@patch-careers/auth`
 *   2. `twoFactorRequired` → push `/2fa-verify` with userId
 *   3. `sessionExchangeId` → `exchangeSessionForTokens()`
 *   4. `bootstrap()` then redirect to the post-auth home
 */

import { type LoginResult, login } from "@patch-careers/auth";
import { Text, XStack, YStack } from "@patch-careers/ui";
import {
  AuthCard,
  AuthShell,
  CheckboxField,
  editorialFonts,
  FooterPrompt,
  PrimaryAction,
} from "@patch-careers/ui/editorial";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Platform, type TextInput } from "react-native";
import { handleAuthApiError } from "@/components/auth/helpers/handle-auth-api-error";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { useCompleteAuth } from "@/components/auth/hooks/use-complete-auth";
import { useOAuthSignIn } from "@/components/auth/hooks/use-oauth-sign-in";
import { useSubmit } from "@/components/auth/hooks/use-submit";
import { readKeepSignedIn, saveKeepSignedIn } from "@/components/auth/keep-signed-in-preference";
import { OAuthBrandButton } from "@/components/auth/oauth-brand-button";
import { GithubGlyph, GoogleGlyph, LinkedinGlyph } from "@/components/auth/oauth-glyphs";
import { type AuthFieldErrors, validateLogin } from "@/components/auth/validation";
import { devTestCredentials, isDevTestFillEnabled } from "@/config/dev-flags";
import { FormEmailField, FormPasswordField, fieldErrorsResolver } from "@/forms";

type LoginForm = { email: string; password: string };

export default function SignInScreen(): ReactElement {
  const { t, locale, router, toast } = useAuthScreen();
  const { handleOAuth } = useOAuthSignIn();
  const { finishAuthentication } = useCompleteAuth();
  const { submitting, run } = useSubmit();

  // Web-only "keep me signed in" — cookie mode. Default unchecked; restore the
  // user's last choice. Native uses persistent secure-store and shows no box.
  const isWeb = Platform.OS === "web";
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const form = useForm<LoginForm>({
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
    resolver: fieldErrorsResolver<LoginForm>((values) =>
      validateLogin({ email: values.email.trim(), password: values.password }, t),
    ),
  });

  useEffect(() => {
    if (!isWeb) return;
    void readKeepSignedIn().then(setKeepSignedIn);
  }, [isWeb]);

  // Surface backend field errors (from handleAuthApiError) on the RHF form.
  function applyFieldErrors(fields: AuthFieldErrors): void {
    for (const key of ["email", "password"] as const) {
      const message = fields[key];
      if (message) form.setError(key, { message });
    }
  }

  // DEV-only: drop the seeded account into the form so signing in is one tap.
  function fillSignInTest(): void {
    const { email, password } = devTestCredentials();
    form.setValue("email", email, { shouldValidate: true });
    form.setValue("password", password, { shouldValidate: true });
  }

  const onSubmit = form.handleSubmit(async ({ email, password }) => {
    const trimmedEmail = email.trim();
    // Remember the choice for next time (web only).
    if (isWeb) void saveKeepSignedIn(keepSignedIn);
    await run(async () => {
      try {
        const result: LoginResult = await login(
          trimmedEmail,
          password,
          isWeb ? { keepSignedIn } : undefined,
        );
        if (result.twoFactorRequired) {
          router.replace({
            pathname: "/(auth)/2fa-verify",
            params: { userId: result.userId, keepSignedIn: keepSignedIn ? "1" : "0" },
          });
          return;
        }
        await finishAuthentication(
          result.sessionExchangeId ? { sessionExchangeId: result.sessionExchangeId } : undefined,
        );
      } catch (err) {
        handleAuthApiError(err, {
          locale,
          t,
          toast,
          setFieldErrors: applyFieldErrors,
          fallbackKey: "auth.loginFailed",
          payload: { email: trimmedEmail, password },
        });
      }
    });
  });

  const forgotLink = (
    <Text
      onPress={() => router.push("/(auth)/forgot-password")}
      accessibilityRole="link"
      cursor="pointer"
      fontFamily={editorialFonts.sans}
      fontSize={isWeb ? 14 : 13}
      fontWeight="500"
      color="$accentBlue"
      paddingVertical={6}
      hoverStyle={{ opacity: 0.8 }}
      testID="auth.forgotLink"
    >
      {t("auth.forgotPassword")}
    </Text>
  );

  return (
    <AuthShell variant="card">
      <AuthCard>
        {/* Colors below come from Tamagui tokens ($ink/$accentBlue/…) so they
            follow the active scheme without a palette hook here. */}
        <Text
          textAlign="center"
          fontFamily={editorialFonts.sans}
          fontSize={isWeb ? 30 : 28}
          lineHeight={isWeb ? 36 : 34}
          fontWeight="600"
          letterSpacing={-0.4}
          color="$ink"
        >
          {t("auth.signIn")}
        </Text>

        <XStack justifyContent="center" gap={12} marginTop={22} marginBottom={30}>
          <OAuthBrandButton
            provider="google"
            glyph={GoogleGlyph}
            delay={180}
            label={t("auth.continueWith", { provider: "Google" })}
            onPress={() => handleOAuth("google")}
            testID="auth.google"
          />
          <OAuthBrandButton
            provider="linkedin"
            glyph={LinkedinGlyph}
            delay={240}
            label={t("auth.continueWith", { provider: "LinkedIn" })}
            onPress={() => handleOAuth("linkedin")}
            testID="auth.linkedin"
          />
          <OAuthBrandButton
            provider="github"
            glyph={GithubGlyph}
            delay={300}
            label={t("auth.continueWith", { provider: "GitHub" })}
            onPress={() => handleOAuth("github")}
            testID="auth.github"
          />
        </XStack>

        {isDevTestFillEnabled() ? (
          <YStack alignItems="flex-end" marginBottom={2}>
            <Text
              onPress={fillSignInTest}
              accessibilityRole="button"
              cursor="pointer"
              fontFamily={editorialFonts.mono}
              fontSize={10}
              letterSpacing={1.4}
              color="$inkSubtle"
              paddingVertical={4}
              paddingHorizontal={6}
              testID="auth.devFill"
            >
              test
            </Text>
          </YStack>
        ) : null}

        <YStack gap={24}>
          <FormEmailField
            control={form.control}
            name="email"
            testID="auth.email"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <FormPasswordField
            control={form.control}
            name="password"
            inputRef={passwordRef}
            testID="auth.password"
            returnKeyType="go"
            onSubmitEditing={onSubmit}
          />
        </YStack>

        {/* Web: "keep me signed in" and "forgot password" share one quiet row
            under the fields (left/right), so neither floats alone in the
            column. Native has no checkbox: the link is centered below the CTA. */}
        {isWeb ? (
          <XStack alignItems="center" justifyContent="space-between" marginTop={18}>
            <CheckboxField
              checked={keepSignedIn}
              onToggle={() =>
                setKeepSignedIn((v) => {
                  const next = !v;
                  void saveKeepSignedIn(next);
                  return next;
                })
              }
              label={t("auth.keepSignedIn")}
              delay={300}
              testID="auth.keepSignedIn"
            />
            {forgotLink}
          </XStack>
        ) : null}

        <YStack marginTop={isWeb ? 24 : 26}>
          <PrimaryAction
            label={t("auth.signIn")}
            loading={submitting}
            onPress={onSubmit}
            testID="auth.submit"
          />
        </YStack>

        {isWeb ? null : (
          <YStack alignItems="center" marginTop={14}>
            {forgotLink}
          </YStack>
        )}

        <FooterPrompt
          prompt={t("auth.noAccount")}
          linkLabel={t("auth.createOne")}
          onPress={() => router.push("/(auth)/sign-up")}
          testID="auth.signUpLink"
        />
      </AuthCard>
    </AuthShell>
  );
}
