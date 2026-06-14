/**
 * Sign-in screen — "Editorial Calm" refinement.
 *
 * Layout: brand wordmark + serif italic headline ("Welcome *back.*") +
 * underlined inputs + deep-ink primary CTA + OAuth row + footer prompt.
 * All animations come from `@patch-careers/ui/editorial` (stagger reveal on
 * mount + animated focus underline + CTA arrow nudge).
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
import {
  AuthShell,
  CheckboxField,
  FooterPrompt,
  InlineLink,
  IntroBlock,
  OAuthButton,
  OrDivider,
  PrimaryAction,
} from "@patch-careers/ui/editorial";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Platform, type TextInput, View } from "react-native";
import { handleAuthApiError } from "@/components/auth/helpers/handle-auth-api-error";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { useCompleteAuth } from "@/components/auth/hooks/use-complete-auth";
import { useOAuthSignIn } from "@/components/auth/hooks/use-oauth-sign-in";
import { useSubmit } from "@/components/auth/hooks/use-submit";
import { readKeepSignedIn, saveKeepSignedIn } from "@/components/auth/keep-signed-in-preference";
import { GithubGlyph, GoogleGlyph, LinkedinGlyph } from "@/components/auth/oauth-glyphs";
import { type AuthFieldErrors, validateLogin } from "@/components/auth/validation";
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

  return (
    <AuthShell showEra={false}>
      <IntroBlock
        prefix={t("app.signIn.heroPrefix")}
        emphasis={t("app.signIn.heroEmphasis")}
        subtitle={t("app.signIn.subtitle")}
        showWordmark={false}
      />

      <View style={{ gap: 24 }}>
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
        >
          <InlineLink
            label={t("auth.forgotPassword")}
            onPress={() => router.push("/(auth)/forgot-password")}
            align="right"
            testID="auth.forgotLink"
          />
        </FormPasswordField>
      </View>

      {isWeb ? (
        <View style={{ marginTop: 20 }}>
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
        </View>
      ) : null}

      <View style={{ marginTop: 28 }}>
        <PrimaryAction
          label={t("auth.signIn")}
          loading={submitting}
          onPress={onSubmit}
          testID="auth.submit"
        />
      </View>

      <OrDivider text={t("auth.orDivider")} />

      <View>
        <OAuthButton
          icon={GithubGlyph}
          delay={700}
          label={t("auth.continueWith", { provider: "GitHub" })}
          onPress={() => handleOAuth("github")}
          testID="auth.github"
        />
        <OAuthButton
          icon={LinkedinGlyph}
          delay={800}
          label={t("auth.continueWith", { provider: "LinkedIn" })}
          onPress={() => handleOAuth("linkedin")}
          testID="auth.linkedin"
        />
        <OAuthButton
          icon={GoogleGlyph}
          delay={900}
          label={t("auth.continueWith", { provider: "Google" })}
          onPress={() => handleOAuth("google")}
          testID="auth.google"
        />
      </View>

      <FooterPrompt
        prompt={t("auth.noAccount")}
        linkLabel={t("auth.createOne")}
        onPress={() => router.push("/(auth)/sign-up")}
        testID="auth.signUpLink"
      />
    </AuthShell>
  );
}
