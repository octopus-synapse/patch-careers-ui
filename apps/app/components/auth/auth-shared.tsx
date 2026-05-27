/**
 * Auth design system — "Editorial Calm" aesthetic.
 *
 * Design POV: refined, restrained, confident in whitespace. Serif italic
 * display (Georgia) paired with tracked uppercase eyebrow labels. Inputs
 * are hairline-underlined, not boxed. The blue brand color is used
 * sparingly (focus rings + links + accent dot only) — the primary CTA
 * is deep ink for a more sophisticated read. A tiny SVG monogram with
 * accent dot reads as an editorial badge. Stagger-reveal animations on
 * mount add a calm, deliberate feel.
 *
 * Inspirations: NYT reader, Linear's quiet sophistication, Apple's
 * marketing pages. Anti-clichés: no gradient orbs, no centered card
 * floating in void, no Inter/Roboto.
 *
 * Stack: pure React Native View + StyleSheet (no Tamagui Stack).
 * Reanimated 4 for entering animations + focus underline grow.
 * react-native-svg for the brand monogram.
 */

import { AntDesign } from "@expo/vector-icons";
import { Link, type Href } from "expo-router";
import { ArrowRight, Check, Eye, EyeOff } from "lucide-react-native";
import {
  type ComponentRef,
  forwardRef,
  type ReactElement,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  type KeyboardTypeOptions,
  KeyboardAvoidingView,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  type ReturnKeyTypeOptions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text as RNText,
  TextInput,
  type TextInputSubmitEditingEventData,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Rect } from "react-native-svg";

// ────────────────────────────────────────────────────────────
// Design tokens (local to auth screens — overrides app theme)
// ────────────────────────────────────────────────────────────

export const authTokens = {
  bg: "#FAFAF6", // warm paper
  surface: "#FFFFFF",
  ink: "#0A0A0A",
  body: "#3F3F46",
  muted: "#71717A",
  subtle: "#A1A1AA",
  hairline: "#E4E4E7",
  hairlineStrong: "#D4D4D8",
  accent: "#2563EB",
  accentDeep: "#1D4ED8",
  primary: "#0F172A", // CTA fill — deep ink, more sophisticated than bright blue
  primaryPress: "#1E293B",
  danger: "#DC2626",
  success: "#16A34A",
  warn: "#D97706",
  fair: "#EAB308",
} as const;

const PressableAnimated = Animated.createAnimatedComponent(Pressable);

const fonts = {
  serif: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" }),
  sans: Platform.select({
    ios: "-apple-system",
    android: "sans-serif",
    default: "system-ui",
  }),
  mono: Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "ui-monospace",
  }),
} as const;

// ────────────────────────────────────────────────────────────
// BrandMark — small SVG monogram with editorial accent dot
// ────────────────────────────────────────────────────────────

export function BrandMark({ size = 28 }: { size?: number }): ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Rect x={0} y={0} width={22} height={22} rx={5} fill={authTokens.primary} />
      <Rect
        x={6}
        y={5}
        width={4}
        height={12}
        rx={1}
        fill={authTokens.surface}
      />
      <Rect
        x={10}
        y={5}
        width={6}
        height={4}
        rx={1}
        fill={authTokens.surface}
      />
      <Rect
        x={10}
        y={9}
        width={6}
        height={3}
        rx={1}
        fill={authTokens.surface}
      />
      <Circle cx={24.5} cy={24.5} r={3} fill={authTokens.accent} />
    </Svg>
  );
}

// ────────────────────────────────────────────────────────────
// Wordmark — typographic "Patch · Careers" (italic serif + tracked)
// ────────────────────────────────────────────────────────────

export function Wordmark(): ReactElement {
  return (
    <View style={wordmarkStyles.row}>
      <RNText style={wordmarkStyles.patch}>Patch</RNText>
      <View style={wordmarkStyles.sepDot} />
      <RNText style={wordmarkStyles.careers}>CAREERS</RNText>
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// AuthShell — full-screen scaffold with masthead + safe area
// ────────────────────────────────────────────────────────────

export function AuthShell({ children }: { children: ReactNode }): ReactElement {
  const insets = useSafeAreaInsets();
  return (
    <View style={shellStyles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={authTokens.bg} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={shellStyles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            shellStyles.scroll,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Masthead — tiny editorial flourish at the top edge */}
          <Animated.View
            entering={FadeIn.duration(400)}
            style={shellStyles.masthead}
          >
            <View style={shellStyles.mastheadLeft}>
              <BrandMark size={22} />
            </View>
            <RNText style={shellStyles.mastheadRight}>EST · 2025</RNText>
          </Animated.View>

          {/* Form column — left-aligned, generous whitespace */}
          <View style={shellStyles.column}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// DisplayHeading — large serif italic + optional emphasis word
// ────────────────────────────────────────────────────────────

export function DisplayHeading({
  prefix,
  emphasis,
  suffix,
}: {
  prefix?: string;
  emphasis: string;
  suffix?: string;
}): ReactElement {
  return (
    <Animated.View entering={FadeInDown.delay(100).duration(600).easing(Easing.out(Easing.cubic))}>
      <RNText style={headingStyles.line}>
        {prefix ? <RNText style={headingStyles.regular}>{prefix}</RNText> : null}
        <RNText style={headingStyles.italic}>{emphasis}</RNText>
        {suffix ? <RNText style={headingStyles.regular}>{suffix}</RNText> : null}
      </RNText>
    </Animated.View>
  );
}

// ────────────────────────────────────────────────────────────
// SubtitleLine — muted body text below heading
// ────────────────────────────────────────────────────────────

export function SubtitleLine({ children }: { children: ReactNode }): ReactElement {
  return (
    <Animated.View entering={FadeInDown.delay(200).duration(600).easing(Easing.out(Easing.cubic))}>
      <RNText style={headingStyles.subtitle}>{children}</RNText>
    </Animated.View>
  );
}

// ────────────────────────────────────────────────────────────
// EditorialLabel — tiny uppercase tracked label
// ────────────────────────────────────────────────────────────

function EditorialLabel({
  children,
  error,
}: {
  children: ReactNode;
  error?: boolean;
}): ReactElement {
  return (
    <RNText
      style={[labelStyles.label, error ? labelStyles.labelError : labelStyles.labelNormal]}
    >
      {children}
    </RNText>
  );
}

// ────────────────────────────────────────────────────────────
// UnderlineInput — hairline-bottom input with animated focus underline
// ────────────────────────────────────────────────────────────

export type UnderlineInputProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  testID?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: "email" | "password" | "new-password" | "username" | "name" | "off";
  textContentType?:
    | "emailAddress"
    | "password"
    | "newPassword"
    | "username"
    | "name"
    | "oneTimeCode";
  autoCorrect?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: (
    e: NativeSyntheticEvent<TextInputSubmitEditingEventData>,
  ) => void;
  blurOnSubmit?: boolean;
  secureTextEntry?: boolean;
  editable?: boolean;
  hasError?: boolean;
  /** Slot for an action icon at the right edge of the input row. */
  rightSlot?: ReactNode;
};

export const UnderlineInput = forwardRef<TextInput, UnderlineInputProps>(
  ({ label, value, onChangeText, hasError = false, rightSlot, testID, ...rest }, ref): ReactElement => {
    const [focused, setFocused] = useState(false);
    const progress = useSharedValue(0);

    useEffect(() => {
      progress.value = withTiming(focused ? 1 : 0, {
        duration: 280,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
    }, [focused, progress]);

    const underlineStyle = useAnimatedStyle(() => ({
      transform: [{ scaleX: progress.value }],
      backgroundColor: hasError ? authTokens.danger : authTokens.accent,
    }));

    return (
      <View style={underlineStyles.wrapper}>
        <EditorialLabel error={hasError}>{label}</EditorialLabel>
        <View style={underlineStyles.inputRow}>
          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            style={underlineStyles.input}
            placeholderTextColor={authTokens.subtle}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            selectionColor={authTokens.accent}
            cursorColor={authTokens.accent}
            {...(testID ? { testID } : {})}
            {...rest}
          />
          {rightSlot ? <View style={underlineStyles.rightSlot}>{rightSlot}</View> : null}
        </View>
        <View
          style={[
            underlineStyles.hairline,
            { backgroundColor: hasError ? authTokens.danger : authTokens.hairlineStrong },
          ]}
        />
        <Animated.View style={[underlineStyles.focusLine, underlineStyle]} />
      </View>
    );
  },
);
UnderlineInput.displayName = "UnderlineInput";

// ────────────────────────────────────────────────────────────
// PasswordInput — UnderlineInput + eye toggle slot
// ────────────────────────────────────────────────────────────

export type PasswordInputProps = Omit<
  UnderlineInputProps,
  "secureTextEntry" | "rightSlot" | "autoComplete" | "textContentType"
> & {
  showLabel: string;
  hideLabel: string;
  /** Use "new-password" / "newPassword" for sign-up flows; defaults to "password". */
  isNew?: boolean;
};

export const PasswordInput = forwardRef<TextInput, PasswordInputProps>(
  ({ showLabel, hideLabel, isNew = false, ...rest }, ref): ReactElement => {
    const [show, setShow] = useState(false);
    return (
      <UnderlineInput
        ref={ref}
        {...rest}
        secureTextEntry={!show}
        autoComplete={isNew ? "new-password" : "password"}
        textContentType={isNew ? "newPassword" : "password"}
        autoCorrect={false}
        rightSlot={
          <Pressable
            onPress={() => setShow((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={show ? hideLabel : showLabel}
            hitSlop={10}
            style={({ pressed }) => [
              underlineStyles.eyeButton,
              pressed && { opacity: 0.5 },
            ]}
            testID="auth.passwordToggle"
          >
            {show ? (
              <EyeOff size={18} color={authTokens.muted} strokeWidth={1.5} />
            ) : (
              <Eye size={18} color={authTokens.muted} strokeWidth={1.5} />
            )}
          </Pressable>
        }
      />
    );
  },
);
PasswordInput.displayName = "PasswordInput";

// ────────────────────────────────────────────────────────────
// FieldError — small danger text below an input
// ────────────────────────────────────────────────────────────

export function FieldError({ text }: { text: string }): ReactElement {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={fieldErrorStyles.wrapper}>
      <RNText style={fieldErrorStyles.text}>{text}</RNText>
    </Animated.View>
  );
}

// ────────────────────────────────────────────────────────────
// InlineLink — right-aligned subtle link (e.g. "Forgot password?")
// ────────────────────────────────────────────────────────────

export function InlineLink({
  label,
  href,
  align = "right",
  testID,
}: {
  label: string;
  href: Href;
  align?: "left" | "right";
  testID?: string;
}): ReactElement {
  return (
    <View
      style={[
        inlineLinkStyles.wrapper,
        align === "right" ? inlineLinkStyles.right : inlineLinkStyles.left,
      ]}
    >
      <Link href={href} accessibilityRole="link" {...(testID ? { testID } : {})}>
        <RNText style={inlineLinkStyles.text}>{label}</RNText>
      </Link>
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// PrimaryAction — deep-ink filled pill with arrow that nudges on press
// ────────────────────────────────────────────────────────────

export type PrimaryActionProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
};

export function PrimaryAction({
  label,
  onPress,
  loading = false,
  disabled = false,
  testID,
}: PrimaryActionProps): ReactElement {
  const scale = useSharedValue(1);
  const arrowX = useSharedValue(0);
  const inactive = loading || disabled;

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowX.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(450).duration(600).easing(Easing.out(Easing.cubic))}
    >
      <PressableAnimated
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: inactive, busy: loading }}
        disabled={inactive}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.985, { duration: 80 });
          arrowX.value = withTiming(3, { duration: 120 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 140 });
          arrowX.value = withTiming(0, { duration: 180 });
        }}
        style={[primaryStyles.button, inactive && primaryStyles.buttonInactive, containerStyle]}
        {...(testID ? { testID } : {})}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <RNText style={primaryStyles.label}>{label}</RNText>
            <Animated.View style={arrowStyle}>
              <ArrowRight size={18} color="#FFFFFF" strokeWidth={1.75} />
            </Animated.View>
          </>
        )}
      </PressableAnimated>
    </Animated.View>
  );
}

// ────────────────────────────────────────────────────────────
// OrDivider — "or continue with" centered between hairlines
// ────────────────────────────────────────────────────────────

export function OrDivider({ text }: { text: string }): ReactElement {
  return (
    <Animated.View
      entering={FadeIn.delay(600).duration(500)}
      style={dividerStyles.row}
    >
      <View style={dividerStyles.line} />
      <RNText style={dividerStyles.text}>{text}</RNText>
      <View style={dividerStyles.line} />
    </Animated.View>
  );
}

// ────────────────────────────────────────────────────────────
// OAuthButton — ghost outlined with brand icon + label
// ────────────────────────────────────────────────────────────

export type OAuthBrand = "github" | "linkedin";

const BRAND_ICON: Record<OAuthBrand, keyof typeof AntDesign.glyphMap> = {
  github: "github",
  linkedin: "linkedin",
};

export type OAuthButtonProps = {
  brand: OAuthBrand;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
};

export function OAuthButton({
  brand,
  label,
  onPress,
  disabled = false,
  testID,
}: OAuthButtonProps): ReactElement {
  const delay = brand === "github" ? 700 : 800;
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500).easing(Easing.out(Easing.cubic))}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          oauthStyles.button,
          pressed && oauthStyles.buttonPressed,
          disabled && oauthStyles.buttonDisabled,
        ]}
        {...(testID ? { testID } : {})}
      >
        <AntDesign name={BRAND_ICON[brand]} size={18} color={authTokens.ink} />
        <RNText style={oauthStyles.label}>{label}</RNText>
      </Pressable>
    </Animated.View>
  );
}

// ────────────────────────────────────────────────────────────
// FooterPrompt — alternate-action link at the bottom
// ────────────────────────────────────────────────────────────

export function FooterPrompt({
  prompt,
  linkLabel,
  href,
  testID,
}: {
  prompt: string;
  linkLabel: string;
  href: Href;
  testID?: string;
}): ReactElement {
  return (
    <Animated.View
      entering={FadeIn.delay(900).duration(500)}
      style={footerStyles.wrapper}
    >
      <RNText style={footerStyles.prompt}>{prompt} </RNText>
      <Link href={href} accessibilityRole="link" {...(testID ? { testID } : {})}>
        <RNText style={footerStyles.link}>{linkLabel} →</RNText>
      </Link>
    </Animated.View>
  );
}

// ────────────────────────────────────────────────────────────
// PasswordStrengthMeter — 4 segments + hint label, animated widths
// ────────────────────────────────────────────────────────────

export type PasswordStrengthScore = 0 | 1 | 2 | 3 | 4;

export function scorePassword(password: string): PasswordStrengthScore {
  if (!password) return 0;
  let s = 0;
  if (password.length >= 8) s += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s += 1;
  if (/\d/.test(password)) s += 1;
  if (/[^A-Za-z0-9]/.test(password)) s += 1;
  if (password.length < 6) return 0;
  return Math.min(s, 4) as PasswordStrengthScore;
}

const STRENGTH_LABEL: Record<PasswordStrengthScore, string> = {
  0: "—",
  1: "Weak",
  2: "Fair",
  3: "Good",
  4: "Strong",
};

const STRENGTH_COLOR: Record<PasswordStrengthScore, string> = {
  0: authTokens.hairline,
  1: authTokens.danger,
  2: authTokens.warn,
  3: authTokens.fair,
  4: authTokens.success,
};

export function PasswordStrengthMeter({
  password,
  hints,
}: {
  password: string;
  hints?: { length: string; case: string; digit: string; symbol: string };
}): ReactElement {
  const score = scorePassword(password);
  const color = STRENGTH_COLOR[score];
  const label = STRENGTH_LABEL[score];

  const checks = [
    { ok: password.length >= 8, label: hints?.length ?? "8+ chars" },
    {
      ok: /[A-Z]/.test(password) && /[a-z]/.test(password),
      label: hints?.case ?? "Aa",
    },
    { ok: /\d/.test(password), label: hints?.digit ?? "0-9" },
    { ok: /[^A-Za-z0-9]/.test(password), label: hints?.symbol ?? "Symbol" },
  ];

  return (
    <View style={meterStyles.wrapper}>
      <View style={meterStyles.segmentsRow}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={meterStyles.segmentTrack}>
            <View
              style={[
                meterStyles.segmentFill,
                {
                  backgroundColor: i < score ? color : "transparent",
                },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={meterStyles.metaRow}>
        <RNText style={[meterStyles.scoreLabel, { color: score > 0 ? color : authTokens.subtle }]}>
          {label}
        </RNText>
        <View style={meterStyles.checksRow}>
          {checks.map((c) => (
            <View key={c.label} style={meterStyles.checkChip}>
              <View
                style={[
                  meterStyles.checkDot,
                  { backgroundColor: c.ok ? authTokens.success : authTokens.hairline },
                ]}
              />
              <RNText
                style={[
                  meterStyles.checkLabel,
                  c.ok ? meterStyles.checkLabelOk : meterStyles.checkLabelMuted,
                ]}
              >
                {c.label}
              </RNText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// ConsentCheckbox — square checkbox + inline link text
// ────────────────────────────────────────────────────────────

export type ConsentCheckboxProps = {
  checked: boolean;
  onToggle: () => void;
  intro: string;
  termsLabel: string;
  termsHref: Href;
  conjunction: string;
  privacyLabel: string;
  privacyHref: Href;
  error?: string;
  testID?: string;
};

export function ConsentCheckbox({
  checked,
  onToggle,
  intro,
  termsLabel,
  termsHref,
  conjunction,
  privacyLabel,
  privacyHref,
  error,
  testID,
}: ConsentCheckboxProps): ReactElement {
  return (
    <Animated.View entering={FadeInDown.delay(350).duration(500).easing(Easing.out(Easing.cubic))}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        style={consentStyles.row}
        {...(testID ? { testID } : {})}
      >
        <View
          style={[
            consentStyles.box,
            checked && consentStyles.boxChecked,
            error && !checked && consentStyles.boxError,
          ]}
        >
          {checked ? <Check size={12} color="#FFFFFF" strokeWidth={3} /> : null}
        </View>
        <View style={consentStyles.textColumn}>
          <RNText style={consentStyles.intro}>
            {intro}{" "}
            <Link href={termsHref} accessibilityRole="link">
              <RNText style={consentStyles.link}>{termsLabel}</RNText>
            </Link>
            <RNText>{` ${conjunction} `}</RNText>
            <Link href={privacyHref} accessibilityRole="link">
              <RNText style={consentStyles.link}>{privacyLabel}</RNText>
            </Link>
            .
          </RNText>
          {error ? <RNText style={consentStyles.error}>{error}</RNText> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ────────────────────────────────────────────────────────────
// AnimatedField — wraps any form field block with stagger entering
// (use for groups: <label + input + error>)
// ────────────────────────────────────────────────────────────

export function AnimatedField({
  delay,
  children,
}: {
  delay: number;
  children: ReactNode;
}): ReactElement {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500).easing(Easing.out(Easing.cubic))}>
      {children}
    </Animated.View>
  );
}

// ────────────────────────────────────────────────────────────
// IntroBlock — brand row + headline + subtitle, stacked
// ────────────────────────────────────────────────────────────

export function IntroBlock({
  prefix,
  emphasis,
  suffix,
  subtitle,
}: {
  prefix?: string;
  emphasis: string;
  suffix?: string;
  subtitle: ReactNode;
}): ReactElement {
  return (
    <View style={introStyles.wrapper}>
      <Animated.View entering={FadeIn.duration(500)}>
        <Wordmark />
      </Animated.View>
      <View style={introStyles.headingBlock}>
        <DisplayHeading
          {...(prefix ? { prefix } : {})}
          emphasis={emphasis}
          {...(suffix ? { suffix } : {})}
        />
        <SubtitleLine>{subtitle}</SubtitleLine>
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────
// types
// ────────────────────────────────────────────────────────────

export type AuthTextInputRef = ComponentRef<typeof TextInput>;

// ────────────────────────────────────────────────────────────
// styles
// ────────────────────────────────────────────────────────────

const shellStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: authTokens.bg },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
  },
  masthead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 56,
  },
  mastheadLeft: { flexDirection: "row", alignItems: "center" },
  mastheadRight: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.8,
    color: authTokens.subtle,
  },
  column: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
});

const wordmarkStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  patch: {
    fontFamily: fonts.serif,
    fontStyle: "italic",
    fontSize: 18,
    color: authTokens.ink,
    fontWeight: "400",
  },
  sepDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: authTokens.muted,
  },
  careers: {
    fontFamily: fonts.sans,
    fontSize: 11,
    letterSpacing: 2,
    color: authTokens.muted,
    fontWeight: "600",
  },
});

const introStyles = StyleSheet.create({
  wrapper: { marginBottom: 36 },
  headingBlock: { marginTop: 28, gap: 14 },
});

const headingStyles = StyleSheet.create({
  line: {
    fontFamily: fonts.serif,
    fontSize: 38,
    lineHeight: 44,
    color: authTokens.ink,
    letterSpacing: -0.8,
    fontWeight: "400",
  },
  regular: { fontStyle: "normal" },
  italic: { fontStyle: "italic" },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: authTokens.body,
    maxWidth: 340,
  },
});

const labelStyles = StyleSheet.create({
  label: {
    fontFamily: fonts.sans,
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  labelNormal: { color: authTokens.muted },
  labelError: { color: authTokens.danger },
});

const underlineStyles = StyleSheet.create({
  wrapper: { paddingTop: 4 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
  },
  input: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 18,
    color: authTokens.ink,
    paddingVertical: 8,
    paddingHorizontal: 0,
    // Remove default RN input outline on web
    ...Platform.select({
      web: {
        outlineStyle: "none" as unknown as undefined,
      },
      default: {},
    }),
  },
  rightSlot: { paddingLeft: 8 },
  eyeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  hairline: {
    height: 1,
    width: "100%",
  },
  focusLine: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1.5,
    transformOrigin: "left center",
  },
});

const fieldErrorStyles = StyleSheet.create({
  wrapper: { marginTop: 8 },
  text: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: authTokens.danger,
    letterSpacing: 0.4,
  },
});

const inlineLinkStyles = StyleSheet.create({
  wrapper: { marginTop: 12 },
  right: { alignItems: "flex-end" },
  left: { alignItems: "flex-start" },
  text: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: authTokens.accent,
    fontWeight: "500",
    textDecorationLine: "underline",
    textDecorationStyle: "solid",
    textDecorationColor: authTokens.accent,
  },
});

const primaryStyles = StyleSheet.create({
  button: {
    backgroundColor: authTokens.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minHeight: 54,
    shadowColor: authTokens.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 3,
  },
  buttonInactive: { opacity: 0.55 },
  label: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});

const dividerStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginVertical: 28,
  },
  line: { flex: 1, height: 1, backgroundColor: authTokens.hairline },
  text: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: authTokens.muted,
    letterSpacing: 1.8,
    fontWeight: "500",
    textTransform: "uppercase",
  },
});

const oauthStyles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: authTokens.hairlineStrong,
    borderRadius: 999,
    backgroundColor: authTokens.surface,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 50,
    marginBottom: 10,
  },
  buttonPressed: {
    backgroundColor: authTokens.hairline,
    borderColor: authTokens.muted,
  },
  buttonDisabled: { opacity: 0.5 },
  label: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: authTokens.ink,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
});

const footerStyles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 36,
  },
  prompt: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: authTokens.muted,
  },
  link: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: authTokens.ink,
    fontWeight: "600",
  },
});

const meterStyles = StyleSheet.create({
  wrapper: { marginTop: 14, gap: 10 },
  segmentsRow: {
    flexDirection: "row",
    gap: 4,
  },
  segmentTrack: {
    flex: 1,
    height: 3,
    backgroundColor: authTokens.hairline,
    borderRadius: 2,
    overflow: "hidden",
  },
  segmentFill: { flex: 1, borderRadius: 2 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  scoreLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  checksRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  checkChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  checkDot: { width: 5, height: 5, borderRadius: 3 },
  checkLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  checkLabelOk: { color: authTokens.body },
  checkLabelMuted: { color: authTokens.subtle },
});

const consentStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 8,
  },
  box: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: authTokens.hairlineStrong,
    backgroundColor: authTokens.surface,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  boxChecked: {
    backgroundColor: authTokens.primary,
    borderColor: authTokens.primary,
  },
  boxError: { borderColor: authTokens.danger },
  textColumn: { flex: 1 },
  intro: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: authTokens.body,
    lineHeight: 20,
  },
  link: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: authTokens.accent,
    fontWeight: "500",
    textDecorationLine: "underline",
    textDecorationColor: authTokens.accent,
  },
  error: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: authTokens.danger,
    marginTop: 6,
    letterSpacing: 0.4,
  },
});

// Export the InlineLink for screens that want a custom-positioned link
export { EditorialLabel };
