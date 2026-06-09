/**
 * Onboarding wizard chrome — the presentational frame around each step:
 * masthead/progress, step heading, the skip-ack checkbox, the loading/error
 * centered state, and the resume/retry/missing banners. Extracted from
 * onboarding-wizard.tsx so the wizard is just orchestration + a step switch.
 */
import type { Translator } from "@patch-careers/i18n";
import { editorialPalette as authTokens } from "@patch-careers/tokens";
import { AnimatedField, PatchLogo } from "@patch-careers/ui/editorial";
import { AlertCircle, Check, RefreshCw, X } from "lucide-react-native";
import type { ReactElement } from "react";
import { ActivityIndicator, Pressable, Text as RNText, SafeAreaView, View } from "react-native";
import { ed, GhostButton } from "@/features/sections";
import type { MissingRequiredTarget } from "../lib/helpers";

export function Masthead({
  phaseLabel,
  progressPct,
  timeText,
}: {
  phaseLabel: string;
  progressPct: number;
  timeText: string;
}): ReactElement {
  const pct = Math.max(0, Math.min(100, progressPct));
  return (
    <View style={ed.mastheadWrap}>
      {/* Brand isolated + centered, with breathing room above the progress. */}
      <View style={ed.mastheadBrand}>
        <PatchLogo />
      </View>
      {/* The progress bar leads as the section divider/rule. */}
      <View style={ed.track}>
        <View style={[ed.fill, { width: `${pct}%` }]} />
      </View>
      {/* Justified byline beneath the rule: section (left) ↔ time (right). */}
      <View style={ed.mastheadMeta}>
        {phaseLabel ? <RNText style={ed.phaseLabel}>{phaseLabel}</RNText> : <View />}
        <RNText style={ed.timeText}>{timeText}</RNText>
      </View>
    </View>
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
  title,
}: {
  subtitle?: string;
  title: string;
}): ReactElement {
  const { head, tail } = splitHeading(title);
  return (
    <View>
      <AnimatedField delay={80}>
        <RNText style={ed.heading}>
          {head ? <RNText style={ed.headingRegular}>{head}</RNText> : null}
          <RNText style={ed.headingItalic}>{tail}</RNText>
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

/** Acknowledgement checkbox — gates "Continuar" on an empty optional section
 *  ("Não tenho X"): the user must add an item or tick this to proceed. */
export function AckCheckbox({
  checked,
  disabled,
  label,
  onToggle,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onToggle: () => void;
}): ReactElement {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: Boolean(disabled) }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onToggle}
      hitSlop={8}
      style={ed.ackRow}
    >
      <View style={[ed.ackBox, checked ? ed.ackBoxChecked : null]}>
        {checked ? <Check size={12} color={authTokens.surface} strokeWidth={3} /> : null}
      </View>
      <RNText style={[ed.ghostLabel, disabled ? ed.dim : null]}>{label}</RNText>
    </Pressable>
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
  return (
    <SafeAreaView style={ed.centered}>
      <ActivityIndicator color={authTokens.ink} />
      <RNText style={ed.centeredText}>{label}</RNText>
      {actionLabel && onAction ? <GhostButton label={actionLabel} onPress={onAction} /> : null}
    </SafeAreaView>
  );
}

/** "Continue where you left off" banner on a resumed session. */
export function ResumeBanner({
  onDismiss,
  phaseLabel,
  t,
}: {
  onDismiss: () => void;
  phaseLabel: string;
  t: Translator;
}): ReactElement {
  return (
    <View style={ed.resumeBanner}>
      <View style={ed.resumeBannerBody}>
        <RNText style={ed.resumeBannerTitle}>
          {t("onboarding.resume.title", { phase: phaseLabel })}
        </RNText>
        <RNText style={ed.resumeBannerSubtitle}>{t("onboarding.resume.subtitle")}</RNText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="dismiss"
        hitSlop={8}
        onPress={onDismiss}
      >
        <X size={18} color={authTokens.muted} />
      </Pressable>
    </View>
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
