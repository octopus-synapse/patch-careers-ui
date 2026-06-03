/**
 * Sign-in screen — "Editorial Calm" refinement.
 *
 * Layout: brand wordmark + serif italic headline ("Welcome *back.*") +
 * underlined inputs + deep-ink primary CTA + OAuth row + footer prompt.
 * All animations come from `@patch-careers/ui/editorial` (stagger reveal on
 * mount + animated focus underline + CTA arrow nudge).
 *
 * Flow preserved from the previous version:
 *   1. `login()` from `@patch-careers/auth`
 *   2. `twoFactorRequired` → push `/2fa-verify` with userId
 *   3. `sessionExchangeId` → `exchangeSessionForTokens()`
 *   4. `bootstrap()` then redirect to the post-auth home (index handles
 *      the gate, but we route explicitly for snappier UX)
 */

import { type LoginResult, login } from "@patch-careers/auth";
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
} from "@patch-careers/ui/editorial";
import { type ReactElement, useRef, useState } from "react";
import { type TextInput, View } from "react-native";
import { handleAuthApiError } from "../../components/auth/helpers/handleAuthApiError";
import { useAuthFields } from "../../components/auth/hooks/useAuthFields";
import { useAuthScreen } from "../../components/auth/hooks/useAuthScreen";
import { useCompleteAuth } from "../../components/auth/hooks/useCompleteAuth";
import { useOAuthSignIn } from "../../components/auth/hooks/useOAuthSignIn";
import { useSubmit } from "../../components/auth/hooks/useSubmit";
import { GithubGlyph, LinkedinGlyph } from "../../components/auth/oauth-glyphs";
import { validateLogin } from "../../components/auth/validation";

export default function SignInScreen(): ReactElement {
  const { t, locale, router, toast } = useAuthScreen();
  const { fieldErrors, setFieldErrors, clearError } = useAuthFields();
  const { handleOAuth } = useOAuthSignIn();
  const { finishAuthentication } = useCompleteAuth();
  const { submitting, run } = useSubmit();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const passwordRef = useRef<TextInput>(null);

  async function handleSubmit() {
    const trimmedEmail = email.trim();
    const clientErrors = validateLogin({ email: trimmedEmail, password }, t);
    if (clientErrors) {
      setFieldErrors(clientErrors);
      return;
    }

    setFieldErrors({});
    await run(async () => {
      try {
        const result: LoginResult = await login(trimmedEmail, password);
        if (result.twoFactorRequired) {
          router.replace({
            pathname: "/(auth)/2fa-verify",
            params: { userId: result.userId },
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
          setFieldErrors,
          fallbackKey: "auth.loginFailed",
          payload: { email: trimmedEmail, password },
        });
      }
    });
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
              clearError("email");
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
              clearError("password");
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
            onPress={() => router.push("/(auth)/forgot-password")}
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
