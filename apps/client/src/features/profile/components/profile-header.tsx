/**
 * Identity header of the Profile tab: avatar (tap to change photo), name,
 * headline, location — plus the compact trigger row for the identity / about
 * / links edit sheets (the old body sections collapsed into entry points; the
 * tab's body now belongs to the sub-tabs).
 */
import { Avatar } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { Camera, MapPin } from "lucide-react-native";
import type { ReactElement } from "react";
import { Pressable, Text, View } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { usePf } from "../lib/styles";

export type HeaderProfile = {
  name?: string | null;
  headline?: string | null;
  location?: string | null;
  photoURL?: string | null;
};

export function ProfileHeader({
  profile,
  onChangePhoto,
}: {
  profile: HeaderProfile | undefined;
  onChangePhoto: () => void;
}): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const pf = usePf();
  const name = profile?.name ?? t("profile.header.defaultName");

  return (
    <View style={pf.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("profile.header.changePhotoA11y")}
        onPress={onChangePhoto}
        style={pf.avatarWrap}
      >
        <Avatar src={profile?.photoURL ?? undefined} name={name} size="xl" />
        <View style={pf.avatarBadge}>
          <Camera size={15} color={palette.onPrimary} strokeWidth={2} />
        </View>
      </Pressable>
      <Text style={pf.name}>{name}</Text>
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
