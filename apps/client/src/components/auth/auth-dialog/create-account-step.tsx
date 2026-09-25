/** Password and consent step shared by /auth and the landing dialog. */
import { authDialogPalette } from "@patch-careers/tokens";
import { Icon, Input, Text, XStack, YStack } from "@patch-careers/ui";
import {
  type AuthMascotController,
  editorialFonts,
  PasswordStrengthMeter,
  useEditorialPalette,
  useThemeName,
} from "@patch-careers/ui/editorial";
import { ArrowUpRight, Eye, EyeOff } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { Controller } from "react-hook-form";
import { ActivityIndicator, Pressable } from "react-native";
import { ConsentDialog } from "@/components/auth/consent-dialog";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { useKeepSignedIn } from "@/components/auth/hooks/use-keep-signed-in";
import { useMascotForm } from "@/components/auth/hooks/use-mascot-form";
import { KeepSignedInRow } from "@/components/auth/keep-signed-in-row";
import { passwordMeterLabels } from "@/components/auth/password-meter-labels";
import { validateSignup } from "@/components/auth/validation";
import { useFieldErrorsForm } from "@/forms";
import { AuthStepTitle } from "./auth-step-title";

type PasswordForm = { password: string };

export function CreateAccountStep({
  mascot,
  email,
  initialPassword = "",
  submitting = false,
  onChangeEmail,
  onContinue,
  mode,
}: {
  readonly mascot: AuthMascotController;
  readonly email: string;
  readonly initialPassword?: string;
  readonly submitting?: boolean;
  readonly onChangeEmail: () => void;
  readonly onContinue: (password: string, keepSignedIn: boolean) => void | Promise<void>;
  readonly mode: "new" | "resume";
}): ReactElement {
  const { t } = useAuthScreen();
  const palette = useEditorialPalette();
  const dialogPalette = authDialogPalette[useThemeName()];
  const keep = useKeepSignedIn();
  const [consentOpen, setConsentOpen] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const form = useFieldErrorsForm<PasswordForm>(
    (values) => {
      // Reuse the sign-up validator; name is onboarding's now, so only the
      // password verdict applies (the e-mail was validated a step ago).
      const errors = validateSignup({ name: "-", email, password: values.password }, t);
      return errors?.password ? { password: errors.password } : null;
    },
    { defaultValues: { password: initialPassword } },
  );
  const bind = useMascotForm(mascot, form);
  const password = form.watch("password");

  const onSubmit = form.handleSubmit(
    () => {
      setConsentOpen(true);
    },
    () => mascot.grimace(),
  );

  const continueWithConsent = (): void => {
    setConsentOpen(false);
    const { password: nextPassword } = form.getValues();
    void onContinue(nextPassword, keep.keepSignedIn);
  };

  return (
    <YStack gap={22} paddingTop={4} paddingBottom={8}>
      <AuthStepTitle variant="plan">{t("auth.dialogCreatePasswordTitle")}</AuthStepTitle>

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
            testID="authDialog.changeEmailCreate"
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
                autoComplete="new-password"
                returnKeyType="go"
                onSubmitEditing={onSubmit}
                value={String(field.value ?? "")}
                onChangeText={field.onChange}
                testID="authDialog.newPassword"
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
            <PasswordStrengthMeter password={password} {...passwordMeterLabels(t)} />
          </YStack>
        )}
      />

      {keep.enabled ? (
        <KeepSignedInRow
          checked={keep.keepSignedIn}
          onToggle={keep.toggle}
          testID="authDialog.keepSignedInCreate"
        />
      ) : null}

      <XStack
        onPress={submitting ? undefined : onSubmit}
        accessibilityRole="button"
        accessibilityLabel={t("auth.dialogContinue")}
        accessibilityState={{ disabled: submitting, busy: submitting }}
        minHeight={53}
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal={19}
        borderRadius={7}
        backgroundColor={dialogPalette.primary}
        opacity={submitting ? 0.55 : 1}
        pressStyle={{ backgroundColor: dialogPalette.primaryPress }}
        testID="authDialog.createSubmit"
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
              {t("auth.dialogContinue")}
            </Text>
            <Icon as={ArrowUpRight} size={18} color={palette.onPrimary} />
          </>
        )}
      </XStack>

      <ConsentDialog
        open={consentOpen}
        onOpenChange={setConsentOpen}
        loading={submitting}
        acceptLabel={mode === "resume" ? t("auth.consentAcceptContinue") : undefined}
        onAccept={continueWithConsent}
        testID="authDialog.consent"
      />
    </YStack>
  );
}
