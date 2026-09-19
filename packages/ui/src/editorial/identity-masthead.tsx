/**
 * Shared profile masthead: puzzle/cover art, overlapping avatar and identity.
 *
 * Editing controls are optional slots, so the owner's profile and a public
 * profile keep the same visual identity without coupling their features.
 */
import type { EditorialPalette } from "@patch-careers/tokens";
import { MapPin } from "lucide-react-native";
import { type ReactElement, type ReactNode, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useEditorialPalette } from "../internal/use-editorial-palette";
import { editorialFonts as fonts } from "./fonts";
import { IdentityAvatar } from "./identity-avatar";
import { PuzzleBanner } from "./puzzle-banner";

export interface IdentityMastheadProps {
  readonly name: string;
  readonly headline?: string | null;
  readonly headlineFallback?: string | undefined;
  readonly location?: string | null;
  readonly photoURL?: string | null;
  readonly coverURL?: string | undefined;
  readonly wide: boolean;
  readonly variant?: "page" | "card";
  readonly trailing?: ReactNode;
  readonly details?: ReactNode;
  readonly coverAccessory?: Accessory;
  readonly avatarAccessory?: Accessory;
  readonly renderAvatar?: ((avatar: ReactElement) => ReactNode) | undefined;
  readonly onCoverPress?: (() => void) | undefined;
  readonly onAvatarPress?: (() => void) | undefined;
  readonly coverAccessibilityLabel?: string | undefined;
  readonly avatarAccessibilityLabel?: string | undefined;
  readonly coverBusy?: boolean;
  readonly avatarBusy?: boolean;
}

export type IdentityMastheadAccessoryState = {
  readonly hovered: boolean;
};

type Accessory = ReactNode | ((state: IdentityMastheadAccessoryState) => ReactNode);

const AVATAR = 80;
const AVATAR_WIDE = 112;
const COVER = 132;
const COVER_WIDE = 196;
const OVERLAP = 52;
const OVERLAP_WIDE = 72;
const BEZEL = 5;

export function IdentityMasthead({
  name,
  headline,
  headlineFallback,
  location,
  photoURL,
  coverURL,
  wide,
  variant = "page",
  trailing,
  details,
  coverAccessory,
  avatarAccessory,
  renderAvatar,
  onCoverPress,
  onAvatarPress,
  coverAccessibilityLabel,
  avatarAccessibilityLabel,
  coverBusy = false,
  avatarBusy = false,
}: IdentityMastheadProps): ReactElement {
  const palette = useEditorialPalette();
  const styles = mastheadStyles(palette);
  const [coverHovered, setCoverHovered] = useState(false);
  const [avatarHovered, setAvatarHovered] = useState(false);
  const avatarSize = wide ? AVATAR_WIDE : AVATAR;
  const behind = variant === "card" ? palette.panel : palette.bg;

  const cover = (
    <PuzzleBanner
      height={wide ? COVER_WIDE : COVER}
      fit="cover"
      {...(coverURL === undefined ? {} : { coverURL })}
      {...(coverAccessibilityLabel === undefined
        ? {}
        : { accessibilityLabel: coverAccessibilityLabel })}
    >
      {typeof coverAccessory === "function"
        ? coverAccessory({ hovered: coverHovered })
        : coverAccessory}
    </PuzzleBanner>
  );
  const avatar = (
    <IdentityAvatar
      photoURL={photoURL ?? undefined}
      name={name}
      size={avatarSize}
      bezel={BEZEL}
      bezelColor={behind}
    />
  );
  const renderedAvatar = renderAvatar?.(avatar) ?? avatar;

  const coverNode = onCoverPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={coverAccessibilityLabel}
      accessibilityState={{ busy: coverBusy }}
      disabled={coverBusy}
      onPress={onCoverPress}
      onHoverIn={() => setCoverHovered(true)}
      onHoverOut={() => setCoverHovered(false)}
      style={variant === "card" ? styles.coverCard : styles.coverPage}
    >
      {cover}
    </Pressable>
  ) : (
    <View style={variant === "card" ? styles.coverCard : styles.coverPage}>{cover}</View>
  );

  const avatarStyle = [styles.avatar, { marginTop: -(wide ? OVERLAP_WIDE : OVERLAP) }];
  const avatarNode = onAvatarPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={avatarAccessibilityLabel}
      accessibilityState={{ busy: avatarBusy }}
      disabled={avatarBusy}
      onPress={onAvatarPress}
      onHoverIn={() => setAvatarHovered(true)}
      onHoverOut={() => setAvatarHovered(false)}
      style={avatarStyle}
    >
      {renderedAvatar}
      {typeof avatarAccessory === "function"
        ? avatarAccessory({ hovered: avatarHovered })
        : avatarAccessory}
    </Pressable>
  ) : (
    <View style={avatarStyle}>
      {renderedAvatar}
      {typeof avatarAccessory === "function"
        ? avatarAccessory({ hovered: false })
        : avatarAccessory}
    </View>
  );

  const identity = (
    <>
      <Text style={[styles.name, wide && styles.nameWide]} accessibilityRole="header">
        {name}
      </Text>
      {headline ? (
        <Text style={[styles.headline, wide && styles.headlineWide]}>{headline}</Text>
      ) : headlineFallback ? (
        <Text style={[styles.headline, wide && styles.headlineWide, styles.placeholder]}>
          {headlineFallback}
        </Text>
      ) : null}
      {location ? (
        <View style={styles.locationRow}>
          <MapPin size={13} color={palette.subtle} strokeWidth={1.75} />
          <Text style={styles.location}>{location}</Text>
        </View>
      ) : null}
      {details}
    </>
  );

  if (variant === "card") {
    return (
      <View style={styles.card}>
        {coverNode}
        <View style={styles.cardBody}>
          <View style={styles.wideRow}>
            {avatarNode}
            <View style={styles.wideBody}>{identity}</View>
          </View>
        </View>
      </View>
    );
  }

  if (wide) {
    return (
      <View style={styles.headerWide}>
        {coverNode}
        <View style={styles.wideRow}>
          {avatarNode}
          <View style={styles.wideBody}>{identity}</View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.header}>
      {coverNode}
      {avatarNode}
      {identity}
      {trailing}
    </View>
  );
}

const cache = new WeakMap<EditorialPalette, ReturnType<typeof createStyles>>();

function mastheadStyles(palette: EditorialPalette): ReturnType<typeof createStyles> {
  const cached = cache.get(palette);
  if (cached) return cached;
  const styles = createStyles(palette);
  cache.set(palette, styles);
  return styles;
}

const createStyles = (p: EditorialPalette) =>
  StyleSheet.create({
    header: { alignItems: "center", gap: 12 },
    headerWide: {
      gap: 14,
      paddingBottom: 30,
      borderBottomWidth: 1,
      borderBottomColor: p.hairline,
    },
    card: {
      borderWidth: 1,
      borderColor: p.hairline,
      borderRadius: 20,
      backgroundColor: p.panel,
      overflow: "hidden",
    },
    cardBody: { paddingHorizontal: 36, paddingBottom: 36, paddingTop: 14 },
    coverCard: { alignSelf: "stretch" },
    coverPage: { alignSelf: "stretch", marginHorizontal: -22 },
    wideRow: { flexDirection: "row", alignItems: "flex-start", gap: 30 },
    wideBody: { flex: 1, minWidth: 0, gap: 7, alignItems: "flex-start" },
    avatar: { position: "relative" },
    name: {
      fontFamily: fonts.serif,
      fontSize: 27,
      lineHeight: 33,
      letterSpacing: -0.3,
      color: p.ink,
      textAlign: "center",
    },
    nameWide: { fontSize: 36, lineHeight: 44, letterSpacing: -0.6, textAlign: "left" },
    headline: {
      fontFamily: fonts.sans,
      fontSize: 14.5,
      lineHeight: 20,
      letterSpacing: 0.1,
      color: p.body,
      textAlign: "center",
    },
    headlineWide: { fontSize: 15.5, lineHeight: 22, textAlign: "left" },
    placeholder: { color: p.subtle, fontStyle: "italic" },
    locationRow: { flexDirection: "row", alignItems: "center", gap: 5 },
    location: { fontFamily: fonts.sans, fontSize: 13, letterSpacing: 0.2, color: p.muted },
  });
