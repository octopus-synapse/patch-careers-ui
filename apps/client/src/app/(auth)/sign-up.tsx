/**
 * Sign-up screen (D95-D98) — the sign-in screen's twin.
 *
 * Same `CredentialsCard` surface (shell, mascot, title, chips, dev-fill);
 * sign-up only adds the name field, the strength meter and the consent
 * gate: "Create account" validates the fields, then opens <ConsentDialog>;
 * accepting there is what actually submits.
 *
 * Success is a TRANSIT state (like verify-email's): the consent dialog drops
 * first so the mascot's snap plays in the open, the form fades out under it,
 * the title swaps to "Account created." on the grin beat, the card collapses
 * to the stage height and, after a hold, we hand off to `/verify-email`
 * (`created=1`) — which opens on that exact frame. See `created-stage.tsx`.
 */

import { signup } from "@patch-careers/api-client";
import { exchangeSessionForTokens, login } from "@patch-careers/auth";
import { YStack } from "@patch-careers/ui";
import {
  AUTH_CARD_PADDING_Y,
  FooterPrompt,
  PasswordStrengthMeter,
  PrimaryAction,
  useAuthMascot,
} from "@patch-careers/ui/editorial";
import * as Haptics from "expo-haptics";
import { type ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, type LayoutChangeEvent, Platform, type TextInput } from "react-native";
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { ConsentDialog } from "@/components/auth/consent-dialog";
import { PRIVACY_VERSION, TOS_VERSION } from "@/components/auth/consent-versions";
import { CREATED_STAGE_CARD_HEIGHT, CREATED_TIMELINE } from "@/components/auth/created-stage";
import { CredentialsCard, type CredentialsTransit } from "@/components/auth/credentials-card";
import { fieldErrorsSetter } from "@/components/auth/helpers/apply-field-errors";
import { handleAuthApiError } from "@/components/auth/helpers/handle-auth-api-error";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { useKeepSignedIn } from "@/components/auth/hooks/use-keep-signed-in";
import { useMascotForm } from "@/components/auth/hooks/use-mascot-form";
import { useSubmit } from "@/components/auth/hooks/use-submit";
import { KeepSignedInRow } from "@/components/auth/keep-signed-in-row";
import { passwordMeterLabels } from "@/components/auth/password-meter-labels";
import { validateSignup } from "@/components/auth/validation";
import { FormEmailField, FormNameField, FormPasswordField, useFieldErrorsForm } from "@/forms";
import { useLocalizedHref } from "@/navigation/locale-prefix";

type SignUpForm = { name: string; email: string; password: string };
type Phase = "form" | "created";

/** Very large = no clamp; the panel keeps its natural height. */
const UNCLAMPED = 100_000;

export default function SignUpScreen(): ReactElement {
  const { t, locale, router, toast } = useAuthScreen();
  const localized = useLocalizedHref();
  const { submitting, run } = useSubmit();
  const keep = useKeepSignedIn();
  const isWeb = Platform.OS === "web";
  const [consentOpen, setConsentOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const mascot = useAuthMascot();

  // "Account created" stage (see created-stage.tsx).
  const fade = useSharedValue(0);
  const titleSwap = useSharedValue(0);
  const panelMaxHeight = useSharedValue(UNCLAMPED);
  const contentHeightRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);
  const schedule = useCallback((fn: () => void, at: number) => {
    timersRef.current.push(setTimeout(fn, at));
  }, []);
  const panelStyle = useAnimatedStyle(() => ({ maxHeight: panelMaxHeight.value }));
  const onContentLayout = useCallback((e: LayoutChangeEvent) => {
    contentHeightRef.current = e.nativeEvent.layout.height;
  }, []);

  const playCreatedTransition = useCallback(
    (onDone: () => void) => {
      Keyboard.dismiss();
      setConsentOpen(false);
      setPhase("created");
      schedule(() => {
        mascot.celebrate({ settle: true });
        fade.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
      }, CREATED_TIMELINE.snapAt);
      schedule(() => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        titleSwap.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
      }, CREATED_TIMELINE.titleAt);
      schedule(() => {
        // A max-height tween only shows once it dips under the natural
        // height, so start the clamp right there.
        panelMaxHeight.value = contentHeightRef.current + AUTH_CARD_PADDING_Y * 2;
        panelMaxHeight.value = withTiming(CREATED_STAGE_CARD_HEIGHT, {
          duration: CREATED_TIMELINE.collapseMs,
          easing: Easing.bezier(0.3, 0.9, 0.3, 1),
        });
      }, CREATED_TIMELINE.collapseAt);
      schedule(onDone, CREATED_TIMELINE.navigateAt);
    },
    [schedule, mascot, fade, titleSwap, panelMaxHeight],
  );

  const transit: CredentialsTransit | undefined =
    phase === "created"
      ? { fade, titleSwap, title: t("auth.accountCreatedTitle"), panelStyle }
      : undefined;

  const form = useFieldErrorsForm<SignUpForm>(
    (values) =>
      validateSignup(
        { name: values.name.trim(), email: values.email.trim(), password: values.password },
        t,
      ),
    { defaultValues: { name: "", email: "", password: "" } },
  );
  const bind = useMascotForm(mascot, form);
  const password = form.watch("password");

  // DEV-only: a unique e-mail + a valid password, so sign-up testing is one
  // tap. Stays on the screen (the user taps Sign up, then accepts).
  function fillSignupTest(): void {
    form.setValue("name", "Test User", { shouldValidate: true });
    form.setValue("email", `testuser${Date.now()}@example.com`, { shouldValidate: true });
    form.setValue("password", "TestPass123!", { shouldValidate: true });
  }

  // "Create account" only validates the fields and raises the consent gate;
  // the request is sent from `acceptAndSignup` once the user has accepted.
  const onSubmit = form.handleSubmit(
    () => setConsentOpen(true),
    () => mascot.grimace(),
  );

  async function acceptAndSignup(): Promise<void> {
    const { name, email, password: pw } = form.getValues();
    const trimmedEmail = email.trim();
    const payload = {
      name: name.trim(),
      email: trimmedEmail,
      password: pw,
      acceptedTosVersion: TOS_VERSION,
      acceptedPrivacyVersion: PRIVACY_VERSION,
    };
    await run(async () => {
      try {
        await signup(payload);
        // Signup only sets an httpOnly cookie, but mobile auth is Bearer-based
        // (preferTokens). Log in to obtain a real session: on mobile, login
        // returns a one-shot sessionExchangeId we swap for a token pair, so the
        // session survives the verify step. Without this, verify-email's
        // finishAuthentication() bootstraps with no token and bounces to
        // sign-in instead of onboarding. Wrapped so a failure still falls back
        // to the prior behavior (user can verify + sign in manually).
        try {
          const result = await login(
            trimmedEmail,
            pw,
            keep.enabled ? { keepSignedIn: keep.keepSignedIn } : undefined,
          );
          if (result.sessionExchangeId) {
            await exchangeSessionForTokens(result.sessionExchangeId);
          }
        } catch {
          // Fall through to verify-email regardless.
        }
        playCreatedTransition(() =>
          router.replace({
            pathname: "/(auth)/verify-email",
            params: { email: trimmedEmail, created: "1" },
          }),
        );
      } catch (err) {
        // Back to the form so field errors (e.g. e-mail taken) are visible.
        setConsentOpen(false);
        mascot.grimace();
        handleAuthApiError(err, {
          locale,
          t,
          toast,
          setFieldErrors: fieldErrorsSetter(form, ["name", "email", "password"]),
          fallbackKey: "auth.signupFailed",
        });
      }
    });
  }

  return (
    <CredentialsCard
      title={t("auth.signUp")}
      mascot={mascot}
      testIDPrefix="signup"
      onDevFill={fillSignupTest}
      onContentLayout={onContentLayout}
      {...(transit ? { transit } : {})}
      outside={
        <ConsentDialog
          open={consentOpen}
          onOpenChange={setConsentOpen}
          loading={submitting}
          onAccept={() => void acceptAndSignup()}
          testID="signup.consent"
        />
      }
    >
      <YStack gap={24}>
        <FormNameField
          control={form.control}
          name="name"
          testID="signup.name"
          onSubmitEditing={() => emailRef.current?.focus()}
          {...bind.text("name", "name")}
        />
        <FormEmailField
          control={form.control}
          name="email"
          testID="signup.email"
          inputRef={emailRef}
          onSubmitEditing={() => passwordRef.current?.focus()}
          {...bind.text("email", "email")}
        />
        <FormPasswordField
          control={form.control}
          name="password"
          inputRef={passwordRef}
          testID="signup.password"
          returnKeyType="next"
          isNew
          {...bind.password("password")}
        >
          <PasswordStrengthMeter password={password} {...passwordMeterLabels(t)} />
        </FormPasswordField>
      </YStack>

      {keep.enabled ? (
        <KeepSignedInRow
          checked={keep.keepSignedIn}
          onToggle={keep.toggle}
          testID="signup.keepSignedIn"
        />
      ) : null}

      <YStack marginTop={isWeb ? 30 : 26}>
        <PrimaryAction
          label={t("auth.signUp")}
          loading={submitting}
          onPress={onSubmit}
          testID="signup.submit"
        />
      </YStack>

      <FooterPrompt
        prompt={t("auth.haveAccount")}
        linkLabel={t("auth.signInInstead")}
        onPress={() => router.push(localized("/(auth)/sign-in"))}
        testID="signup.signInLink"
      />
    </CredentialsCard>
  );
}
