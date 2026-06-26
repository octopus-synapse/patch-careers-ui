/**
 * Identity header of the Profile tab: avatar (tap to change photo), name,
 * headline, location — plus the compact trigger row for the identity / about
 * / links edit sheets (the old body sections collapsed into entry points; the
 * tab's body now belongs to the sub-tabs).
 */
import { Avatar } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import { Camera, MapPin, Settings } from "lucide-react-native";
import type { ReactElement } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { usePf } from "../lib/styles";
import { CompletenessRing } from "./completeness-ring";

const AVATAR_PX = 80;

export type HeaderProfile = {
  name?: string | null;
  headline?: string | null;
  location?: string | null;
  photoURL?: string | null;
};

export function ProfileHeader({
  profile,
  onChangePhoto,
  uploading = false,
  completeness = null,
}: {
  profile: HeaderProfile | undefined;
  onChangePhoto: () => void;
  uploading?: boolean;
  completeness?: number | null;
}): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const pf = usePf();
  const router = useRouter();
  const name = profile?.name ?? t("profile.header.defaultName");
  const pct = completeness === null ? null : Math.max(0, Math.min(100, Math.round(completeness)));

  const avatarInner = (
    <>
      <Avatar src={profile?.photoURL ?? undefined} name={name} size={AVATAR_PX} />
      {uploading ? (
        <View style={pf.avatarUploading}>
          <ActivityIndicator color={palette.onPrimary} />
        </View>
      ) : null}
    </>
  );

  return (
    <View style={pf.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("profile.header.settingsA11y")}
        onPress={() => router.push("/settings")}
        style={pf.settingsButton}
        hitSlop={8}
      >
        <Settings size={22} color={palette.muted} strokeWidth={1.75} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("profile.header.changePhotoA11y")}
        accessibilityState={{ busy: uploading }}
        disabled={uploading}
        onPress={onChangePhoto}
        style={pf.avatarWrap}
      >
        {pct !== null ? (
          <CompletenessRing percent={pct} size={AVATAR_PX}>
            {avatarInner}
          </CompletenessRing>
        ) : (
          avatarInner
        )}
        {pct !== null ? (
          <View
            style={pf.completenessBadge}
            accessibilityLabel={t("profile.header.completenessA11y", { percent: pct })}
          >
            <Text style={pf.completenessText}>{pct}%</Text>
          </View>
        ) : null}
        <View style={pf.avatarBadge}>
          <Camera size={15} color={palette.onPrimary} strokeWidth={2} />
        </View>
      </Pressable>
      <Text style={pf.name} accessibilityRole="header">
        {name}
      </Text>
      {profile?.headline ? (
        <Text style={pf.headline}>{profile.headline}</Text>
      ) : (
        <Text style={[pf.headline, pf.headlinePlaceholder]}>
          {t("profile.header.headlinePlaceholder")}
        </Text>
      )}
      {profile?.location ? (
        <View style={pf.locationRow}>
          <MapPin size={13} color={palette.subtle} strokeWidth={1.75} />
          <Text style={pf.location}>{profile.location}</Text>
        </View>
      ) : null}
    </View>
  );
}
