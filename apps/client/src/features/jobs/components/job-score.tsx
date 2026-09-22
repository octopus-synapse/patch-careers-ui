import { scoreBand, scoreRampPalettes } from "@patch-careers/tokens";
import { Text, useEditorialPalette, useThemeName } from "@patch-careers/ui";
import { editorialFonts } from "@patch-careers/ui/editorial";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useI18n } from "@/providers/i18n-provider";

export function JobScore({
  score,
  large = false,
  ring = false,
}: {
  score?: number | null | undefined;
  large?: boolean;
  ring?: boolean;
}) {
  const theme = useThemeName();
  const palette = useEditorialPalette();
  const { t } = useI18n();
  const valid = typeof score === "number" && Number.isFinite(score);
  const normalized = valid ? Math.min(100, Math.max(0, score)) : 0;
  const rounded = Math.round(normalized);
  const value = valid ? `${rounded}%` : "—";
  const band = scoreBand(normalized);
  const ringColor = band === "excellent" ? palette.primary : scoreRampPalettes[theme][band].ink;
  const accessibilityLabel = valid
    ? t("jobs.desktop.match", { score: value })
    : t("jobs.desktop.matchUnavailable");
  if (!large && !ring) {
    return (
      <Text
        fontFamily={editorialFonts.sans}
        fontSize={15}
        lineHeight={20}
        fontWeight="700"
        color={valid ? ringColor : palette.muted}
        accessibilityLabel={accessibilityLabel}
      >
        {value}
      </Text>
    );
  }

  const size = large ? 132 : 48;
  const stroke = large ? 11 : 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <View
      style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
      accessibilityLabel={accessibilityLabel}
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
            stroke={ringColor}
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
        fontFamily={editorialFonts.sans}
        fontSize={large ? 31 : 14}
        lineHeight={large ? 36 : 18}
        fontWeight="700"
        color={valid ? palette.ink : palette.muted}
      >
        {value}
      </Text>
    </View>
  );
}
