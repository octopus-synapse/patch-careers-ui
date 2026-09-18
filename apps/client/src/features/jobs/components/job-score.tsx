import { scoreBand, scoreRampPalettes } from "@patch-careers/tokens";
import { Text, useEditorialPalette, useThemeName } from "@patch-careers/ui";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useI18n } from "@/providers/i18n-provider";

export function JobScore({
  score,
  large = false,
}: {
  score?: number | null | undefined;
  large?: boolean;
}) {
  const theme = useThemeName();
  const palette = useEditorialPalette();
  const { t } = useI18n();
  const valid = typeof score === "number" && Number.isFinite(score);
  const normalized = valid ? Math.min(100, Math.max(0, score)) : 0;
  const rounded = Math.round(normalized);
  const value = valid ? `${rounded}%` : "—";
  if (large) {
    const size = 132;
    const stroke = 11;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    return (
      <View
        style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
        accessibilityLabel={
          valid ? t("jobs.desktop.match", { score: value }) : t("jobs.desktop.matchUnavailable")
        }
        accessibilityRole="image"
      >
        <Svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          // @style-allow inline: react-native-svg needs absolute positioning to overlay the score label
          style={{ position: "absolute" }}
        >
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={palette.hairline}
            strokeWidth={stroke}
            fill="none"
          />
          {valid ? (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={scoreRampPalettes[theme][scoreBand(normalized)].ink}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={circumference * (1 - normalized / 100)}
              fill="none"
              rotation={-90}
              origin={`${size / 2}, ${size / 2}`}
            />
          ) : null}
        </Svg>
        <Text
          textAlign="center"
          fontSize={31}
          lineHeight={36}
          fontWeight="700"
          color={valid ? palette.ink : palette.muted}
        >
          {valid ? `${rounded}%` : "—"}
        </Text>
      </View>
    );
  }
  return (
    <Text
      fontSize={large ? 38 : 15}
      fontWeight="600"
      lineHeight={large ? 48 : 20}
      color={valid ? scoreRampPalettes[theme][scoreBand(score)].ink : palette.muted}
      accessibilityLabel={
        valid ? t("jobs.desktop.match", { score: value }) : t("jobs.desktop.matchUnavailable")
      }
    >
      {value}
    </Text>
  );
}
