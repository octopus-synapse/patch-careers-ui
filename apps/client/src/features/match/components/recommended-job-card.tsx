/**
 * <RecommendedJobCard> — a compact carousel card for a match-ranked external
 * listing: company · title · location, with the compatibility chip ("92%").
 */
import { MatchScoreChip } from "@patch-careers/ui";
import type { ReactElement } from "react";
import { Pressable, Text, View } from "react-native";
import { useMt } from "../lib/styles";
import type { RecommendedJob } from "../types";

export function RecommendedJobCard({
  job,
  matchLabel,
  onPress,
}: {
  job: RecommendedJob;
  matchLabel: string;
  onPress: () => void;
}): ReactElement {
  const s = useMt();
  return (
    <Pressable
      style={s.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={job.title}
    >
      <View style={s.cardTop}>
        <Text style={s.company} numberOfLines={1}>
          {job.company}
        </Text>
        <MatchScoreChip
          score={job.matchScore}
          size="sm"
          accessibilityLabel={`${job.matchScore}% ${matchLabel}`}
        />
      </View>
      <Text style={s.title} numberOfLines={2}>
        {job.title}
      </Text>
      {job.location ? (
        <Text style={s.meta} numberOfLines={1}>
          {job.location}
        </Text>
      ) : null}
    </Pressable>
  );
}
