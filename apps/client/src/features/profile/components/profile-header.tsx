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
import { IdentityMasthead, useEditorialPalette } from "@patch-careers/ui/editorial";
import { Camera } from "lucide-react-native";
import type { ReactElement, ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { useI18n } from "@/providers/i18n-provider";
import { usePf } from "../lib/styles";
import { CompletenessRing } from "./completeness-ring";

const AVATAR_PX = 80;
// Desktop header is a wide identity band; the avatar anchors it larger.
const AVATAR_PX_WIDE = 112;
const AVATAR_BEZEL = 5;

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
  variant = "page",
  trailing,
}: {
  profile: HeaderProfile | undefined;
  onChangePhoto: () => void;
  onChangeCover: () => void;
  coverURL?: string | undefined;
  uploading?: boolean;
  coverUploading?: boolean;
  completeness?: number | null;
  /**
   * "page" (default) is the masthead: full-bleed banner cancelling the page
   * gutter, closed by a hairline. "card" wraps the same thing in a panel card
   * — used by desktop web, where the header is the first card of a column
   * that runs beside the rail.
   */
  variant?: "page" | "card";
  /** Mobile masthead only: a control under the identity (the language switch, decision 9). */
  trailing?: ReactNode;
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
  // The bezel and the camera chips are painted in whatever sits behind them so
  // they cut a clean hole in the banner. Inside a card that is `panel`, not the
  // page's `bg` — otherwise the avatar wears a beige ring on a white card.
  const behind = variant === "card" ? palette.panel : palette.bg;

  return (
    <IdentityMasthead
      name={name}
      headline={profile?.headline ?? null}
      headlineFallback={t("profile.header.headlinePlaceholder")}
      location={profile?.location ?? null}
      photoURL={profile?.photoURL ?? null}
      coverURL={coverURL}
      wide={isDesktopWeb}
      variant={variant}
      trailing={trailing}
      onCoverPress={onChangeCover}
      onAvatarPress={onChangePhoto}
      coverAccessibilityLabel={t("profile.cover.changeA11y")}
      avatarAccessibilityLabel={t("profile.header.changePhotoA11y")}
      coverBusy={coverUploading}
      avatarBusy={uploading}
      coverAccessory={
        <View style={[pf.coverBadge, { borderColor: behind }]}>
          {coverUploading ? (
            <ActivityIndicator color={palette.onPrimary} size="small" />
          ) : (
            <Camera size={15} color={palette.onPrimary} strokeWidth={2} />
          )}
        </View>
      }
      renderAvatar={(avatar) => {
        const content = (
          <>
            {avatar}
            {uploading ? (
              <View style={pf.avatarUploading}>
                <ActivityIndicator color={palette.onPrimary} />
              </View>
            ) : null}
          </>
        );
        return pct !== null ? (
          <CompletenessRing percent={pct} size={avatarPx + AVATAR_BEZEL * 2}>
            {content}
          </CompletenessRing>
        ) : (
          content
        );
      }}
      avatarAccessory={
        <>
          {pct !== null ? (
            <View
              style={pf.completenessBadge}
              accessibilityLabel={t("profile.header.completenessA11y", { percent: pct })}
            >
              <Text style={pf.completenessText}>{pct}%</Text>
            </View>
          ) : null}
          <View style={[pf.avatarBadge, { borderColor: behind }]}>
            <Camera size={15} color={palette.onPrimary} strokeWidth={2} />
          </View>
        </>
      }
    />
  );
}
