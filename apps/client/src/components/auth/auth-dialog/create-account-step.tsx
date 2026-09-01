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
import { Text, YStack } from "@patch-careers/ui";
import {
  type AuthMascotController,
  editorialFonts,
  PasswordStrengthMeter,
  PrimaryAction,
  useEditorialPalette,
} from "@patch-careers/ui/editorial";
import { type ReactElement, useState } from "react";
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
import { FormPasswordField, useFieldErrorsForm } from "@/forms";
import { EmailChip } from "./email-chip";

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
  const { finishAuthentication } = useCompleteAuth();
  const { submitting, run } = useSubmit();
  const keep = useKeepSignedIn();
  const [consentOpen, setConsentOpen] = useState(false);

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
    <YStack gap={20} paddingVertical={22}>
      <Text
        fontFamily={editorialFonts.serif}
        fontSize={27}
        lineHeight={32}
        letterSpacing={-0.4}
        textAlign="center"
        color={palette.ink}
      >
        {t("auth.dialogCreatePasswordTitle")}
      </Text>

      <EmailChip
        email={email}
        changeLabel={t("auth.dialogChangeEmail")}
        onChange={onChangeEmail}
        testID="authDialog.changeEmailCreate"
      />

      <FormPasswordField
        control={form.control}
        name="password"
        testID="authDialog.newPassword"
        returnKeyType="go"
        isNew
        onSubmitEditing={onSubmit}
        {...bind.password("password")}
      >
        <PasswordStrengthMeter password={password} {...passwordMeterLabels(t)} />
      </FormPasswordField>

      {keep.enabled ? (
        <KeepSignedInRow
          checked={keep.keepSignedIn}
          onToggle={keep.toggle}
          testID="authDialog.keepSignedInCreate"
        />
      ) : null}

      <PrimaryAction
        label={t("auth.dialogContinue")}
        loading={submitting}
        onPress={onSubmit}
        testID="authDialog.createSubmit"
      />

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
