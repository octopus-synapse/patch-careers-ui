/**
 * Sign-up step of the unified auth dialog — the e-mail is already known,
 * so this asks only for a password (with the strength meter) and then
 * raises the same `<ConsentDialog>` gate the sign-up screen uses;
 * accepting there is what actually submits. Name is intentionally not
 * collected here — it moves to the first onboarding step (backend
 * defaults it from the e-mail handle meanwhile).
 *
 * The e-mail was ALREADY verified one step earlier (identifier-first:
 * e-mail → code → password), so the signup carries the registration
 * token, the account is born verified, and success goes straight through
 * `finishAuthentication()` to onboarding — no post-signup verify step.
 * Session recipe is sign-up.tsx's (signup → login → token exchange).
 */
import { signup } from "@patch-careers/api-client";
import { login } from "@patch-careers/auth";
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
import { PRIVACY_VERSION, TOS_VERSION } from "@/components/auth/consent-versions";
import { fieldErrorsSetter } from "@/components/auth/helpers/apply-field-errors";
import { handleAuthApiError } from "@/components/auth/helpers/handle-auth-api-error";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { useCompleteAuth } from "@/components/auth/hooks/use-complete-auth";
import { useKeepSignedIn } from "@/components/auth/hooks/use-keep-signed-in";
import { useMascotForm } from "@/components/auth/hooks/use-mascot-form";
import { useSubmit } from "@/components/auth/hooks/use-submit";
import { KeepSignedInRow } from "@/components/auth/keep-signed-in-row";
import { passwordMeterLabels } from "@/components/auth/password-meter-labels";
import { validateSignup } from "@/components/auth/validation";
import { useFieldErrorsForm } from "@/forms";

type PasswordForm = { password: string };

export function CreateAccountStep({
  mascot,
  email,
  registrationToken,
  onChangeEmail,
}: {
  readonly mascot: AuthMascotController;
  readonly email: string;
  /** Proof from the verify step that this e-mail is already confirmed. */
  readonly registrationToken: string;
  readonly onChangeEmail: () => void;
}): ReactElement {
  const { t, locale, toast } = useAuthScreen();
  const palette = useEditorialPalette();
  const dialogPalette = authDialogPalette[useThemeName()];
  const { finishAuthentication } = useCompleteAuth();
  const { submitting, run } = useSubmit();
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
    { defaultValues: { password: "" } },
  );
  const bind = useMascotForm(mascot, form);
  const password = form.watch("password");

  // "Continue" only validates and raises the consent gate; the request is
  // sent from `acceptAndSignup` once the user has accepted (LGPD).
  const onSubmit = form.handleSubmit(
    () => setConsentOpen(true),
    () => mascot.grimace(),
  );

  async function acceptAndSignup(): Promise<void> {
    const { password: pw } = form.getValues();
    await run(async () => {
      try {
        await signup({
          email,
          password: pw,
          acceptedTosVersion: TOS_VERSION,
          acceptedPrivacyVersion: PRIVACY_VERSION,
          emailVerificationToken: registrationToken,
        });
        // Same recipe as sign-up.tsx: signup only sets an httpOnly cookie;
        // log in for a real Bearer session. The account is born verified,
        // so finishAuthentication routes straight to onboarding. A login
        // failure must NOT read as a signup failure — the account exists;
        // finish with whatever session the cookie carries (worst case the
        // redirect lands on sign-in and the user logs in manually).
        let sessionExchangeId: string | undefined;
        try {
          const result = await login(
            email,
            pw,
            keep.enabled ? { keepSignedIn: keep.keepSignedIn } : undefined,
          );
          sessionExchangeId = result.sessionExchangeId ?? undefined;
        } catch {
          // Fall through — see above.
        }
        setConsentOpen(false);
        mascot.celebrate({ settle: true });
        await finishAuthentication(sessionExchangeId ? { sessionExchangeId } : undefined);
      } catch (err) {
        setConsentOpen(false);
        mascot.grimace();
        handleAuthApiError(err, {
          locale,
          t,
          toast,
          setFieldErrors: fieldErrorsSetter(form, ["password"]),
          fallbackKey: "auth.signupFailed",
        });
      }
    });
  }

  return (
    <YStack gap={22} paddingTop={4} paddingBottom={8}>
      <Text
        fontFamily={editorialFonts.sans}
        fontSize={38}
        lineHeight={41}
        fontWeight="600"
        letterSpacing={-1.7}
        color={dialogPalette.brand}
      >
        {t("auth.dialogCreatePasswordTitle")}
      </Text>

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
        onAccept={() => void acceptAndSignup()}
        testID="authDialog.consent"
      />
    </YStack>
  );
}
