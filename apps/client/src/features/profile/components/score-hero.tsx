/**
 * <ScoreHero> — the profile page's score card: the master resume's Quality
 * score as the big ring, flanked by the three job-independent sub-scores
 * (Conteúdo IA · Completude · Estilo) as thin tone bars. Tapping opens the
 * Desempenho sheet (the full scores hub). Falls back to the Readiness score
 * when Quality hasn't computed yet, and renders nothing until `/me/scores`
 * loads so there's no layout jump.
 */
import {
  ScoreRing,
  scoreGrade,
  scoreTone,
  Text,
  toneToEditorialKey,
  XStack,
  YStack,
} from "@patch-careers/ui";
import { editorialFonts as fonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { ChevronRight } from "lucide-react-native";
import type { ReactElement } from "react";
import { Pressable } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { useMeScores } from "../hooks/use-me-scores";

const RING_SIZE = 92;

export function ScoreHero({ onOpen }: { onOpen: () => void }): ReactElement | null {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const { scores, isColdStart } = useMeScores();
  if (!scores || isColdStart) return null;

  const hero = scores.quality?.score ?? scores.readiness.score;
  const bars = [
    {
      key: "content",
      label: t("profile.scoreHero.content"),
      value: scores.quality?.contentQualityScore ?? null,
    },
    {
      key: "completeness",
      label: t("profile.scoreHero.completeness"),
      value: scores.quality?.completenessScore ?? null,
    },
    { key: "style", label: t("profile.scoreHero.style"), value: scores.style?.score ?? null },
  ] as const;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("profile.scoreHero.a11y", {
        score: String(hero),
        grade: scoreGrade(hero),
      })}
      onPress={onOpen}
    >
      <YStack
        borderWidth={1}
        borderColor={palette.hairline}
        backgroundColor={palette.panel}
        borderRadius={18}
        padding={18}
        gap={14}
      >
        <XStack alignItems="center" justifyContent="space-between">
          <Text
            fontFamily={fonts.sans}
            fontSize={10}
            fontWeight="600"
            letterSpacing={1.8}
            textTransform="uppercase"
            color={palette.muted}
          >
            {t("profile.scoreHero.label")}
          </Text>
          <ChevronRight size={16} color={palette.subtle} strokeWidth={1.75} />
        </XStack>
        <XStack alignItems="center" gap={18}>
          <ScoreRing score={hero} size={RING_SIZE} strokeWidth={7} grade />
          <YStack flex={1} gap={11}>
            {bars.map((bar) => (
              <HeroBar key={bar.key} label={bar.label} value={bar.value} />
            ))}
          </YStack>
        </XStack>
      </YStack>
    </Pressable>
  );
}

/** One sub-score line: label + mono number over a thin tone bar. A null
 * score (AI unavailable / no style yet) renders "—" over an empty track. */
function HeroBar({ label, value }: { label: string; value: number | null }): ReactElement {
  const palette = useEditorialPalette();
  const v = value === null ? null : Math.round(value);
  return (
    <YStack gap={5}>
      <XStack alignItems="baseline" justifyContent="space-between">
        <Text fontFamily={fonts.sans} fontSize={12} color={palette.body}>
          {label}
        </Text>
        <Text
          fontFamily={fonts.mono}
          fontSize={13}
          color={v === null ? palette.subtle : palette.ink}
        >
          {v === null ? "—" : String(v)}
        </Text>
      </XStack>
      <YStack height={3} borderRadius={2} backgroundColor={palette.hairline}>
        {v !== null ? (
          <YStack
            height={3}
            borderRadius={2}
            backgroundColor={palette[toneToEditorialKey(scoreTone(v))]}
            width={`${Math.max(4, Math.min(100, v))}%`}
          />
        ) : null}
      </YStack>
    </YStack>
  );
}
