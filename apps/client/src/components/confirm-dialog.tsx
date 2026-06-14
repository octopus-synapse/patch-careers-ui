/**
 * ConfirmDialog — a confirmation dialog in our Editorial Calm DS.
 *
 * Replaces the shared Tamagui `<DangerConfirmModal>` (default Dialog chrome:
 * bold sans title, generic buttons) which read off-brand against the rest of
 * the app. Built the same way as <ProfileMenu> — a self-contained RN Modal +
 * Animated card on a soft light scrim, serif heading, hairline rule, pill CTAs
 * — so it sits pixel-consistent with the drawer it's launched from.
 *
 * The `danger` variant tints the confirm pill red and fires a heavy haptic on
 * press (iOS HIG for destructive actions). Self-contained Modal — works on
 * native and web, so it deliberately does not reuse the shared bottom <Sheet>.
 */

import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
  radius,
} from "@patch-careers/tokens";
import { editorialFonts, useEditorialPalette, useThemeName } from "@patch-careers/ui/editorial";
import * as Haptics from "expo-haptics";
import type { ComponentType, ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useI18n } from "@/providers/i18n-provider";

// Slightly deeper than the ProfileMenu scrim — this sits on top of the drawer
// and needs to pull focus to the decision, but still reads calm on a light app.
// Dark mode dims harder so the card separates from the already-dark backdrop.
const SCRIM = { light: "rgba(10,10,10,0.32)", dark: "rgba(0,0,0,0.55)" } as const;
const USE_NATIVE_DRIVER = Platform.OS !== "web";

type GlyphProps = { size?: number; color?: string; strokeWidth?: number };
type Glyph = ComponentType<GlyphProps>;

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string | undefined;
  confirmLabel?: string | undefined;
  cancelLabel?: string | undefined;
  danger?: boolean | undefined;
  icon?: Glyph | undefined;
  onConfirm: () => void;
  onCancel?: (() => void) | undefined;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  danger = false,
  icon: Icon,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): ReactElement {
  const { t } = useI18n();
  const editorialPalette = useEditorialPalette();
  const styles = stylesByTheme[useThemeName()];
  const { width: screenW } = useWindowDimensions();
  const cardWidth = Math.min(380, screenW - 48);
  const resolvedCancel = cancelLabel ?? t("common.cancel");
  const resolvedConfirm = confirmLabel ?? (danger ? t("common.delete") : t("common.confirm"));

  // `anim`: 0 = hidden, 1 = shown. `visible` keeps the Modal mounted through
  // the exit animation before unmounting (mirrors <ProfileMenu>).
  const anim = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setVisible(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start(({ finished }) => {
        if (finished) setVisible(false);
      });
    }
  }, [open, anim]);

  const dismiss = (): void => {
    onCancel?.();
    onOpenChange(false);
  };

  const confirm = (): void => {
    if (danger && Platform.OS !== "web") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    onConfirm();
  };

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });
  const tint = danger ? editorialPalette.danger : editorialPalette.primary;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
      <View style={styles.root}>
        {/* Light scrim — tap outside the card to dismiss. */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: anim }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("app.confirmDialog.close")}
            style={StyleSheet.absoluteFill}
            onPress={dismiss}
          />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.card,
            { width: cardWidth, opacity: anim, transform: [{ translateY }, { scale }] },
          ]}
        >
          {/* Media-object header: the icon chip anchors the title + description
              block from a left column, rather than floating above it. */}
          <View style={styles.header}>
            {Icon ? (
              <View
                style={[
                  styles.iconChip,
                  { backgroundColor: danger ? "rgba(220,38,38,0.10)" : editorialPalette.bg },
                ]}
              >
                <Icon size={20} color={tint} strokeWidth={1.75} />
              </View>
            ) : null}
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              {description ? <Text style={styles.description}>{description}</Text> : null}
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={resolvedCancel}
              onPress={dismiss}
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed ? styles.cancelPressed : null,
              ]}
            >
              <Text style={[styles.buttonLabel, styles.cancelLabel]}>{resolvedCancel}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={resolvedConfirm}
              onPress={confirm}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: tint },
                pressed ? styles.confirmPressed : null,
              ]}
            >
              <Text style={[styles.buttonLabel, styles.confirmLabel]}>{resolvedConfirm}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const stylesFor = (p: EditorialPalette, scrim: string) =>
  StyleSheet.create({
    root: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    scrim: { backgroundColor: scrim },
    card: {
      backgroundColor: p.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: p.hairline,
      paddingHorizontal: 26,
      paddingTop: 26,
      paddingBottom: 22,
      shadowColor: "#000",
      shadowOpacity: 0.14,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 12 },
      elevation: 20,
    },
    header: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
    headerText: { flex: 1, paddingTop: 2 },
    iconChip: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontFamily: editorialFonts.serif,
      fontSize: 24,
      lineHeight: 30,
      letterSpacing: -0.4,
      color: p.ink,
    },
    description: {
      fontFamily: editorialFonts.sans,
      fontSize: 14.5,
      lineHeight: 21,
      color: p.muted,
      marginTop: 8,
    },
    actions: { flexDirection: "row", gap: 10, marginTop: 24 },
    button: {
      flex: 1,
      minHeight: 50,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 13,
      paddingHorizontal: 16,
    },
    cancelButton: {
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.hairlineStrong,
    },
    cancelPressed: { backgroundColor: p.bg },
    confirmPressed: { opacity: 0.88 },
    buttonLabel: { fontFamily: editorialFonts.sans, fontSize: 15, letterSpacing: 0.2 },
    cancelLabel: { color: p.ink, fontWeight: "500" },
    confirmLabel: { color: p.onPrimary, fontWeight: "600" },
  });

// Precomputed per theme so style-object identity is stable across renders.
const stylesByTheme = {
  light: stylesFor(editorialPalette, SCRIM.light),
  dark: stylesFor(editorialPaletteDark, SCRIM.dark),
} as const;
