/**
 * `<LikertScale>` — the answer control for a fit question. Renders a 5-point
 * Likert row (raw 1..5, with end anchors) or a two-option binary control
 * (raw 0 | 1), per the question's `scaleType`. Selection plays a light
 * haptic. All copy is localised by the caller.
 */
import * as Haptics from "expo-haptics";
import type { ReactElement } from "react";
import { Pressable, Text, View } from "react-native";
import { useFit } from "../lib/styles";
import type { FitScaleType } from "../types";

const LIKERT_VALUES = [1, 2, 3, 4, 5] as const;

export type LikertLabels = {
  min: string;
  max: string;
  no: string;
  yes: string;
};

export type LikertScaleProps = {
  scaleType: FitScaleType;
  value?: number | undefined;
  onChange: (raw: number) => void;
  labels: LikertLabels;
};

export function LikertScale({
  scaleType,
  value,
  onChange,
  labels,
}: LikertScaleProps): ReactElement {
  const s = useFit();

  const select = (raw: number) => {
    void Haptics.selectionAsync();
    onChange(raw);
  };

  if (scaleType === "binary") {
    const options: { raw: number; label: string }[] = [
      { raw: 0, label: labels.no },
      { raw: 1, label: labels.yes },
    ];
    return (
      <View style={s.binaryRow}>
        {options.map((opt) => {
          const selected = value === opt.raw;
          return (
            <Pressable
              key={opt.raw}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={opt.label}
              onPress={() => select(opt.raw)}
              style={[s.binaryOption, selected ? s.binaryOptionSelected : null]}
            >
              <Text style={[s.binaryLabel, selected ? s.binaryLabelSelected : null]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View>
      <View style={s.likertRow}>
        {LIKERT_VALUES.map((raw) => {
          const selected = value === raw;
          return (
            <Pressable
              key={raw}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={String(raw)}
              onPress={() => select(raw)}
              style={[s.dot, selected ? s.dotSelected : null]}
            >
              <Text
                style={[s.dotLabel, selected ? s.dotLabelSelected : null]}
                allowFontScaling={false}
              >
                {raw}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={s.anchorRow}>
        <Text style={s.anchorText} numberOfLines={2}>
          {labels.min}
        </Text>
        <Text style={[s.anchorText, s.anchorTextEnd]} numberOfLines={2}>
          {labels.max}
        </Text>
      </View>
    </View>
  );
}
