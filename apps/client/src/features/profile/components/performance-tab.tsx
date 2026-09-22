/**
 * <PerformanceTab> — the "Desempenho" hub, rendered inside the score-hero's
 * sheet (it used to be a Profile sub-tab): the master resume's scores in
 * full. A large Readiness gauge (number is the protagonist, letter grade
 * reinforces), a one-line editorial summary, a trend sparkline for momentum,
 * and the job-independent sub-scores (Quality · Style) as a bullet
 * grid. Cold-start shows an inviting "discover your strength" state instead
 * of empty rings. `onDismiss` closes the hosting sheet (the CTAs land the
 * user back on the profile page to act).
 *
 * Consumes the unified `GET /v1/me/scores` (via `useMeScores`) so the whole
 * hub is one request; the header Readiness band shares the same cache.
 */

import {
  ScoreExplainSheet,
  ScoreRing,
  scoreGrade,
  scoreInk,
  scoreTone,
  Text,
  useThemeName,
  XStack,
  YStack,
} from "@patch-careers/ui";
import {
  editorialFonts as fonts,
  PillButton,
  useEditorialPalette,
} from "@patch-careers/ui/editorial";
import * as Haptics from "expo-haptics";
import { Info } from "lucide-react-native";
import { type ReactElement, useCallback, useState } from "react";
import { ActivityIndicator, Platform, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Polyline } from "react-native-svg";
import { usePatchPlan } from "@/features/billing/use-patch-plan";
import { useMasterResumeId, useResumeMutations } from "@/features/resumes";
import { RolePicker } from "@/features/sections";
import { useAppRouter } from "@/navigation/use-app-router";
import { useI18n } from "@/providers/i18n-provider";
import { type MeScores, useMeScores } from "../hooks/use-me-scores";
import { useReadinessPulse } from "../hooks/use-readiness-pulse";

const HERO_SIZE = 132;

export function PerformanceTab({ onDismiss }: { onDismiss?: () => void }): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const billing = usePatchPlan();
  const router = useAppRouter();
  const { scores, isPending, isError, refetch, isColdStart } = useMeScores();
  const [explainOpen, setExplainOpen] = useState(false);

  if (billing.data?.enabled && !billing.canUsePaid) {
    return (
      <YStack paddingVertical={40} paddingHorizontal={20} alignItems="center" gap={14}>
        <Text fontFamily={fonts.sans} fontSize={14} color={palette.body} textAlign="center">
          {t("go.paidBody")}
        </Text>
        <CtaButton onPress={() => router.push("/go")} label={t("go.paidTitle")} />
      </YStack>
    );
  }

  if (isPending) {
    return (
      <YStack paddingVertical={48} alignItems="center">
        <ActivityIndicator color={palette.ink} />
      </YStack>
    );
  }

  if (isError || !scores) {
    return (
      <YStack paddingVertical={40} paddingHorizontal={20} alignItems="center" gap={14}>
        <Text fontFamily={fonts.sans} fontSize={14} color={palette.muted}>
          {t("profile.scores.loadFailed")}
        </Text>
        <CtaButton onPress={refetch} label={t("profile.feedback.retry")} />
      </YStack>
    );
  }

  if (isColdStart) return <ColdStart onStart={() => onDismiss?.()} />;

  const readiness = scores.readiness;
  const summary = t(`profile.scores.summary.${scoreTone(readiness.score)}`);

  return (
    <YStack paddingHorizontal={20} paddingTop={8} gap={26}>
      {/* Hero — Readiness gauge + summary + trend */}
      <YStack alignItems="center" gap={14}>
        <ReadinessGauge score={readiness.score} />
        <YStack alignItems="center" gap={4}>
          <Text
            fontFamily={fonts.sans}
            fontSize={11}
            fontWeight="600"
            letterSpacing={1.8}
            textTransform="uppercase"
            color={palette.muted}
          >
            {t("profile.scores.readiness.label")}
          </Text>
          <Text
            fontFamily={fonts.serif}
            fontSize={19}
            lineHeight={26}
            textAlign="center"
            color={palette.ink}
          >
            {summary}
          </Text>
          <Text
            fontFamily={fonts.sans}
            fontSize={12.5}
            lineHeight={18}
            textAlign="center"
            color={palette.subtle}
          >
            {t("profile.scores.readiness.caption")}
          </Text>
        </YStack>
        <Trend points={readiness.trend} />
      </YStack>

      {/* Bullet grid of the job-independent sub-scores */}
      <YStack gap={12}>
        <XStack alignItems="center" justifyContent="space-between">
          <Text
            fontFamily={fonts.sans}
            fontSize={10}
            fontWeight="600"
            letterSpacing={1.8}
            textTransform="uppercase"
            color={palette.muted}
          >
            {t("profile.scores.breakdown.heading")}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("profile.scores.explain.a11y")}
            onPress={() => setExplainOpen(true)}
            hitSlop={8}
          >
            <Info size={16} color={palette.muted} />
          </Pressable>
        </XStack>

        {scores.quality ? (
          <ScoreBulletRow
            label={t("profile.scores.breakdown.quality")}
            caption={t("profile.scores.breakdown.qualityCaption")}
            score={scores.quality.score}
          />
        ) : null}
        {scores.style ? (
          <ScoreBulletRow
            label={t("profile.scores.breakdown.style")}
            caption={t("profile.scores.breakdown.styleCaption")}
            score={scores.style.score}
          />
        ) : null}
      </YStack>

      <TargetRoleEditor />

      <CtaButton onPress={() => onDismiss?.()} label={t("profile.scores.cta")} />

      <ScoreExplainSheet
        open={explainOpen}
        onOpenChange={setExplainOpen}
        title={t("profile.scores.explain.title")}
        score={readiness.score}
        grade
        sections={[
          {
            label: t("profile.scores.explain.quality"),
            body: t("profile.scores.explain.qualityBody"),
            trailing: factorText(readiness.factors.quality),
          },
          {
            label: t("profile.scores.explain.coverage"),
            body: t("profile.scores.explain.coverageBody"),
            trailing: factorText(readiness.factors.coverage),
          },
        ]}
        footnote={t("profile.scores.explain.footnote")}
      />
    </YStack>
  );
}

/** The Readiness hero gauge with a one-time "level-up" moment: on the first
 * open after the grade improves, the count-up finishes then the ring gives a
 * subtle pulse + a success haptic (a bigger pulse for a ≥2-grade jump). A
 * drop plays only a soft warning haptic — no celebration. A short rank line
 * sits above the ring. Respects the editorial calm: motion is brief and small. */
function ReadinessGauge({ score }: { score: number }): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const pulse = useReadinessPulse(score);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onRevealComplete = useCallback(() => {
    if (pulse.direction === "up") {
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      const peak = pulse.magnitude >= 2 ? 1.12 : 1.06;
      scale.value = withSequence(
        withTiming(peak, { duration: 180 }),
        withTiming(1, { duration: 260 }),
      );
    } else if (pulse.direction === "down" && Platform.OS !== "web") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [pulse, scale]);

  return (
    <YStack alignItems="center" gap={8}>
      {pulse.direction ? (
        <Text
          fontFamily={fonts.sans}
          fontSize={13}
          fontWeight="700"
          letterSpacing={0.2}
          color={pulse.direction === "up" ? palette.success : palette.warn}
        >
          {t(`profile.scores.rank.${pulse.direction}`, { grade: scoreGrade(score) })}
        </Text>
      ) : null}
      <Animated.View style={animatedStyle}>
        <ScoreRing
          score={score}
          size={HERO_SIZE}
          strokeWidth={9}
          grade
          onRevealComplete={onRevealComplete}
        />
      </Animated.View>
    </YStack>
  );
}

/** Lets the user set their desired role — the target the market-relative
 * Readiness coverage is measured against. Writing it invalidates the scores
 * so Readiness recomputes. Hidden until there's a master resume. */
function TargetRoleEditor(): ReactElement | null {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const { resumeId, targetRoleLabel } = useMasterResumeId();
  const { setTargetRole } = useResumeMutations();
  if (!resumeId) return null;
  return (
    <YStack gap={6}>
      <RolePicker
        label={t("profile.scores.targetRole.label")}
        value={targetRoleLabel ?? ""}
        onChange={(label) => void setTargetRole(resumeId, label.trim() || null)}
      />
      <Text fontFamily={fonts.sans} fontSize={12} lineHeight={16} color={palette.subtle}>
        {t("profile.scores.targetRole.caption")}
      </Text>
    </YStack>
  );
}

/** One sub-score row: label + caption on the left, number · grade + a thin
 * tone bar on the right (numbers always visible — AAA bullet-chart style). */
function ScoreBulletRow({
  label,
  caption,
  score,
}: {
  label: string;
  caption: string;
  score: number;
}): ReactElement {
  const palette = useEditorialPalette();
  const color = scoreInk(score, useThemeName());
  return (
    <XStack alignItems="center" gap={12} paddingVertical={4}>
      <YStack flex={1} gap={1}>
        <Text fontFamily={fonts.sans} fontSize={14} fontWeight="600" color={palette.ink}>
          {label}
        </Text>
        <Text fontFamily={fonts.sans} fontSize={12} lineHeight={16} color={palette.subtle}>
          {caption}
        </Text>
      </YStack>
      <YStack alignItems="flex-end" gap={5} width={92}>
        <Text fontFamily={fonts.mono} fontSize={15} color={palette.ink}>
          {`${Math.round(score)} · ${scoreGrade(score)}`}
        </Text>
        <YStack width="100%" height={4} borderRadius={2} backgroundColor={palette.hairline}>
          <YStack
            height={4}
            borderRadius={2}
            backgroundColor={color}
            width={`${Math.max(4, Math.min(100, score))}%`}
          />
        </YStack>
      </YStack>
    </XStack>
  );
}

/** Minimal editorial sparkline for the readiness trend. Hidden until there
 * are at least two points (a single dot isn't a trend). */
function Trend({ points }: { points: MeScores["readiness"]["trend"] }): ReactElement | null {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  if (points.length < 2) {
    return (
      <Text fontFamily={fonts.sans} fontSize={11.5} color={palette.subtle}>
        {t("profile.scores.trend.empty")}
      </Text>
    );
  }
  const W = 180;
  const H = 34;
  const values = points.map((p) => p.score);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = W / (values.length - 1);
  const coords = values
    .map((v, i) => `${(i * step).toFixed(1)},${(H - ((v - min) / span) * H).toFixed(1)}`)
    .join(" ");
  const delta = (values[values.length - 1] ?? 0) - (values[0] ?? 0);
  const up = delta >= 0;
  const deltaText =
    delta === 0
      ? t("profile.scores.trend.flat")
      : t(up ? "profile.scores.trend.deltaUp" : "profile.scores.trend.deltaDown", {
          delta: String(delta),
        });
  return (
    <XStack alignItems="center" gap={10}>
      <Svg width={W} height={H}>
        <Polyline
          points={coords}
          fill="none"
          stroke={up ? palette.success : palette.warn}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text
        fontFamily={fonts.sans}
        fontSize={11.5}
        fontWeight="600"
        color={up ? palette.success : palette.warn}
      >
        {deltaText}
      </Text>
    </XStack>
  );
}

function ColdStart({ onStart }: { onStart: () => void }): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  return (
    <YStack paddingHorizontal={24} paddingTop={24} alignItems="center" gap={16}>
      <ScoreRing score={0} size={HERO_SIZE} strokeWidth={9} animate={false} />
      <Text fontFamily={fonts.serif} fontSize={22} textAlign="center" color={palette.ink}>
        {t("profile.scores.coldStart.title")}
      </Text>
      <Text
        fontFamily={fonts.sans}
        fontSize={14}
        lineHeight={21}
        textAlign="center"
        color={palette.subtle}
      >
        {t("profile.scores.coldStart.body")}
      </Text>
      <CtaButton onPress={onStart} label={t("profile.scores.coldStart.cta")} />
    </YStack>
  );
}

function CtaButton({ onPress, label }: { onPress: () => void; label: string }): ReactElement {
  return <PillButton label={label} onPress={onPress} fullWidth />;
}

/** A readiness factor sub-value for the explain sheet, or "—" when absent. */
function factorText(value: number | null): string {
  return value === null ? "—" : String(Math.round(value));
}
