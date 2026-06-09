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
import { editorialPalette } from "@patch-careers/tokens";
import { Avatar } from "@patch-careers/ui";
import { editorialFonts } from "@patch-careers/ui/editorial";
import { type Href, useRouter } from "expo-router";
import { ChevronRight, FileText, LogOut, MapPin, Send, User } from "lucide-react-native";
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
import { AUTH_SIGN_IN_ROUTE } from "@/navigation/authRedirect";
import { ConfirmDialog } from "./confirm-dialog";

// Soft, light scrim — the app is light, so a heavy dark dim reads wrong.
const SCRIM = "rgba(10,10,10,0.18)";
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
  const tint = danger ? editorialPalette.danger : editorialPalette.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
    >
      <Icon
        size={20}
        color={danger ? editorialPalette.danger : editorialPalette.body}
        strokeWidth={1.75}
      />
      <Text style={[styles.rowLabel, { color: tint }]}>{label}</Text>
      {danger ? null : (
        <ChevronRight size={18} color={editorialPalette.subtle} strokeWidth={1.75} />
      )}
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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const panelWidth = Math.min(360, screenW * 0.86);

  // `anim`: 0 = closed (off-screen left), 1 = open. `visible` keeps the Modal
  // mounted through the exit animation before unmounting.
  const anim = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(open);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

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
        if (finished) setVisible(false);
      });
    }
  }, [open, anim]);

  const go = (path: Href): void => {
    onClose();
    router.push(path);
  };

  // Logout is destructive, so it's gated behind a confirm dialog. Both the
  // drawer and <ConfirmDialog> are native RN Modals, so we close the drawer
  // first, then open the confirm — the actual sign-out only runs on confirm.
  const requestLogout = (): void => {
    onClose();
    setLogoutConfirmOpen(true);
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
              accessibilityLabel="Fechar menu da conta"
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
            <ScrollView
              style={styles.scroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollBody}
            >
              {/* Profile card — avatar stacked over name, taps through to profile. */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Ver perfil de ${name}`}
                onPress={() => go("/profile")}
                style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
              >
                <Avatar src={photoURL} name={name} size="lg" />
                <View style={styles.cardText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {name}
                  </Text>
                  {headline ? (
                    <Text style={styles.headline} numberOfLines={2}>
                      {headline}
                    </Text>
                  ) : null}
                  {location ? (
                    <View style={styles.locationRow}>
                      <MapPin size={13} color={editorialPalette.subtle} strokeWidth={1.75} />
                      <Text style={styles.location} numberOfLines={1}>
                        {location}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>

              <View style={styles.divider} />

              <MenuRow icon={User} label="Ver meu perfil" onPress={() => go("/profile")} />
              <MenuRow icon={FileText} label="Meu currículo" onPress={() => go("/resume")} />
              <MenuRow icon={Send} label="Candidaturas" onPress={() => go("/applications")} />
            </ScrollView>

            {/* Sign-out pinned to the bottom, mirroring the LinkedIn "me" menu. */}
            <View style={styles.footer}>
              <MenuRow icon={LogOut} label="Sair da conta" danger onPress={requestLogout} />
            </View>
          </Animated.View>
        </View>
      </Modal>

      <ConfirmDialog
        open={logoutConfirmOpen}
        onOpenChange={setLogoutConfirmOpen}
        danger
        icon={LogOut}
        title="Sair da conta?"
        description="Você vai precisar entrar de novo para voltar."
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        onConfirm={() => void performLogout()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrim: { backgroundColor: SCRIM },
  panel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: editorialPalette.surface,
    borderRightWidth: 1,
    borderRightColor: editorialPalette.hairline,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 4, height: 0 },
    elevation: 16,
  },
  scroll: { flex: 1 },
  scrollBody: { gap: 6, paddingTop: 4 },
  card: {
    alignItems: "flex-start",
    gap: 16,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 16,
  },
  cardPressed: { backgroundColor: editorialPalette.bg },
  cardText: { gap: 6, width: "100%" },
  name: {
    flexShrink: 1,
    fontFamily: editorialFonts.serif,
    fontSize: 23,
    lineHeight: 30,
    color: editorialPalette.ink,
  },
  headline: {
    fontFamily: editorialFonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: editorialPalette.body,
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  location: { fontFamily: editorialFonts.sans, fontSize: 12.5, color: editorialPalette.muted },
  divider: {
    height: 1,
    backgroundColor: editorialPalette.hairline,
    marginVertical: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 15,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  rowPressed: { backgroundColor: editorialPalette.bg },
  rowLabel: { flex: 1, fontFamily: editorialFonts.sans, fontSize: 15.5 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: editorialPalette.hairline,
    paddingTop: 10,
    marginTop: 12,
  },
});
