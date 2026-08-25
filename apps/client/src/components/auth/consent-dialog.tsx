/**
 * ConsentDialog — the sign-up consent gate.
 *
 * The Terms of Service and Privacy Policy are rendered IN the dialog (from
 * the `legal.*` dictionary, version-locked to the payload's TOS/PRIVACY
 * versions), not linked out: the user reads here and "Accept" only unlocks
 * once the scroll reaches the end. Minimal chrome — serif title, a close
 * glyph top-right, the two documents, one pill. No secondary action.
 *
 * Self-contained RN Modal + Animated card on the dialog scrim, same
 * construction as <ConfirmDialog> so it sits pixel-consistent with it.
 */

import {
  type EditorialOverlays,
  type EditorialPalette,
  editorialOverlays,
  editorialPalette,
  editorialPaletteDark,
  radius,
} from "@patch-careers/tokens";
import { editorialFonts, useEditorialPalette, useThemeName } from "@patch-careers/ui/editorial";
import { X } from "lucide-react-native";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useI18n } from "@/providers/i18n-provider";

const USE_NATIVE_DRIVER = Platform.OS !== "web";
const SECTIONS = [1, 2, 3, 4, 5, 6] as const;
const DOCS = ["terms", "privacy"] as const;
/** How close to the bottom (px) counts as "read to the end". */
const END_THRESHOLD = 24;

export type ConsentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accept → the screen submits the signup with the published versions. */
  onAccept: () => void;
  loading?: boolean | undefined;
  testID?: string | undefined;
};

export function ConsentDialog({
  open,
  onOpenChange,
  onAccept,
  loading = false,
  testID,
}: ConsentDialogProps): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const theme = useThemeName();
  const styles = stylesByTheme[theme];
  const { width: screenW, height: screenH } = useWindowDimensions();
  const cardWidth = Math.min(560, screenW - 48);
  const cardMaxHeight = Math.min(720, screenH - 64);

  const anim = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(open);
  // Reset the read gate every time the dialog opens.
  const [reachedEnd, setReachedEnd] = useState(false);

  useEffect(() => {
    if (open) {
      setReachedEnd(false);
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

  const dismiss = (): void => onOpenChange(false);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>): void => {
    if (reachedEnd) return;
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - END_THRESHOLD) {
      setReachedEnd(true);
    }
  };
  // Short viewports (or huge screens) may fit everything without scrolling.
  const onContentSizeChange = (_w: number, h: number): void => {
    if (scrollHeight.current > 0 && h <= scrollHeight.current + END_THRESHOLD) setReachedEnd(true);
  };
  const scrollHeight = useRef(0);

  const canAccept = reachedEnd && !loading;
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
      <View style={styles.root}>
        {/* Soft scrim — the same wash the global search modal uses. */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: anim }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("auth.consentClose")}
            style={StyleSheet.absoluteFill}
            onPress={dismiss}
          />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.card,
            {
              width: cardWidth,
              maxHeight: cardMaxHeight,
              opacity: anim,
              transform: [{ translateY }, { scale }],
            },
          ]}
          {...(testID ? { testID } : {})}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t("auth.consentDialogTitle")}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("auth.consentClose")}
              onPress={dismiss}
              hitSlop={10}
              style={({ pressed }) => [styles.close, pressed ? styles.closePressed : null]}
              {...(testID ? { testID: `${testID}.close` } : {})}
            >
              <X size={18} color={palette.muted} strokeWidth={1.75} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            onScroll={onScroll}
            scrollEventThrottle={48}
            onLayout={(e) => {
              scrollHeight.current = e.nativeEvent.layout.height;
            }}
            onContentSizeChange={onContentSizeChange}
            showsVerticalScrollIndicator
            {...(testID ? { testID: `${testID}.scroll` } : {})}
          >
            {DOCS.map((doc, index) => (
              <View key={doc} style={index > 0 ? styles.docSpacing : null}>
                <Text style={styles.docTitle}>{t(`legal.${doc}.title`)}</Text>
                <Text style={styles.docMeta}>{t("legal.updated")}</Text>
                {SECTIONS.map((n) => (
                  <View key={n} style={styles.section}>
                    <Text style={styles.sectionHeading}>{t(`legal.${doc}.s${n}h`)}</Text>
                    <Text style={styles.sectionBody}>{t(`legal.${doc}.s${n}p`)}</Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            {reachedEnd ? null : <Text style={styles.hint}>{t("auth.consentScrollHint")}</Text>}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("auth.consentAccept")}
              accessibilityState={{ disabled: !canAccept }}
              disabled={!canAccept}
              onPress={onAccept}
              style={({ pressed }) => [
                styles.accept,
                !canAccept ? styles.acceptDisabled : null,
                pressed && canAccept ? styles.acceptPressed : null,
              ]}
              {...(testID ? { testID: `${testID}.accept` } : {})}
            >
              {loading ? (
                <ActivityIndicator color={palette.onPrimary} />
              ) : (
                <Text style={styles.acceptLabel}>{t("auth.consentAccept")}</Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const stylesFor = (p: EditorialPalette, ov: EditorialOverlays) =>
  // @style-allow stylesheet: animated consent dialog (Animated.Value enter/exit transitions)
  StyleSheet.create({
    root: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    scrim: { backgroundColor: ov.scrimDialog },
    card: {
      backgroundColor: p.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: p.hairline,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: 0.14,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 12 },
      elevation: 20,
    },
    header: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 56,
      paddingTop: 26,
      paddingBottom: 18,
      borderBottomWidth: 1,
      borderBottomColor: p.hairline,
    },
    title: {
      fontFamily: editorialFonts.serif,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.4,
      color: p.ink,
      textAlign: "center",
    },
    close: {
      position: "absolute",
      right: 16,
      top: 22,
      width: 36,
      height: 36,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    closePressed: { backgroundColor: p.bg },
    scroll: { flexGrow: 0, flexShrink: 1 },
    scrollContent: { paddingHorizontal: 26, paddingTop: 20, paddingBottom: 24 },
    docSpacing: { marginTop: 32, paddingTop: 28, borderTopWidth: 1, borderTopColor: p.hairline },
    docTitle: {
      fontFamily: editorialFonts.serif,
      fontSize: 19,
      lineHeight: 24,
      letterSpacing: -0.2,
      color: p.ink,
    },
    docMeta: {
      fontFamily: editorialFonts.mono,
      fontSize: 12,
      lineHeight: 16,
      color: p.subtle,
      marginTop: 6,
      marginBottom: 8,
    },
    section: { marginTop: 18 },
    sectionHeading: {
      fontFamily: editorialFonts.sans,
      fontSize: 15.5,
      lineHeight: 22,
      fontWeight: "600",
      color: p.ink,
    },
    sectionBody: {
      fontFamily: editorialFonts.sans,
      fontSize: 15,
      lineHeight: 24,
      color: p.muted,
      marginTop: 4,
    },
    footer: {
      paddingHorizontal: 26,
      paddingTop: 14,
      paddingBottom: 20,
      borderTopWidth: 1,
      borderTopColor: p.hairline,
      gap: 10,
    },
    hint: {
      fontFamily: editorialFonts.mono,
      fontSize: 11,
      lineHeight: 16,
      color: p.subtle,
      textAlign: "center",
    },
    accept: {
      minHeight: 50,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 13,
      paddingHorizontal: 16,
      backgroundColor: p.primary,
    },
    acceptDisabled: { opacity: 0.4 },
    acceptPressed: { opacity: 0.88 },
    acceptLabel: {
      fontFamily: editorialFonts.sans,
      fontSize: 15,
      letterSpacing: 0.2,
      fontWeight: "600",
      color: p.onPrimary,
    },
  });

const stylesByTheme = {
  light: stylesFor(editorialPalette, editorialOverlays.light),
  dark: stylesFor(editorialPaletteDark, editorialOverlays.dark),
} as const;
