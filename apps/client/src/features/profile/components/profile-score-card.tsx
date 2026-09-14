/**
 * <ProfileScoreCard> — the rail's score panel on desktop web.
 *
 * Replaces `ScoreHero` here (the hero stays: mobile and narrow web still use
 * it). The difference is what it claims to be. The hero showed the Quality
 * score as the headline and three sub-scores beside it, so the big number was
 * one of the small ones. This shows the two top-level scores — Style and
 * Quality — and a ring that is their mean, which is an arithmetic the reader
 * can check. Content and Completeness live one level in, inside Quality, where
 * the backend puts them.
 *
 * The chevron opens the full breakdown; the card itself is not the button,
 * because a card that is entirely a link makes selecting the number you came
 * to read impossible.
 */

import { ScoreBar, ScoreRing, scoreInk, useThemeName } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { ChevronRight } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { useMeScores } from "../hooks/use-me-scores";
import { profileScoreAverage, profileScoreParts } from "../lib/profile-score";
import { usePf } from "../lib/styles";

const RING_SIZE = 84;

/** One top-level score: label, number in the ramp colour, and a thin bar. */
function ScoreLine({
  label,
  value,
  split,
}: {
  label: string;
  value: number | null;
  split: boolean;
}): ReactElement {
  const pf = usePf();
  const palette = useEditorialPalette();
  const themeName = useThemeName();
  return (
    <View style={split ? pf.scoreLineSplit : null}>
      <View style={pf.scoreLineHead}>
        <Text style={pf.scoreLineLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text
          style={[
            pf.scoreLineValue,
            { color: value === null ? palette.subtle : scoreInk(value, themeName) },
          ]}
        >
          {value === null ? "—" : String(Math.round(value))}
        </Text>
      </View>
      <View style={pf.scoreLineBar}>
        <ScoreBar score={value} height={4} />
      </View>
    </View>
  );
}

export function ProfileScoreCard({ onOpen }: { onOpen: () => void }): ReactElement | null {
  const { t } = useI18n();
  const pf = usePf();
  const palette = useEditorialPalette();
  const { scores, isColdStart } = useMeScores();
  const [active, setActive] = useState(false);

  // Same gate the hero uses: nothing to show before the first score lands, and
  // an empty card in the rail is worse than no card.
  if (!scores || isColdStart) return null;

  const parts = profileScoreParts(scores);
  const average = profileScoreAverage(parts);

  return (
    <View style={pf.railCard}>
      <View style={pf.railCardHead}>
        <Text style={pf.railCardTitle} accessibilityRole="header">
          {t("profile.scoreHero.label")}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("profile.score.openA11y")}
          onPress={onOpen}
          onHoverIn={() => setActive(true)}
          onHoverOut={() => setActive(false)}
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
          style={[pf.railCardAction, active && pf.railCardActionActive]}
        >
          <ChevronRight size={16} color={palette.muted} strokeWidth={2} />
        </Pressable>
      </View>

      {average === null ? (
        <Text style={pf.scoreEmpty}>{t("profile.score.empty")}</Text>
      ) : (
        <View style={pf.scoreRow}>
          {/* Static on web: the ring is in the rail from first paint, and a
              count-up on a number nobody navigated to is decoration. */}
          <ScoreRing score={average} size={RING_SIZE} strokeWidth={10} animate={false} />
          <View style={pf.scoreLines}>
            <ScoreLine label={t("profile.score.styleShort")} value={parts.style} split={false} />
            <ScoreLine label={t("profile.score.qualityShort")} value={parts.quality} split />
          </View>
        </View>
      )}
    </View>
  );
}
