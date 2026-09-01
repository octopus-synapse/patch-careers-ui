/**
 * Sign-in step of the unified auth dialog — the identified e-mail stays
 * visible as a chip ("change" returns to the e-mail step) and only the
 * password is asked. The submit flow is the sign-in screen's, verbatim:
 * login → 2FA branch → finishAuthentication (which also resumes e-mail
 * verification for unverified accounts via `getAuthenticatedRoute`).
 */
import { type LoginResult, login } from "@patch-careers/auth";
import { Text, YStack } from "@patch-careers/ui";
import {
  type AuthMascotController,
  editorialFonts,
  PrimaryAction,
  useEditorialPalette,
} from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { fieldErrorsSetter } from "@/components/auth/helpers/apply-field-errors";
import { handleAuthApiError } from "@/components/auth/helpers/handle-auth-api-error";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { useCompleteAuth } from "@/components/auth/hooks/use-complete-auth";
import { useKeepSignedIn } from "@/components/auth/hooks/use-keep-signed-in";
import { useMascotForm } from "@/components/auth/hooks/use-mascot-form";
import { useSubmit } from "@/components/auth/hooks/use-submit";
import { KeepSignedInRow } from "@/components/auth/keep-signed-in-row";
import { validateLogin } from "@/components/auth/validation";
import { FormPasswordField, useFieldErrorsForm } from "@/forms";
import { useLocalizedHref } from "@/navigation/locale-prefix";
import { EmailChip } from "./email-chip";

type PasswordForm = { password: string };

export function SignInStep({
  mascot,
  email,
  onChangeEmail,
}: {
  readonly mascot: AuthMascotController;
  readonly email: string;
  readonly onChangeEmail: () => void;
}): ReactElement {
  const { t, locale, router, toast } = useAuthScreen();
  const localized = useLocalizedHref();
  const palette = useEditorialPalette();
  const { finishAuthentication } = useCompleteAuth();
  const { submitting, run } = useSubmit();
  const keep = useKeepSignedIn();

  const form = useFieldErrorsForm<PasswordForm>(
    (values) => {
      const errors = validateLogin({ email, password: values.password }, t);
      return errors?.password ? { password: errors.password } : null;
    },
    { defaultValues: { password: "" } },
  );
  const bind = useMascotForm(mascot, form);

  const onSubmit = form.handleSubmit(async ({ password }) => {
    mascot.reset();
    await run(async () => {
      try {
        const result: LoginResult = await login(
          email,
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
          setFieldErrors: fieldErrorsSetter(form, ["password"]),
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
      fontSize={14}
      fontWeight="500"
      color="$accentBlue"
      paddingVertical={6}
      hoverStyle={{ opacity: 0.8 }}
      testID="authDialog.forgotLink"
    >
      {t("auth.forgotPassword")}
    </Text>
  );

  return (
    <YStack gap={20} paddingVertical={22}>
      <Text
        fontFamily={editorialFonts.serif}
        fontSize={27}
        lineHeight={32}
        letterSpacing={-0.4}
        textAlign="center"
        color={palette.ink}
      >
        {t("auth.dialogWelcomeBack")}
      </Text>

      <EmailChip
        email={email}
        changeLabel={t("auth.dialogChangeEmail")}
        onChange={onChangeEmail}
        testID="authDialog.changeEmail"
      />

      <FormPasswordField
        control={form.control}
        name="password"
        testID="authDialog.password"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
        {...bind.password("password")}
      />

      {keep.enabled ? (
        <KeepSignedInRow
          checked={keep.keepSignedIn}
          onToggle={keep.toggle}
          testID="authDialog.keepSignedIn"
          right={forgotLink}
        />
      ) : null}

      <PrimaryAction
        label={t("auth.signIn")}
        loading={submitting}
        onPress={onSubmit}
        testID="authDialog.signInSubmit"
      />

      {keep.enabled ? null : <YStack alignItems="center">{forgotLink}</YStack>}
    </YStack>
  );
}
