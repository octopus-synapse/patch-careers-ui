/**
 * <ProfileScoreDialog> — the score breakdown, opened from the rail card's
 * chevron.
 *
 * Left column: Style, then Quality holding Content and Completeness as
 * compartments of the same box. The inner rules bleed to the border so they
 * cut the box rather than float inside it — that is what says "another part of
 * the same thing" instead of "another thing".
 *
 * Right column: the mean as a ring, and the same four numbers as a radar. The
 * radar deliberately carries no digits (the left column has them); it is a
 * silhouette to recognise. It also double-counts — Quality is the mean of the
 * two axes plotted beside it — so its area means nothing and it is drawn only
 * when there are at least three axes to make a shape at all.
 *
 * The quiet "see full performance" link is not decoration: Readiness, the
 * trend and the target-role picker that drives it all live in
 * `PerformanceSheet`, which the rail no longer opens. Without this link the
 * desktop user loses the only way to set their target role.
 */

import {
  SCORE_RADAR_MIN_AXES,
  ScoreBar,
  ScoreRadar,
  type ScoreRadarAxis,
  ScoreRing,
  Sheet,
  scoreInk,
  scoreTone,
  useThemeName,
} from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { ArrowRight } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { useMeScores } from "../hooks/use-me-scores";
import { profileScoreAverage, profileScoreParts } from "../lib/profile-score";
import { usePf } from "../lib/styles";

const RING_SIZE = 104;

function profileScoreInk(value: number, patchGreen: string, themeName: "light" | "dark"): string {
  return scoreTone(value) === "excellent" ? patchGreen : scoreInk(value, themeName);
}

/** The number in its band colour, or an em dash when it was never computed. */
function ScoreValue({ value, style }: { value: number | null; style: object }): ReactElement {
  const palette = useEditorialPalette();
  const themeName = useThemeName();
  return (
    <Text
      style={[
        style,
        {
          color:
            value === null ? palette.subtle : profileScoreInk(value, palette.primary, themeName),
        },
      ]}
    >
      {value === null ? "—" : String(Math.round(value))}
    </Text>
  );
}

export function ProfileScoreDialog({
  open,
  onOpenChange,
  onOpenPerformance,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Hands off to the Desempenho sheet (target role, Readiness, trend). */
  onOpenPerformance: () => void;
}): ReactElement {
  const { t } = useI18n();
  const pf = usePf();
  const palette = useEditorialPalette();
  const { scores } = useMeScores();
  const [linkActive, setLinkActive] = useState(false);

  const parts = profileScoreParts(scores);
  const average = profileScoreAverage(parts);

  const axes: ScoreRadarAxis[] = [
    { label: t("profile.score.styleShort"), value: parts.style },
    { label: t("profile.score.qualityShort"), value: parts.quality },
    { label: t("profile.scoreHero.content"), value: parts.content },
    { label: t("profile.scoreHero.completeness"), value: parts.completeness },
  ].filter((axis) => axis.value !== null);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("profile.scoreHero.label")}
      closeLabel={t("profile.score.closeA11y")}
      presentation="card"
      webMaxWidth={880}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={pf.dialogBody}>
          <View style={pf.dialogLeft}>
            <View style={pf.scoreBlock}>
              <View style={pf.scoreBlockBody}>
                <View style={pf.scoreBlockHead}>
                  <Text style={pf.scoreBlockName}>{t("profile.score.styleShort")}</Text>
                  <ScoreValue value={parts.style} style={pf.scoreBlockValue} />
                </View>
                <Text style={pf.scoreBlockWhat}>{t("profile.scores.breakdown.styleCaption")}</Text>
                <View style={pf.scoreBlockBar}>
                  <ScoreBar
                    score={parts.style}
                    height={9}
                    color={
                      parts.style !== null && scoreTone(parts.style) === "excellent"
                        ? palette.primary
                        : undefined
                    }
                  />
                </View>
              </View>
            </View>

            <View style={pf.scoreBlock}>
              <View style={pf.scoreBlockBody}>
                <View style={pf.scoreBlockHead}>
                  <Text style={pf.scoreBlockName}>{t("profile.score.qualityShort")}</Text>
                  <ScoreValue value={parts.quality} style={pf.scoreBlockValue} />
                </View>
                <Text style={pf.scoreBlockWhat}>
                  {t("profile.scores.breakdown.qualityCaption")}
                </Text>
                <View style={pf.scoreBlockBar}>
                  <ScoreBar
                    score={parts.quality}
                    height={9}
                    color={
                      parts.quality !== null && scoreTone(parts.quality) === "excellent"
                        ? palette.primary
                        : undefined
                    }
                  />
                </View>
              </View>

              <View style={pf.scoreSub}>
                <View style={pf.scoreBlockHead}>
                  <Text style={pf.scoreSubName}>{t("profile.scoreHero.content")}</Text>
                  <ScoreValue value={parts.content} style={pf.scoreSubValue} />
                </View>
                <View style={pf.scoreSubBar}>
                  <ScoreBar
                    score={parts.content}
                    height={6}
                    color={
                      parts.content !== null && scoreTone(parts.content) === "excellent"
                        ? palette.primary
                        : undefined
                    }
                  />
                </View>
              </View>

              <View style={pf.scoreSub}>
                <View style={pf.scoreBlockHead}>
                  <Text style={pf.scoreSubName}>{t("profile.scoreHero.completeness")}</Text>
                  <ScoreValue value={parts.completeness} style={pf.scoreSubValue} />
                </View>
                <View style={pf.scoreSubBar}>
                  <ScoreBar
                    score={parts.completeness}
                    height={6}
                    color={
                      parts.completeness !== null && scoreTone(parts.completeness) === "excellent"
                        ? palette.primary
                        : undefined
                    }
                  />
                </View>
              </View>
            </View>

            <Pressable
              accessibilityRole="link"
              accessibilityLabel={t("profile.score.openPerformance")}
              onPress={() => {
                // One dialog at a time: stacking two RN Modals is flaky on
                // Android and traps focus on web.
                onOpenChange(false);
                onOpenPerformance();
              }}
              onHoverIn={() => setLinkActive(true)}
              onHoverOut={() => setLinkActive(false)}
              onFocus={() => setLinkActive(true)}
              onBlur={() => setLinkActive(false)}
              style={[pf.quietLink, pf.dialogLink]}
            >
              <Text style={[pf.quietLinkLabel, linkActive && { color: palette.ink }]}>
                {t("profile.score.openPerformance")}
              </Text>
              <ArrowRight
                size={13}
                color={linkActive ? palette.ink : palette.muted}
                strokeWidth={2.2}
              />
            </Pressable>
          </View>

          <View style={pf.dialogRight}>
            <View style={pf.dialogRingWrap}>
              {average === null ? (
                <Text style={pf.scoreEmpty}>{t("profile.score.empty")}</Text>
              ) : (
                <>
                  <ScoreRing
                    score={average}
                    size={RING_SIZE}
                    strokeWidth={10}
                    color={scoreTone(average) === "excellent" ? palette.primary : undefined}
                    animate={false}
                  />
                  <Text style={pf.dialogRingCaption}>{t("profile.score.average")}</Text>
                </>
              )}
            </View>

            <View style={pf.dialogRadar}>
              {axes.length >= SCORE_RADAR_MIN_AXES ? (
                <ScoreRadar axes={axes} accessibilityLabel={t("profile.score.radarA11y")} />
              ) : (
                <Text style={pf.scoreEmpty}>{t("profile.score.notEnough")}</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </Sheet>
  );
}
