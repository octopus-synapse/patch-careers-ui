/**
 * Sign-in screen — "Editorial Calm", on a standalone card with the mascot.
 *
 * Shares its whole surface with sign-up through `CredentialsCard` (shell,
 * mascot, title, provider chips, dev-fill); what is specific here is the
 * two fields, the "keep me signed in / forgot password" row and the flow:
 *   1. `login()` from `@patch-careers/auth`
 *   2. `twoFactorRequired` → push `/2fa-verify` with userId
 *   3. `sessionExchangeId` → `exchangeSessionForTokens()`
 *   4. `bootstrap()` then redirect to the post-auth home
 * The mascot only "clicks" on a real success; a rejected login grimaces.
 */

import { type LoginResult, login } from "@patch-careers/auth";
import { Text, YStack } from "@patch-careers/ui";
import {
  editorialFonts,
  FooterPrompt,
  PrimaryAction,
  useAuthMascot,
} from "@patch-careers/ui/editorial";
import { type ReactElement, useRef } from "react";
import { Platform, type TextInput } from "react-native";
import { CredentialsCard } from "@/components/auth/credentials-card";
import { fieldErrorsSetter } from "@/components/auth/helpers/apply-field-errors";
import { handleAuthApiError } from "@/components/auth/helpers/handle-auth-api-error";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { useCompleteAuth } from "@/components/auth/hooks/use-complete-auth";
import { useKeepSignedIn } from "@/components/auth/hooks/use-keep-signed-in";
import { useMascotForm } from "@/components/auth/hooks/use-mascot-form";
import { useSubmit } from "@/components/auth/hooks/use-submit";
import { KeepSignedInRow } from "@/components/auth/keep-signed-in-row";
import { validateLogin } from "@/components/auth/validation";
import { devTestCredentials } from "@/config/dev-flags";
import { FormEmailField, FormPasswordField, useFieldErrorsForm } from "@/forms";
import { useLocalizedHref } from "@/navigation/locale-prefix";

type LoginForm = { email: string; password: string };

export default function SignInScreen(): ReactElement {
  const { t, locale, router, toast } = useAuthScreen();
  const localized = useLocalizedHref();
  const { finishAuthentication } = useCompleteAuth();
  const { submitting, run } = useSubmit();
  const keep = useKeepSignedIn();
  const isWeb = Platform.OS === "web";
  const passwordRef = useRef<TextInput>(null);
  const mascot = useAuthMascot();

  const form = useFieldErrorsForm<LoginForm>(
    (values) => validateLogin({ email: values.email.trim(), password: values.password }, t),
    { defaultValues: { email: "", password: "" } },
  );
  const bind = useMascotForm(mascot, form);

  // DEV-only: drop the seeded account into the form so signing in is one tap.
  function fillSignInTest(): void {
    const { email, password } = devTestCredentials();
    form.setValue("email", email, { shouldValidate: true });
    form.setValue("password", password, { shouldValidate: true });
  }

  const onSubmit = form.handleSubmit(async ({ email, password }) => {
    mascot.reset();
    const trimmedEmail = email.trim();
    await run(async () => {
      try {
        const result: LoginResult = await login(
          trimmedEmail,
          password,
          keep.enabled ? { keepSignedIn: keep.keepSignedIn } : undefined,
        );
        mascot.celebrate();
        if (result.twoFactorRequired) {
          router.replace({
            pathname: "/(auth)/2fa-verify",
            params: { userId: result.userId, keepSignedIn: keep.keepSignedIn ? "1" : "0" },
          });
          return;
        }
        await finishAuthentication(
          result.sessionExchangeId ? { sessionExchangeId: result.sessionExchangeId } : undefined,
        );
      } catch (err) {
        mascot.grimace();
        handleAuthApiError(err, {
          locale,
          t,
          toast,
          setFieldErrors: fieldErrorsSetter(form, ["email", "password"]),
          fallbackKey: "auth.loginFailed",
        });
      }
    });
  });

  const forgotLink = (
    <Text
      onPress={() => router.push(localized("/(auth)/forgot-password"))}
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
    <CredentialsCard
      title={t("auth.signIn")}
      mascot={mascot}
      testIDPrefix="auth"
      onDevFill={fillSignInTest}
    >
      <YStack gap={24}>
        <FormEmailField
          control={form.control}
          name="email"
          testID="auth.email"
          onSubmitEditing={() => passwordRef.current?.focus()}
          {...bind.text("email", "email")}
        />
        <FormPasswordField
          control={form.control}
          name="password"
          inputRef={passwordRef}
          testID="auth.password"
          returnKeyType="go"
          onSubmitEditing={onSubmit}
          {...bind.password("password")}
        />
      </YStack>

      {/* Web: checkbox and "forgot password" share one row; native has no
          checkbox, so the link sits centred under the CTA instead. */}
      {keep.enabled ? (
        <KeepSignedInRow
          checked={keep.keepSignedIn}
          onToggle={keep.toggle}
          testID="auth.keepSignedIn"
          right={forgotLink}
        />
      ) : null}

      <YStack marginTop={isWeb ? 30 : 26}>
        <PrimaryAction
          label={t("auth.signIn")}
          loading={submitting}
          onPress={onSubmit}
          testID="auth.submit"
        />
      </YStack>

      {keep.enabled ? null : (
        <YStack alignItems="center" marginTop={14}>
          {forgotLink}
        </YStack>
      )}

      <FooterPrompt
        prompt={t("auth.noAccount")}
        linkLabel={t("auth.createOne")}
        onPress={() => router.push(localized("/(auth)/sign-up"))}
        testID="auth.signUpLink"
      />
    </CredentialsCard>
  );
}
