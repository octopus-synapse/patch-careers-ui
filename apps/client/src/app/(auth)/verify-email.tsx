/**
 * Verify-email screen (D101) — "Editorial Calm" DS, ported from the approved
 * `verify-code-demo.html`: a standalone panel holding a centred serif
 * heading, the masked e-mail as a tappable pill (use another e-mail), six
 * drawn OTP cells over one real input, an inline status line (verifying /
 * invalid / resent — no toasts), and a resend row with a countdown ring.
 *
 * Two paths into success:
 *   1. User types the 6-digit code → POST /v1/auth/verify.
 *   2. User taps the email link → `/verify-email?token=...` → auto-submit.
 *
 * Success is a TRANSIT state, not a destination: the card stays, auxiliary
 * rows quiet down, the heading crossfades to "E-mail verificado.", the six
 * cells funnel into a line-work envelope stamped with the accent seal, the
 * composition re-stacks (icon above the words) and after a 2.5s hold the app
 * routes on by itself via `finishAuthentication()`.
 *
 * The mascot perches on the card throughout, settled in its `sealed` rest:
 * its pupils follow the cells as digits land, it grimaces on a bad code and
 * beams (^ ^) as the seal stamps. Arriving from sign-up (`created=1`) the
 * screen opens on sign-up's final frame — card clamped to the stage height
 * under "Account created." — then grows the card and reveals the verify
 * content, so the character never appears to move (see `created-stage.tsx`).
 */

import { postV1AuthEmailVerificationSend, verify as verifyApi } from "@patch-careers/api-client";
import { cooldownSecondsRemaining, maskEmail } from "@patch-careers/auth";
import { Text, useEditorialPalette } from "@patch-careers/ui";
import {
  AUTH_CARD_PADDING_Y,
  AuthMascotCard,
  AuthShell,
  editorialFonts,
  useAuthMascot,
} from "@patch-careers/ui/editorial";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pencil } from "lucide-react-native";
import { type ReactElement, useCallback, useEffect, useRef, useState } from "react";
import type { LayoutChangeEvent, TextInput } from "react-native";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  Text as RNText,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { BackToSignInLink } from "@/components/auth/back-to-sign-in-link";
import { ConvergingCodeCells } from "@/components/auth/converging-code-cells";
import {
  ARRIVAL_TIMELINE,
  CREATED_STAGE_CARD_HEIGHT,
  CreatedStageTitle,
} from "@/components/auth/created-stage";
import { EditorialOtp, type EditorialOtpState } from "@/components/auth/editorial-otp";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { useCompleteAuth } from "@/components/auth/hooks/use-complete-auth";
import { useSubmit } from "@/components/auth/hooks/use-submit";
import { VerifiedSeal } from "@/components/auth/verified-seal";

const RESEND_COOLDOWN_S = 60;
const ERROR_RESET_MS = 1100;

/** The verified-state choreography, relative to the moment of success. */
const TITLE_SWAP_AT_MS = 350;
const SEAL_AT_MS = 620;
const COMPOSE_AT_MS = 1050;
const VERIFIED_HOLD_MS = 2500;
const NAVIGATE_AT_MS = 1900 + VERIFIED_HOLD_MS;

type Phase = "input" | "sealing";
type Status = "none" | "loading" | "error" | "sent";
/** Very large = no clamp; the panel keeps its natural height. */
const UNCLAMPED = 100_000;
const OTP_CELLS = 6;

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function VerifyEmailScreen(): ReactElement {
  const isWeb = Platform.OS === "web";
  const { t } = useAuthScreen();
  const { finishAuthentication } = useCompleteAuth();
  const { run } = useSubmit();
  const router = useRouter();
  const palette = useEditorialPalette();
  const params = useLocalSearchParams<{ email?: string; token?: string; created?: string }>();
  const mascot = useAuthMascot();

  const email = params.email ?? "";
  // Arriving from sign-up: open on its final "Account created." frame.
  const [arriving, setArriving] = useState(params.created === "1" && !params.token);
  // The card must already be on screen on the first frame (no fade-in), or
  // it would dip under the mascot during the route crossfade.
  const arrivedRef = useRef(arriving);
  const [code, setCode] = useState("");
  const [testCode, setTestCode] = useState<string | null>(null);
  const [lastResendAt, setLastResendAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [phase, setPhase] = useState<Phase>("input");
  const [status, setStatus] = useState<Status>("none");
  const [sealVisible, setSealVisible] = useState(false);
  const autoSubmitTokenRef = useRef(false);
  const autoSendCodeRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const otpRef = useRef<TextInput>(null);
  const contentHeightRef = useRef(0);

  const panelMaxHeight = useSharedValue(arriving ? CREATED_STAGE_CARD_HEIGHT : UNCLAMPED);
  const contentOpacity = useSharedValue(arriving ? 0 : 1);
  const stageTitleOpacity = useSharedValue(arriving ? 1 : 0);

  const titleProgress = useSharedValue(0);
  const auxOpacity = useSharedValue(1);
  const composeProgress = useSharedValue(0);
  const titleDy = useSharedValue(0);
  const codeDy = useSharedValue(0);
  const layoutsRef = useRef<{
    column?: number;
    title?: { y: number; height: number };
    code?: { y: number; height: number };
  }>({});

  const remaining = cooldownSecondsRemaining(lastResendAt, RESEND_COOLDOWN_S, now);
  const canResend = remaining === 0;

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  // Tick the cooldown only while active (avoid a perpetual interval).
  useEffect(() => {
    if (canResend || phase !== "input") return;
    const handle = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(handle);
  }, [canResend, phase]);

  const schedule = useCallback((fn: () => void, at: number) => {
    timersRef.current.push(setTimeout(fn, at));
  }, []);

  // The mascot settles in its sealed rest the moment the screen appears
  // (once: the controller identity changes with every expression).
  const sealedOnceRef = useRef(false);
  useEffect(() => {
    if (sealedOnceRef.current) return;
    sealedOnceRef.current = true;
    mascot.seal();
  }, [mascot]);

  // Arrival from sign-up: grow the card from the stage frame, then reveal.
  const arrivalStartedRef = useRef(false);
  useEffect(() => {
    if (!arriving || arrivalStartedRef.current) return;
    arrivalStartedRef.current = true;
    schedule(() => {
      const natural = contentHeightRef.current + AUTH_CARD_PADDING_Y * 2;
      panelMaxHeight.value = withTiming(natural > 0 ? natural : UNCLAMPED, {
        duration: ARRIVAL_TIMELINE.growMs,
        easing: Easing.bezier(0.3, 0.9, 0.3, 1),
      });
      stageTitleOpacity.value = withTiming(0, { duration: 300 });
    }, ARRIVAL_TIMELINE.growAt);
    schedule(() => {
      contentOpacity.value = withTiming(1, {
        duration: ARRIVAL_TIMELINE.revealMs,
        easing: Easing.out(Easing.cubic),
      });
    }, ARRIVAL_TIMELINE.revealAt);
    schedule(() => {
      panelMaxHeight.value = UNCLAMPED;
      setArriving(false);
      otpRef.current?.focus();
    }, ARRIVAL_TIMELINE.done);
  }, [arriving, schedule, panelMaxHeight, stageTitleOpacity, contentOpacity]);

  // Pupils follow the cells as digits land.
  useEffect(() => {
    if (phase !== "input") return;
    mascot.lookAt(code.length === 0 ? 0 : Math.min(1, (code.length - 0.5) / OTP_CELLS), 8);
  }, [code.length, phase, mascot]);

  const playVerifiedTransition = useCallback(() => {
    Keyboard.dismiss();
    setPhase("sealing");
    setStatus("none");
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    mascot.lookAt(0.5, 4);
    titleProgress.value = withDelay(
      TITLE_SWAP_AT_MS,
      withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) }),
    );
    auxOpacity.value = withTiming(0, { duration: 250 });
    // Deep-link verifications never typed a code — skip the funnel.
    schedule(
      () => {
        setSealVisible(true);
        mascot.beam();
      },
      code.length > 0 ? SEAL_AT_MS : TITLE_SWAP_AT_MS,
    );
    // Re-stack via transforms only — every row stays mounted (opacity 0), so
    // the card never changes height and nothing reflows mid-flight. The
    // envelope glides up and the heading glides down until they meet as a
    // centred stack, exactly like the approved demo.
    schedule(() => {
      const layouts = layoutsRef.current;
      if (layouts.column && layouts.title && layouts.code) {
        // the seal overhangs 18px below the envelope — leave room for it
        const gap = 30;
        const stackHeight = layouts.code.height + gap + layouts.title.height;
        const center = layouts.column / 2;
        const codeTargetCenter = center - stackHeight / 2 + layouts.code.height / 2;
        const titleTargetCenter = center + stackHeight / 2 - layouts.title.height / 2;
        codeDy.value = codeTargetCenter - (layouts.code.y + layouts.code.height / 2);
        titleDy.value = titleTargetCenter - (layouts.title.y + layouts.title.height / 2);
      }
      composeProgress.value = withTiming(1, {
        duration: 650,
        easing: Easing.bezier(0.3, 0.9, 0.3, 1),
      });
    }, COMPOSE_AT_MS);
    schedule(() => void finishAuthentication(), NAVIGATE_AT_MS);
  }, [
    code.length,
    finishAuthentication,
    mascot,
    titleProgress,
    auxOpacity,
    composeProgress,
    titleDy,
    codeDy,
    schedule,
  ]);

  const submitToken = useCallback(
    async (token: string) => {
      await run(async () => {
        setStatus("loading");
        try {
          await verifyApi({ token });
          playVerifiedTransition();
        } catch {
          setStatus("error");
          mascot.grimace();
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          schedule(() => {
            setCode("");
            setStatus("none");
            mascot.seal();
          }, ERROR_RESET_MS);
        }
      });
    },
    [run, playVerifiedTransition, schedule, mascot],
  );

  // The sixth digit IS the submit — mirror of the demo's auto-submit.
  useEffect(() => {
    if (phase !== "input" || status !== "none" || code.length !== 6) return;
    const handle = setTimeout(() => void submitToken(code), 200);
    return () => clearTimeout(handle);
  }, [code, phase, status, submitToken]);

  // Auto-submit when the deep-link path provides a token directly.
  useEffect(() => {
    if (autoSubmitTokenRef.current) return;
    const token = params.token;
    if (token && token.length > 0) {
      autoSubmitTokenRef.current = true;
      void submitToken(token);
    }
  }, [params.token, submitToken]);

  const requestVerificationCode = useCallback(
    async (announce: boolean) => {
      if (!canResend) return;
      setLastResendAt(Date.now());
      setCode("");
      try {
        const response = await postV1AuthEmailVerificationSend();
        setTestCode(response.testCode ?? null);
        if (announce) setStatus("sent");
      } catch {
        setTestCode(null);
        // Ignore — user can retry after cooldown.
      }
    },
    [canResend],
  );

  // Landing here after sign-up triggers the first verification email.
  useEffect(() => {
    if (autoSendCodeRef.current || params.token) return;
    autoSendCodeRef.current = true;
    void requestVerificationCode(false);
  }, [params.token, requestVerificationCode]);

  const verifyTitleStyle = useAnimatedStyle(() => ({
    opacity: 1 - titleProgress.value,
    transform: [{ translateY: -10 * titleProgress.value }],
  }));
  const verifiedTitleStyle = useAnimatedStyle(() => ({
    opacity: titleProgress.value,
    transform: [{ translateY: 12 * (1 - titleProgress.value) }],
  }));
  const auxStyle = useAnimatedStyle(() => ({ opacity: auxOpacity.value }));
  const titleGlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: titleDy.value * composeProgress.value }],
  }));
  const codeGlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: codeDy.value * composeProgress.value }],
  }));
  const panelStyle = useAnimatedStyle(() => ({ maxHeight: panelMaxHeight.value }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));
  const stageTitleStyle = useAnimatedStyle(() => ({ opacity: stageTitleOpacity.value }));

  const otpState: EditorialOtpState =
    phase !== "input"
      ? "done"
      : status === "loading"
        ? "loading"
        : status === "error"
          ? "error"
          : "idle";

  const statusMessage =
    status === "loading"
      ? t("auth.verifyChecking")
      : status === "error"
        ? t("auth.verifyInvalidToken")
        : status === "sent"
          ? t("auth.verifyCodeResent")
          : "";

  const captureLayout = (slot: "title" | "code") => (e: LayoutChangeEvent) => {
    const { y, height } = e.nativeEvent.layout;
    layoutsRef.current[slot] = { y, height };
  };

  const titleBlock = (
    <Animated.View
      key="title"
      onLayout={captureLayout("title")}
      style={[styles.titleSlot, titleGlideStyle]}
    >
      <Animated.View style={verifyTitleStyle}>
        <RNText style={[styles.title, { color: palette.ink }]}>{t("auth.verifyTitle")}</RNText>
      </Animated.View>
      <Animated.View style={[styles.verifiedOverlay, verifiedTitleStyle]} pointerEvents="none">
        <RNText style={[styles.title, { color: palette.ink }]}>{t("auth.verifiedTitle")}</RNText>
      </Animated.View>
    </Animated.View>
  );

  const codeSlot = (
    <Animated.View
      key="code"
      onLayout={captureLayout("code")}
      style={[styles.codeSlot, codeGlideStyle]}
    >
      {phase === "input" ? (
        <EditorialOtp
          value={code}
          onChangeText={(next) => {
            setCode(next);
            if (status === "sent" || status === "error") setStatus("none");
          }}
          state={otpState}
          accessibilityLabel={t("auth.verifyCodeLabel")}
          autoFocus={!arriving}
          inputRef={otpRef}
          testID="verify.code"
        />
      ) : (
        <>
          {code.length > 0 ? <ConvergingCodeCells digits={code} /> : null}
          {sealVisible ? (
            <View style={styles.sealOverlay} pointerEvents="none">
              <VerifiedSeal />
            </View>
          ) : null}
        </>
      )}
    </Animated.View>
  );

  return (
    <AuthShell
      variant="card"
      {...(isWeb && phase === "input" && !arriving
        ? { corner: <BackToSignInLink variant="corner" testID="verify.backToSignIn" /> }
        : {})}
    >
      <AuthMascotCard
        mascot={mascot}
        animateIn={!arrivedRef.current}
        panelStyle={panelStyle}
        onContentLayout={(e) => {
          contentHeightRef.current = e.nativeEvent.layout.height;
        }}
        below={
          isWeb ? undefined : (
            <Animated.View
              style={[styles.backRow, auxStyle, contentStyle]}
              pointerEvents={phase === "input" && !arriving ? "auto" : "none"}
            >
              <BackToSignInLink testID="verify.backToSignIn" />
            </Animated.View>
          )
        }
      >
        {arriving ? (
          <CreatedStageTitle title={t("auth.accountCreatedTitle")} style={stageTitleStyle} />
        ) : null}
        <Animated.View
          style={[styles.column, contentStyle]}
          pointerEvents={phase === "input" && !arriving ? "auto" : "none"}
          onLayout={(e) => {
            layoutsRef.current.column = e.nativeEvent.layout.height;
          }}
        >
          {titleBlock}
          <Animated.View style={auxStyle}>
            <RNText style={[styles.subtitle, { color: palette.muted }]}>
              {t("auth.verifyIntroShort")}
            </RNText>
          </Animated.View>
          <Animated.View style={auxStyle}>
            <Pressable
              onPress={() => router.back()}
              disabled={phase !== "input"}
              accessibilityRole="button"
              accessibilityLabel={t("auth.verifyChangeEmail")}
              style={[
                styles.mailChip,
                { borderColor: palette.hairline, backgroundColor: palette.surface },
              ]}
              testID="verify.changeEmail"
            >
              <RNText style={[styles.mailChipText, { color: palette.body }]}>
                {email ? maskEmail(email) : ""}
              </RNText>
              <Pencil size={11} color={palette.muted} />
            </Pressable>
          </Animated.View>
          {codeSlot}
          <Animated.View style={[styles.statusRow, auxStyle]}>
            {status === "loading" ? <ActivityIndicator size="small" color={palette.muted} /> : null}
            {statusMessage ? (
              <RNText
                style={[
                  styles.statusText,
                  { color: status === "error" ? palette.danger : palette.muted },
                ]}
                accessibilityLiveRegion="polite"
              >
                {statusMessage}
              </RNText>
            ) : null}
          </Animated.View>
          <Animated.View style={[styles.resendRow, auxStyle]}>
            {canResend ? (
              <>
                <RNText style={[styles.resendPrefix, { color: palette.muted }]}>
                  {t("auth.verifyNotReceived")}
                </RNText>
                <Pressable
                  onPress={() => void requestVerificationCode(true)}
                  disabled={phase !== "input"}
                  accessibilityRole="button"
                  testID="verify.resend"
                >
                  <RNText style={[styles.resendLink, { color: palette.accent }]}>
                    {t("auth.verifyResend")}
                  </RNText>
                </Pressable>
              </>
            ) : (
              <>
                <CountdownRing
                  remaining={remaining}
                  total={RESEND_COOLDOWN_S}
                  trackColor={palette.hairline}
                  headColor={palette.subtle}
                />
                <RNText style={[styles.resendPrefix, { color: palette.muted }]}>
                  {t("auth.verifyResendPrefix")}
                </RNText>
                <RNText style={[styles.resendClock, { color: palette.subtle }]}>
                  {mmss(remaining)}
                </RNText>
              </>
            )}
          </Animated.View>
          {testCode ? (
            <Animated.View style={auxStyle}>
              <Text preset="caption" color="$gray10" textAlign="center" testID="verify.testCode">
                {t("app.verifyEmail.testCodeSent", { code: testCode })}
              </Text>
            </Animated.View>
          ) : null}
        </Animated.View>
      </AuthMascotCard>
    </AuthShell>
  );
}

function CountdownRing({
  remaining,
  total,
  trackColor,
  headColor,
}: {
  remaining: number;
  total: number;
  trackColor: string;
  headColor: string;
}): ReactElement {
  const C = 2 * Math.PI * 6;
  return (
    <Svg width={14} height={14} viewBox="0 0 16 16" style={styles.ring}>
      <Circle cx={8} cy={8} r={6} fill="none" stroke={trackColor} strokeWidth={2} />
      <Circle
        cx={8}
        cy={8}
        r={6}
        fill="none"
        stroke={headColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={C * (1 - remaining / total)}
      />
    </Svg>
  );
}

// @style-allow stylesheet: Reanimated choreography (layout transitions + animated styles need plain style objects)
const styles = StyleSheet.create({
  column: {
    gap: 14,
    paddingVertical: 22,
  },
  titleSlot: {
    alignSelf: "stretch",
  },
  title: {
    fontFamily: editorialFonts.serif,
    fontSize: 28,
    lineHeight: 33,
    letterSpacing: -0.4,
    textAlign: "center",
  },
  verifiedOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
  },
  subtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
  },
  mailChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  mailChipText: {
    fontFamily: editorialFonts.mono,
    fontSize: 11.5,
  },
  codeSlot: {
    minHeight: 96,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  sealOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  statusRow: {
    height: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  statusText: {
    fontSize: 12.5,
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 24,
  },
  resendPrefix: {
    fontSize: 13,
  },
  resendLink: {
    fontSize: 13,
    fontWeight: "600",
    padding: 4,
  },
  resendClock: {
    fontFamily: editorialFonts.mono,
    fontSize: 12.5,
  },
  ring: {
    transform: [{ rotate: "-90deg" }],
  },
  backRow: {
    marginTop: 18,
    alignItems: "center",
  },
});
