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
import { Platform, type TextInput, View } from "react-native";
import { AuthEmailField, AuthPasswordField } from "@/components/auth/fields";
import { handleAuthApiError } from "@/components/auth/helpers/handle-auth-api-error";
import { useAuthFields } from "@/components/auth/hooks/use-auth-fields";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { useCompleteAuth } from "@/components/auth/hooks/use-complete-auth";
import { useOAuthSignIn } from "@/components/auth/hooks/use-oauth-sign-in";
import { useSubmit } from "@/components/auth/hooks/use-submit";
import { readKeepSignedIn, saveKeepSignedIn } from "@/components/auth/keep-signed-in-preference";
import { GithubGlyph, GoogleGlyph, LinkedinGlyph } from "@/components/auth/oauth-glyphs";
import { validateLogin } from "@/components/auth/validation";

export default function SignInScreen(): ReactElement {
  const { t, locale, router, toast } = useAuthScreen();
  const { fieldErrors, setFieldErrors, clearError } = useAuthFields();
  const { handleOAuth } = useOAuthSignIn();
  const { finishAuthentication } = useCompleteAuth();
  const { submitting, run } = useSubmit();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Web-only "keep me signed in" — cookie mode. Default unchecked; restore the
  // user's last choice so it's pre-filled. Native uses persistent secure-store
  // and shows no checkbox.
  const isWeb = Platform.OS === "web";
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!isWeb) return;
    void readKeepSignedIn().then(setKeepSignedIn);
  }, [isWeb]);

  async function handleSubmit() {
    const trimmedEmail = email.trim();
    const clientErrors = validateLogin({ email: trimmedEmail, password }, t);
    if (clientErrors) {
      setFieldErrors(clientErrors);
      return;
    }

    setFieldErrors({});
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
        <AuthEmailField
          value={email}
          onChangeText={(next) => {
            setEmail(next);
            clearError("email");
          }}
          error={fieldErrors.email}
          testID="auth.email"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        <AuthPasswordField
          inputRef={passwordRef}
          value={password}
          onChangeText={(next) => {
            setPassword(next);
            clearError("password");
          }}
          error={fieldErrors.password}
          testID="auth.password"
          returnKeyType="go"
          onSubmitEditing={() => void handleSubmit()}
        >
          <InlineLink
            label={t("auth.forgotPassword")}
            onPress={() => router.push("/(auth)/forgot-password")}
            align="right"
            testID="auth.forgotLink"
          />
        </AuthPasswordField>
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
