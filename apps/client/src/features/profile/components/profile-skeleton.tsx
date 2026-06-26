/**
 * <ProfileSkeleton> — first-paint placeholder shaped like the Profile tab
 * (centered avatar + name/headline, the sub-tab bar, and the identity card
 * rows) so the screen doesn't jump when the real data lands. Replaces the
 * old full-screen spinner.
 */
import { Skeleton } from "@patch-careers/ui";
import type { ReactElement } from "react";
import { View } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { usePf } from "../lib/styles";

const ROW_KEYS = ["s1", "s2", "s3", "s4", "s5"] as const;

export function ProfileSkeleton(): ReactElement {
  const { t } = useI18n();
  const pf = usePf();
  return (
    <View style={pf.scroll} accessibilityLabel={t("profile.loadingA11y")}>
      <View style={pf.header}>
        <Skeleton variant="circle" width={80} />
        <Skeleton variant="text" width={170} height={22} />
        <Skeleton variant="text" width={210} height={14} />
      </View>
      <Skeleton variant="rect" width="100%" height={44} />
      <View style={pf.skeletonCard}>
        {ROW_KEYS.map((key) => (
          <Skeleton key={key} variant="rect" width="100%" height={52} />
        ))}
      </View>
    </View>
  );
}
