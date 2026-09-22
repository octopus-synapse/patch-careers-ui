/**
 * Sign-in step of the unified auth dialog — the identified e-mail stays
 * visible as a chip ("change" returns to the e-mail step) and only the
 * password is asked. The submit flow is the sign-in screen's, verbatim:
 * login → 2FA branch → finishAuthentication (which also resumes e-mail
 * verification for unverified accounts via `getAuthenticatedRoute`).
 */
import { type LoginResult, login } from "@patch-careers/auth";
import { authDialogPalette } from "@patch-careers/tokens";
import { Icon, Input, Text, XStack, YStack } from "@patch-careers/ui";
import {
  type AuthMascotController,
  editorialFonts,
  useEditorialPalette,
  useThemeName,
} from "@patch-careers/ui/editorial";
import { ArrowUpRight, Eye, EyeOff } from "lucide-react-native";
import type { ReactElement } from "react";
import { useState } from "react";
import { Controller } from "react-hook-form";
import { ActivityIndicator, Pressable } from "react-native";
import { fieldErrorsSetter } from "@/components/auth/helpers/apply-field-errors";
import { handleAuthApiError } from "@/components/auth/helpers/handle-auth-api-error";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { useCompleteAuth } from "@/components/auth/hooks/use-complete-auth";
import { useKeepSignedIn } from "@/components/auth/hooks/use-keep-signed-in";
import { useMascotForm } from "@/components/auth/hooks/use-mascot-form";
import { useSubmit } from "@/components/auth/hooks/use-submit";
import { KeepSignedInRow } from "@/components/auth/keep-signed-in-row";
import { validateLogin } from "@/components/auth/validation";
import { useFieldErrorsForm } from "@/forms";
import { AuthStepTitle } from "./auth-step-title";

type PasswordForm = { password: string };

export function SignInStep({
  mascot,
  email,
  onChangeEmail,
  onForgotPassword,
}: {
  readonly mascot: AuthMascotController;
  readonly email: string;
  readonly onChangeEmail: () => void;
  readonly onForgotPassword: () => void;
}): ReactElement {
  const { t, locale, router, toast } = useAuthScreen();
  const palette = useEditorialPalette();
  const dialogPalette = authDialogPalette[useThemeName()];
  const { finishAuthentication } = useCompleteAuth();
  const { submitting, run } = useSubmit();
  const keep = useKeepSignedIn();
  const [passwordVisible, setPasswordVisible] = useState(false);

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
      onPress={onForgotPassword}
      accessibilityRole="link"
      cursor="pointer"
      fontFamily={editorialFonts.sans}
      fontSize={12}
      fontWeight="500"
      color={dialogPalette.brand}
      paddingVertical={6}
      hoverStyle={{ opacity: 0.8 }}
      testID="authDialog.forgotLink"
    >
      {t("auth.forgotPassword")}
    </Text>
  );

  return (
    <YStack gap={22} paddingTop={4} paddingBottom={8}>
      <AuthStepTitle variant="plan">{t("auth.dialogWelcomeBack")}</AuthStepTitle>

      <YStack gap={8}>
        <Text
          fontFamily={editorialFonts.sans}
          fontSize={9}
          fontWeight="600"
          letterSpacing={1.3}
          color={dialogPalette.muted}
        >
          {t("auth.email").toUpperCase()}
        </Text>
        <XStack
          minHeight={51}
          alignItems="center"
          gap={12}
          paddingHorizontal={15}
          borderWidth={1}
          borderRadius={7}
          borderColor={dialogPalette.inputBorder}
          backgroundColor={dialogPalette.input}
        >
          <Text
            flex={1}
            fontFamily={editorialFonts.mono}
            fontSize={12}
            color={dialogPalette.brand}
            numberOfLines={1}
          >
            {email}
          </Text>
          <Text
            onPress={onChangeEmail}
            accessibilityRole="button"
            cursor="pointer"
            fontFamily={editorialFonts.sans}
            fontSize={11}
            fontWeight="600"
            color={dialogPalette.brandMuted}
            textDecorationLine="underline"
            testID="authDialog.changeEmail"
          >
            {t("auth.dialogChangeEmail")}
          </Text>
        </XStack>
      </YStack>

      <Controller
        control={form.control}
        name="password"
        render={({ field, fieldState }) => (
          <YStack gap={8}>
            <Text
              fontFamily={editorialFonts.sans}
              fontSize={9}
              fontWeight="600"
              letterSpacing={1.3}
              color={dialogPalette.muted}
            >
              {t("auth.password").toUpperCase()}
            </Text>
            <XStack
              minHeight={51}
              alignItems="center"
              borderWidth={1}
              borderRadius={7}
              borderColor={fieldState.error ? palette.danger : dialogPalette.inputBorder}
              backgroundColor={dialogPalette.input}
            >
              <Input
                flex={1}
                height={49}
                paddingHorizontal={15}
                borderWidth={0}
                backgroundColor="transparent"
                color={dialogPalette.brand}
                focusStyle={{
                  borderColor: dialogPalette.focus,
                  outlineColor: dialogPalette.focus,
                }}
                fontFamily={editorialFonts.sans}
                fontSize={14}
                secureTextEntry={!passwordVisible}
                autoComplete="current-password"
                returnKeyType="go"
                onSubmitEditing={onSubmit}
                value={String(field.value ?? "")}
                onChangeText={field.onChange}
                testID="authDialog.password"
                {...bind.password("password")}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(passwordVisible ? "auth.hidePassword" : "auth.showPassword")}
                onPress={() => setPasswordVisible((visible) => !visible)}
              >
                <YStack width={48} height={49} alignItems="center" justifyContent="center">
                  <Icon as={passwordVisible ? EyeOff : Eye} size={17} color={dialogPalette.muted} />
                </YStack>
              </Pressable>
            </XStack>
            {fieldState.error ? (
              <Text fontSize={11} color={palette.danger}>
                {fieldState.error.message}
              </Text>
            ) : null}
          </YStack>
        )}
      />

      {keep.enabled ? (
        <KeepSignedInRow
          checked={keep.keepSignedIn}
          onToggle={keep.toggle}
          testID="authDialog.keepSignedIn"
          right={forgotLink}
        />
      ) : null}

      <XStack
        onPress={submitting ? undefined : onSubmit}
        accessibilityRole="button"
        accessibilityLabel={t("auth.signIn")}
        accessibilityState={{ disabled: submitting, busy: submitting }}
        minHeight={53}
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal={19}
        borderRadius={7}
        backgroundColor={dialogPalette.primary}
        opacity={submitting ? 0.55 : 1}
        pressStyle={{ backgroundColor: dialogPalette.primaryPress }}
        testID="authDialog.signInSubmit"
      >
        {submitting ? (
          <ActivityIndicator size="small" color={palette.onPrimary} />
        ) : (
          <>
            <Text
              fontFamily={editorialFonts.sans}
              fontSize={12}
              fontWeight="600"
              color={palette.onPrimary}
            >
              {t("auth.signIn")}
            </Text>
            <Icon as={ArrowUpRight} size={18} color={palette.onPrimary} />
          </>
        )}
      </XStack>

      {keep.enabled ? null : <YStack alignItems="center">{forgotLink}</YStack>}
    </YStack>
  );
}
