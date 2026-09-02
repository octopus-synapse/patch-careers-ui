/**
 * ProfileMenu — the account menu that opens from the header avatar.
 *
 * Echoes the LinkedIn "me" menu shape, rebuilt in our Editorial Calm DS: a
 * tappable profile card (avatar · name · headline · location) over a hairline,
 * a short list of account shortcuts, and a sign-out action pinned to the bottom.
 *
 * Presented as a left-anchored drawer (not a bottom sheet): a full-height paper
 * panel slides in from the left over a soft, light scrim so it reads right on a
 * light app. Self-contained Modal + Animated panel — works on native and web,
 * so it deliberately does not reuse the shared bottom <Sheet>.
 */

import { logout } from "@patch-careers/auth";
import { type EditorialOverlays, editorialOverlays } from "@patch-careers/tokens";
import {
  editorialFonts,
  FrostedFill,
  IdentityAvatar,
  useEditorialPalette,
  useThemeName,
} from "@patch-careers/ui/editorial";
import { type Href, useRouter } from "expo-router";
import { ChevronRight, LogOut, MapPin, Settings } from "lucide-react-native";
import type { ComponentType, ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AUTH_SIGN_IN_ROUTE } from "@/navigation/auth-redirect";
import { useI18n } from "@/providers/i18n-provider";
import { ConfirmDialog } from "./confirm-dialog";

// The scrim and the black frosted drawer material (matching the
// EditorialTabBar's translucent glass rather than flat grey paper) are alpha
// washes, so they live in `editorialOverlays` rather than the opaque palette.
// translateX/opacity ride the native driver; web falls back to JS animation.
const USE_NATIVE_DRIVER = Platform.OS !== "web";

// Lucide icons are rendered directly (same as the shared sheet's close X)
// rather than through the themed <Icon> wrapper, so colors stay anchored to
// the editorial palette regardless of the active Tamagui theme.
type GlyphProps = { size?: number; color?: string; strokeWidth?: number };
type Glyph = ComponentType<GlyphProps>;

export type ProfileMenuProps = {
  open: boolean;
  onClose: () => void;
  name: string;
  headline?: string | undefined;
  location?: string | undefined;
  photoURL?: string | undefined;
};

function MenuRow({
  icon: Icon,
  label,
  onPress,
  danger = false,
}: {
  icon: Glyph;
  label: string;
  onPress: () => void;
  danger?: boolean;
}): ReactElement {
  const theme = useThemeName();
  const editorialPalette = useEditorialPalette();
  const overlays = editorialOverlays[theme];
  const styles = stylesByTheme[theme];
  const tint = danger ? editorialPalette.danger : overlays.onGlassInk;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
    >
      <Icon
        size={20}
        color={danger ? editorialPalette.danger : overlays.onGlassBody}
        strokeWidth={1.75}
      />
      <Text style={[styles.rowLabel, { color: tint }]}>{label}</Text>
      {danger ? null : <ChevronRight size={18} color={overlays.onGlassSubtle} strokeWidth={1.75} />}
    </Pressable>
  );
}

export function ProfileMenu({
  open,
  onClose,
  name,
  headline,
  location,
  photoURL,
}: ProfileMenuProps): ReactElement {
  const { t } = useI18n();
  const theme = useThemeName();
  const styles = stylesByTheme[theme];
  const overlays = editorialOverlays[theme];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const panelWidth = Math.min(360, screenW * 0.86);

  // `anim`: 0 = closed (off-screen left), 1 = open. `visible` keeps the Modal
  // mounted through the exit animation before unmounting.
  const anim = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(open);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  // Set when the user taps sign-out: the confirm dialog is opened only AFTER
  // the drawer Modal has fully dismissed (below), never in the same tick — on
  // iOS presenting a second Modal while the first is still on screen leaves a
  // stuck, invisible modal that swallows touches (frozen app, no dialog).
  const pendingLogoutRef = useRef(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start(({ finished }) => {
        if (!finished) return;
        setVisible(false);
        // Drawer Modal is now unmounted — safe to present the confirm dialog.
        if (pendingLogoutRef.current) {
          pendingLogoutRef.current = false;
          setLogoutConfirmOpen(true);
        }
      });
    }
  }, [open, anim]);

  const go = (path: Href): void => {
    onClose();
    router.push(path);
  };

  // Logout is destructive, so it's gated behind a confirm dialog. Both the
  // drawer and <ConfirmDialog> are native RN Modals, so we flag the intent and
  // close the drawer; the confirm opens once the drawer Modal has fully
  // dismissed (see the close-animation callback) — never stacked on top of it.
  const requestLogout = (): void => {
    pendingLogoutRef.current = true;
    onClose();
  };

  const performLogout = async (): Promise<void> => {
    setLogoutConfirmOpen(false);
    await logout();
    // The (tabs) gate redirects on the store reset; replace makes it immediate.
    router.replace(AUTH_SIGN_IN_ROUTE);
  };

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-panelWidth, 0],
  });

  return (
    <>
      <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
        <View style={styles.root}>
          {/* Light scrim — tap outside the panel to dismiss. */}
          <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: anim }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("profile.menu.closeA11y")}
              style={StyleSheet.absoluteFill}
              onPress={onClose}
            />
          </Animated.View>

          {/* Left-anchored full-height panel. */}
          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.panel,
              {
                width: panelWidth,
                paddingTop: insets.top + 28,
                paddingBottom: insets.bottom + 18,
                transform: [{ translateX }],
              },
            ]}
          >
            <FrostedFill variant="ink" />
            <ScrollView
              style={styles.scroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollBody}
            >
              {/* Profile card — avatar stacked over name, taps through to profile. */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("profile.menu.viewProfileOfA11y", { name })}
                onPress={() => go("/profile")}
                style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
              >
                <IdentityAvatar photoURL={photoURL} name={name} size={80} />
                <View style={styles.cardText}>
                  <Text style={styles.name} numberOfLines={2}>
                    {name}
                  </Text>
                  {headline ? (
                    <Text style={styles.headline} numberOfLines={2}>
                      {headline}
                    </Text>
                  ) : null}
                  {location ? (
                    <View style={styles.locationRow}>
                      {/* On-glass ramp, not the palette: this sits on black
                          glass, so a palette grey would read as a smudge next
                          to the white text it labels. */}
                      <MapPin size={13} color={overlays.onGlassMuted} strokeWidth={1.75} />
                      <Text style={styles.location} numberOfLines={1}>
                        {location}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>

              {/* Hairline under the profile hero, mirroring the one above the
                  footer (Configurações / Sair). */}
              <View style={styles.divider} />
            </ScrollView>

            {/* Settings + sign-out pinned to the bottom, mirroring the
                LinkedIn "me" menu. */}
            <View style={styles.footer}>
              <MenuRow
                icon={Settings}
                label={t("profile.menu.settings")}
                onPress={() => go("/settings")}
              />
              <MenuRow
                icon={LogOut}
                label={t("profile.menu.signOut")}
                danger
                onPress={requestLogout}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>

      <ConfirmDialog
        open={logoutConfirmOpen}
        onOpenChange={setLogoutConfirmOpen}
        danger
        icon={LogOut}
        title={t("profile.menu.signOutConfirm.title")}
        description={t("profile.menu.signOutConfirm.description")}
        confirmLabel={t("profile.menu.signOutConfirm.confirm")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => void performLogout()}
      />
    </>
  );
}

// Takes the whole overlay set, not just the scrim: every on-glass color below
// has to resolve per theme too, or the dark branch renders the light values.
const stylesFor = (ov: EditorialOverlays) =>
  // @style-allow stylesheet: animated profile drawer (Animated.Value slide-in transitions)
  StyleSheet.create({
    root: { flex: 1 },
    scrim: { backgroundColor: ov.scrimPanel },
    panel: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      borderRightWidth: 1,
      borderRightColor: ov.onGlassHairline,
      overflow: "hidden",
      paddingHorizontal: 24,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 24,
      shadowOffset: { width: 6, height: 0 },
      elevation: 18,
    },
    scroll: { flex: 1 },
    scrollBody: { gap: 6, paddingTop: 4 },
    card: {
      alignItems: "center",
      gap: 12,
      paddingTop: 8,
      paddingBottom: 14,
      paddingHorizontal: 4,
      borderRadius: 16,
    },
    cardPressed: { backgroundColor: ov.onGlassPressed },
    cardText: { gap: 6, width: "100%", alignItems: "center" },
    name: {
      fontFamily: editorialFonts.serif,
      fontSize: 24,
      lineHeight: 30,
      color: ov.onGlassInk,
      textAlign: "center",
    },
    headline: {
      fontFamily: editorialFonts.sans,
      fontSize: 14,
      lineHeight: 20,
      color: ov.onGlassBody,
      textAlign: "center",
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      marginTop: 3,
    },
    location: { fontFamily: editorialFonts.sans, fontSize: 13, color: ov.onGlassMuted },
    divider: {
      height: 1,
      backgroundColor: ov.onGlassHairline,
      marginTop: 16,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      paddingVertical: 15,
      paddingHorizontal: 4,
      borderRadius: 12,
    },
    rowPressed: { backgroundColor: ov.onGlassPressed },
    rowLabel: { flex: 1, fontFamily: editorialFonts.sans, fontSize: 15.5 },
    footer: {
      borderTopWidth: 1,
      borderTopColor: ov.onGlassHairline,
      paddingTop: 10,
      marginTop: 12,
    },
  });

// Precomputed per theme so style-object identity is stable across renders.
const stylesByTheme = {
  light: stylesFor(editorialOverlays.light),
  dark: stylesFor(editorialOverlays.dark),
} as const;
