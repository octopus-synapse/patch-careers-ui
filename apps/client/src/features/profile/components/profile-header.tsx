/**
 * Identity header of the Profile tab: cover banner (tap to change), avatar
 * overlapping it (tap to change photo), name, headline, location.
 *
 * Both the banner and the avatar are the account menu's — `PuzzleBanner` and
 * `IdentityAvatar` from `@patch-careers/ui/editorial` — so the two places that
 * show you to yourself show the same person: a photo when there is one, the
 * silhouette when there is not (never initials, which the menu never drew).
 *
 * The settings gear used to sit up here; it is in the account menu, which is
 * one tap away on every screen, so the header no longer says it twice.
 */
import { IdentityAvatar, PuzzleBanner, useEditorialPalette } from "@patch-careers/ui/editorial";
import { Camera, MapPin } from "lucide-react-native";
import type { ReactElement } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { useI18n } from "@/providers/i18n-provider";
import { usePf } from "../lib/styles";
import { CompletenessRing } from "./completeness-ring";

const AVATAR_PX = 80;
// Desktop header is a wide identity band; the avatar anchors it larger.
const AVATAR_PX_WIDE = 112;
const AVATAR_BEZEL = 5;
/** Banner height, and how far the avatar rides up over it. */
const COVER_PX = 132;
const COVER_PX_WIDE = 196;
const AVATAR_OVERLAP = 52;
const AVATAR_OVERLAP_WIDE = 72;

export type HeaderProfile = {
  name?: string | null;
  headline?: string | null;
  location?: string | null;
  photoURL?: string | null;
};

export function ProfileHeader({
  profile,
  onChangePhoto,
  onChangeCover,
  coverURL,
  uploading = false,
  coverUploading = false,
  completeness = null,
}: {
  profile: HeaderProfile | undefined;
  onChangePhoto: () => void;
  onChangeCover: () => void;
  coverURL?: string | undefined;
  uploading?: boolean;
  coverUploading?: boolean;
  completeness?: number | null;
}): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const pf = usePf();
  // Desktop web reads left-to-right like a page: avatar beside the identity
  // text instead of the mobile centered stack.
  const isDesktopWeb = useIsDesktopWeb();
  const avatarPx = isDesktopWeb ? AVATAR_PX_WIDE : AVATAR_PX;
  const name = profile?.name ?? t("profile.header.defaultName");
  const pct = completeness === null ? null : Math.max(0, Math.min(100, Math.round(completeness)));

  const avatarInner = (
    <>
      <IdentityAvatar
        photoURL={profile?.photoURL ?? undefined}
        name={name}
        size={avatarPx}
        bezel={AVATAR_BEZEL}
        bezelColor={palette.bg}
      />
      {uploading ? (
        <View style={pf.avatarUploading}>
          <ActivityIndicator color={palette.onPrimary} />
        </View>
      ) : null}
    </>
  );

  // The banner is full-bleed: it cancels the scroll's page gutter so it runs
  // edge to edge, the way the menu's does across its panel.
  const cover = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("profile.cover.changeA11y")}
      accessibilityState={{ busy: coverUploading }}
      disabled={coverUploading}
      onPress={onChangeCover}
      style={pf.coverWrap}
    >
      <PuzzleBanner
        height={isDesktopWeb ? COVER_PX_WIDE : COVER_PX}
        fit="cover"
        {...(coverURL === undefined ? {} : { coverURL })}
        {...(coverURL === undefined ? {} : { accessibilityLabel: t("profile.cover.imageA11y") })}
      >
        <View style={pf.coverBadge}>
          {coverUploading ? (
            <ActivityIndicator color={palette.onPrimary} size="small" />
          ) : (
            <Camera size={15} color={palette.onPrimary} strokeWidth={2} />
          )}
        </View>
      </PuzzleBanner>
    </Pressable>
  );

  const avatarPressable = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("profile.header.changePhotoA11y")}
      accessibilityState={{ busy: uploading }}
      disabled={uploading}
      onPress={onChangePhoto}
      style={[pf.avatarWrap, { marginTop: -(isDesktopWeb ? AVATAR_OVERLAP_WIDE : AVATAR_OVERLAP) }]}
    >
      {pct !== null ? (
        <CompletenessRing percent={pct} size={avatarPx + AVATAR_BEZEL * 2}>
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
  );

  const identityText = (
    <>
      <Text style={[pf.name, isDesktopWeb && pf.nameWide]} accessibilityRole="header">
        {name}
      </Text>
      {profile?.headline ? (
        <Text style={[pf.headline, isDesktopWeb && pf.headlineWide]}>{profile.headline}</Text>
      ) : (
        <Text style={[pf.headline, isDesktopWeb && pf.headlineWide, pf.headlinePlaceholder]}>
          {t("profile.header.headlinePlaceholder")}
        </Text>
      )}
      {profile?.location ? (
        <View style={pf.locationRow}>
          <MapPin size={13} color={palette.subtle} strokeWidth={1.75} />
          <Text style={pf.location}>{profile.location}</Text>
        </View>
      ) : null}
    </>
  );

  if (isDesktopWeb) {
    return (
      <View style={pf.headerWide}>
        {cover}
        <View style={pf.headerWideRow}>
          {avatarPressable}
          <View style={pf.headerWideBody}>{identityText}</View>
        </View>
      </View>
    );
  }

  return (
    <View style={pf.header}>
      {cover}
      {avatarPressable}
      {identityText}
    </View>
  );
}
