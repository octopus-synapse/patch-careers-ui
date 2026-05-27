/**
 * Sign-up screen (D95-D98) — "Editorial Calm" refinement.
 *
 * Single-page form: email + password (with refined 4-segment strength
 * meter + check chips) + consent checkbox with inline Terms / Privacy
 * links. Same chrome (AuthShell + IntroBlock + PrimaryAction) as
 * sign-in for visual continuity.
 *
 * On success → `/verify-email` with the email param (next screen
 * masks it for the OTP prompt).
 */

import { signup } from "@patch-careers/api-client";
import { useToast } from "@patch-careers/ui";
import { useRouter } from "expo-router";
import { type ReactElement, useRef, useState } from "react";
import { type TextInput, View } from "react-native";
import { useI18n } from "../../providers/I18nProvider";
import {
  AnimatedField,
  AuthShell,
  ConsentCheckbox,
  FieldError,
  FooterPrompt,
  IntroBlock,
  PasswordInput,
  PasswordStrengthMeter,
  PrimaryAction,
  UnderlineInput,
} from "../../components/auth/auth-shared";
import {
  type AuthFieldErrors,
  extractApiErrorMessages,
  validateSignup,
} from "../../components/auth/validation";

// Versions sent with the consent payload. Backend rejects with
// CONSENT_VERSION_MISMATCH if these don't match the live published
// versions (currently 1.0.0 semver). The live version will come from
// a runtime config endpoint in a later PR (see TODO in v2-plan).
const TOS_VERSION = "1.0.0";
const PRIVACY_VERSION = "1.0.0";

export default function SignUpScreen(): ReactElement {
  const { t, locale } = useI18n();
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [consentError, setConsentError] = useState<string | undefined>(undefined);
  const passwordRef = useRef<TextInput>(null);

  async function handleSubmit() {
    const trimmedEmail = email.trim();
    const payload = {
      email: trimmedEmail,
      password,
      acceptedTosVersion: TOS_VERSION,
      acceptedPrivacyVersion: PRIVACY_VERSION,
    };

    const clientErrors = validateSignup(payload, t);
    const nextConsentError = consent ? undefined : t("auth.consentRequired");
    if (clientErrors || nextConsentError) {
      setFieldErrors(clientErrors ?? {});
      setConsentError(nextConsentError);
      return;
    }

    setFieldErrors({});
    setConsentError(undefined);
    setSubmitting(true);
    try {
      await signup(payload);
      router.replace({
        pathname: "/(auth)/verify-email",
        params: { email: trimmedEmail },
      });
    } catch (err) {
      const { toast: title, fields } = extractApiErrorMessages(
        err,
        locale,
        t,
        "auth.signupFailed",
        { email: trimmedEmail, password },
      );
      if (Object.keys(fields).length > 0) setFieldErrors(fields);
      toast.show({ title, intent: "danger" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <IntroBlock
        prefix="Create your "
        emphasis="account."
        subtitle="A few details to get you in the door."
      />

      <View style={{ gap: 24 }}>
        <AnimatedField delay={300}>
          <UnderlineInput
            label={t("auth.email")}
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChangeText={(next) => {
              setEmail(next);
              if (fieldErrors.email)
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
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
            testID="signup.email"
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
              if (fieldErrors.password)
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            returnKeyType="next"
            showLabel={t("auth.showPassword")}
            hideLabel={t("auth.hidePassword")}
            hasError={!!fieldErrors.password}
            isNew
            testID="signup.password"
          />
          {fieldErrors.password ? <FieldError text={fieldErrors.password} /> : null}
          <PasswordStrengthMeter password={password} />
        </AnimatedField>

        <ConsentCheckbox
          checked={consent}
          onToggle={() => {
            setConsent((v) => !v);
            if (consentError) setConsentError(undefined);
          }}
          intro="I agree to the"
          termsLabel={t("auth.consentTerms")}
          termsHref={{
            pathname: "/legal-webview",
            params: { kind: "terms", title: t("auth.legalTerms") },
          }}
          conjunction="and"
          privacyLabel={t("auth.consentPrivacy")}
          privacyHref={{
            pathname: "/legal-webview",
            params: { kind: "privacy", title: t("auth.legalPrivacy") },
          }}
          {...(consentError ? { error: consentError } : {})}
          testID="signup.consent"
        />
      </View>

      <View style={{ marginTop: 32 }}>
        <PrimaryAction
          label={t("auth.signUp")}
          loading={submitting}
          onPress={handleSubmit}
          testID="signup.submit"
        />
      </View>

      <FooterPrompt
        prompt={t("auth.haveAccount")}
        linkLabel={t("auth.signInInstead")}
        href="/(auth)/sign-in"
        testID="signup.signInLink"
      />
    </AuthShell>
  );
}
