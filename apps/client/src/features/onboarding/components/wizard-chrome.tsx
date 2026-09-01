/**
 * Onboarding wizard chrome — the presentational frame around each step:
 * masthead/progress, step heading, the loading/error centered state, the
 * body scrollbar, and the resume/retry/missing banners. Extracted from
 * onboarding-wizard.tsx so the wizard is just orchestration + a step switch.
 */
import type { Translator } from "@patch-careers/i18n";
import { AnimatedField, useEditorialPalette } from "@patch-careers/ui/editorial";
import { AlertCircle, RefreshCw } from "lucide-react-native";
import { type ReactElement, type ReactNode, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  Text as RNText,
  SafeAreaView,
  View,
} from "react-native";
import { GhostButton, useEd } from "@/features/sections";
import type { MissingRequiredTarget } from "../lib/helpers";

export function Masthead({
  counter,
  progressPct,
}: {
  /** Quiet step counter, e.g. "4 / 10". */
  counter: string;
  progressPct: number;
}): ReactElement {
  const ed = useEd();
  const pct = Math.max(0, Math.min(100, progressPct));
  return (
    <View style={ed.mastheadWrap}>
      {/* The progress bar leads as the section divider/rule. */}
      <View style={ed.track}>
        <View style={[ed.fill, { width: `${pct}%` }]} />
      </View>
      <View style={ed.mastheadMeta}>
        <View />
        <RNText style={ed.timeText}>{counter}</RNText>
      </View>
    </View>
  );
}

/** Directional entrance for step content — a subtle slide + fade that gives
 *  the flow a physical direction (forward slides in from the right, back from
 *  the left). Mount-keyed by the wizard, so it runs once per step change. */
export function StepTransition({
  children,
  direction,
}: {
  children: ReactNode;
  direction: 1 | -1;
}): ReactElement {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress]);
  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          {
            translateX: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [direction * 24, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

function splitHeading(title: string): { head: string; tail: string } {
  const parts = title.trim().split(/\s+/);
  if (parts.length <= 1) return { head: "", tail: title };
  const tail = parts.pop() as string;
  return { head: `${parts.join(" ")} `, tail };
}

export function StepHeading({
  subtitle,
  tag,
  title,
}: {
  subtitle?: string;
  /** Small mono label above the title — only the exception is marked
   *  (optional steps get "Opcional"; required steps stay bare). */
  tag?: string;
  title: string;
}): ReactElement {
  const ed = useEd();
  const { head, tail } = splitHeading(title);
  return (
    <View>
      {tag ? (
        <AnimatedField delay={40}>
          <RNText style={ed.stepTag}>{tag}</RNText>
        </AnimatedField>
      ) : null}
      <AnimatedField delay={80}>
        <RNText style={ed.heading}>
          {head ? <RNText style={ed.headingRegular}>{head}</RNText> : null}
          <RNText style={ed.headingAccent}>{tail}</RNText>
        </RNText>
      </AnimatedField>
      {subtitle ? (
        <AnimatedField delay={170}>
          <RNText style={ed.subtitle}>{subtitle}</RNText>
        </AnimatedField>
      ) : null}
    </View>
  );
}

/** Thin editorial scrollbar for the fixed-height step body. Rendered only
 *  when the content overflows the box, so the user can tell there's more
 *  below the fold (e.g. the review list) without hunting for it. */
export function BodyScrollBar({
  contentHeight,
  scrollY,
  viewportHeight,
}: {
  contentHeight: number;
  scrollY: number;
  viewportHeight: number;
}): ReactElement | null {
  const ed = useEd();
  if (viewportHeight <= 0 || contentHeight <= viewportHeight + 1) return null;
  const thumbHeight = Math.max(28, (viewportHeight / contentHeight) * viewportHeight);
  const maxScroll = contentHeight - viewportHeight;
  const maxThumbTravel = viewportHeight - thumbHeight;
  const offset = Math.min(maxThumbTravel, Math.max(0, (scrollY / maxScroll) * maxThumbTravel));
  return (
    <View pointerEvents="none" style={ed.scrollTrack}>
      <View
        style={[ed.scrollThumb, { height: thumbHeight, transform: [{ translateY: offset }] }]}
      />
    </View>
  );
}

export function CenteredState({
  actionLabel,
  label,
  onAction,
}: {
  actionLabel?: string;
  label: string;
  onAction?: () => void;
}): ReactElement {
  const ed = useEd();
  const authTokens = useEditorialPalette();
  return (
    <SafeAreaView style={ed.centered}>
      <ActivityIndicator color={authTokens.ink} />
      <RNText style={ed.centeredText}>{label}</RNText>
      {actionLabel && onAction ? <GhostButton label={actionLabel} onPress={onAction} /> : null}
    </SafeAreaView>
  );
}

/** Non-destructive save-failure banner with a retry (item: resilient retry). */
export function RetryBanner({
  disabled,
  label,
  onRetry,
}: {
  disabled?: boolean;
  label: string;
  onRetry: () => void;
}): ReactElement {
  const ed = useEd();
  const authTokens = useEditorialPalette();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onRetry}
      style={[ed.retryBanner, disabled ? ed.dim : null]}
    >
      <AlertCircle size={16} color={authTokens.danger} />
      <RNText style={ed.retryText}>{label}</RNText>
      <RefreshCw size={15} color={authTokens.danger} />
    </Pressable>
  );
}

/** Upfront list of required-but-incomplete steps on the review hub. */
export function MissingBanner({
  onFix,
  targets,
  t,
}: {
  onFix: (stepId: string) => void;
  targets: readonly MissingRequiredTarget[];
  t: Translator;
}): ReactElement {
  const ed = useEd();
  const authTokens = useEditorialPalette();
  return (
    <View style={ed.missingBanner}>
      <View style={ed.missingHead}>
        <AlertCircle size={15} color={authTokens.warn} />
        <RNText style={ed.missingTitle}>{t("onboarding.review.missingTitle")}</RNText>
      </View>
      {targets.map((target) => (
        <Pressable
          key={target.stepId}
          accessibilityRole="button"
          onPress={() => onFix(target.stepId)}
          style={ed.missingRow}
        >
          <RNText style={ed.missingLabel} numberOfLines={1}>
            {target.label}
          </RNText>
          <RNText style={ed.missingFix}>{t("onboarding.review.fix")}</RNText>
        </Pressable>
      ))}
    </View>
  );
}
