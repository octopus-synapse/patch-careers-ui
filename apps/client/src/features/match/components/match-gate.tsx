/**
 * <MatchGate> — the blur + lock teaser shown where match content would be
 * when the user has no (or an expired) fit profile. A couple of frosted
 * placeholder cards sit behind an editorial overlay that invites the user
 * into the fit questionnaire. Tasteful, not loud: one clear CTA.
 */
import { useEditorialPalette, useThemeName } from "@patch-careers/ui/editorial";
import { BlurView } from "expo-blur";
import { Lock } from "lucide-react-native";
import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useMt } from "../lib/styles";

export function MatchGate({
  title,
  body,
  ctaLabel,
  onPress,
}: {
  title: string;
  body: string;
  ctaLabel: string;
  onPress: () => void;
}): ReactElement {
  const s = useMt();
  const palette = useEditorialPalette();
  const themeName = useThemeName();

  return (
    <View style={s.gateWrap}>
      <View style={s.gateTeaser} pointerEvents="none">
        <View style={s.gateTeaserCard} />
        <View style={s.gateTeaserCard} />
      </View>
      <BlurView
        intensity={18}
        tint={themeName === "dark" ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={s.gateOverlay}>
        <Lock size={22} color={palette.muted} strokeWidth={1.75} />
        <Text style={s.gateTitle}>{title}</Text>
        <Text style={s.gateBody}>{body}</Text>
        <Pressable
          style={s.gateBtn}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
        >
          <Text style={s.gateBtnLabel}>{ctaLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}
