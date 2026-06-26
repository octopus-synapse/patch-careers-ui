/**
 * `<Sheet>` — bottom sheet on native, centered modal dialog on web.
 *
 * Native wraps `@tamagui/sheet` (handle, snap points, backdrop). On web a
 * bottom sheet reads wrong, so we render a centered card that mirrors the
 * onboarding editor modal: warm-paper panel (max 560px wide / 90% wide,
 * height grows with content up to the safe area above the keyboard), a
 * serif title + close (X) header over a hairline divider, and a scrollable
 * body. `presentation="card"` opts native into that same centered card —
 * used by the catalog pickers so they match the section editor modal.
 *
 * The `@tamagui/sheet` import is tagged `as unknown as ...` to relax Tamagui's
 * tight generic surface (loaded for its runtime, not its TS types).
 */

import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import { Sheet as TamaguiSheet } from "@tamagui/sheet";
import { X } from "lucide-react-native";
import type { ComponentType, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { editorialFonts } from "../editorial/fonts";
import { asLoose, type LooseProps } from "../internal/tamagui-shim";
import { useEditorialPalette } from "../internal/use-editorial-palette";
import { useThemeName } from "../internal/use-theme-name";

type SheetCompound = ComponentType<LooseProps> & {
  Overlay: ComponentType<LooseProps>;
  Handle: ComponentType<LooseProps>;
  Frame: ComponentType<LooseProps>;
};

const TSheet = asLoose<SheetCompound>(TamaguiSheet);

export type SheetProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Header title; renders a serif title + close (X) bar over a hairline. */
  title?: string;
  /** Accessible label for the close affordances (backdrop + X). */
  closeLabel?: string;
  /** Default snap points (% of screen) — native bottom sheet only. */
  snapPoints?: number[];
  /** Centered-card max width in px (web always; native with `card`). */
  webMaxWidth?: number;
  /**
   * Native presentation: `"sheet"` (default) is the Tamagui bottom sheet;
   * `"card"` is the web-style centered card (matches the editor modal).
   * Web always renders the card.
   */
  presentation?: "sheet" | "card";
  /**
   * Card presentation only: fill the available height (between the safe-area
   * insets) instead of growing with content. Use for search/list pickers so
   * the panel stays tall and stable while results stream in, matching the
   * section editor modal — without it the card collapses to the search box.
   */
  fillHeight?: boolean;
  children?: ReactNode;
};

function SheetHeader({
  title,
  onClose,
  closeLabel,
}: {
  title?: string | undefined;
  onClose: () => void;
  closeLabel?: string | undefined;
}) {
  const palette = useEditorialPalette();
  const styles = stylesByTheme[useThemeName()];
  if (!title) return null;
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={closeLabel ?? "Fechar"}
        hitSlop={12}
        onPress={onClose}
      >
        <X size={22} color={palette.muted} />
      </Pressable>
    </View>
  );
}

export function Sheet({
  open = false,
  onOpenChange,
  title,
  closeLabel,
  snapPoints = [85, 50, 25],
  webMaxWidth = 560,
  presentation = "sheet",
  fillHeight = false,
  children,
  ...rest
}: SheetProps) {
  const styles = stylesByTheme[useThemeName()];
  const insets = useSafeAreaInsets();
  const close = () => onOpenChange?.(false);

  if (Platform.OS === "web" || presentation === "card") {
    return (
      <Modal
        visible={open}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={close}
      >
        <KeyboardAvoidingView
          // Keep the centered card inside the safe area so it never slides up
          // under the status bar when the keyboard shrinks the avail. height.
          style={[
            styles.webOverlay,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 },
          ]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Backdrop — tap outside the card to dismiss. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={closeLabel ?? "Fechar"}
            style={StyleSheet.absoluteFill}
            onPress={close}
          />
          <View
            style={[
              styles.webCard,
              { maxWidth: webMaxWidth },
              fillHeight ? styles.webCardFill : null,
            ]}
          >
            <SheetHeader title={title} onClose={close} closeLabel={closeLabel} />
            <View style={styles.webBody}>{children}</View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  // Native: with `modal`, the Tamagui sheet portals to the app ROOT, which
  // sits behind any RN `Modal` already on screen (e.g. the section editors) —
  // the sheet would open invisibly. Hosting it inside its own RN Modal keeps
  // it in the frontmost window, so it stacks above modal-presented content
  // and looks the same when opened from a plain screen.
  return (
    <Modal
      visible={open}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={close}
    >
      <TSheet
        modal={false}
        open={open}
        onOpenChange={onOpenChange}
        dismissOnSnapToBottom
        snapPoints={snapPoints}
        animation="medium"
        {...(rest as LooseProps)}
      >
        <TSheet.Overlay animation="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        <TSheet.Handle />
        <TSheet.Frame padding={0}>
          <SheetHeader title={title} onClose={close} closeLabel={closeLabel} />
          <View style={styles.nativeBody}>{children}</View>
        </TSheet.Frame>
      </TSheet>
    </Modal>
  );
}

const stylesFor = (p: EditorialPalette, scrim: string) =>
  StyleSheet.create({
    webOverlay: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: scrim,
    },
    webCard: {
      width: "90%",
      // Grow with content (search box + results) up to the available space, so
      // the card stays compact when empty and the keyboard never covers the
      // input. The body's flex:1 ScrollView takes over scrolling at the cap.
      maxHeight: "100%",
      backgroundColor: p.bg,
      borderRadius: 22,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      // Android shadow when the card presentation renders natively.
      elevation: 12,
    },
    // Fill the safe-area height (search/list pickers) so the panel is tall and
    // stable instead of collapsing to the search box before results arrive.
    webCardFill: { flex: 1 },
    webBody: { flex: 1, minHeight: 0, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 },
    nativeBody: { flex: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 22,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: p.hairline,
    },
    title: { fontFamily: editorialFonts.serif, fontSize: 22, color: p.ink },
  });

const stylesByTheme = {
  light: stylesFor(editorialPalette, "rgba(10,10,10,0.45)"),
  dark: stylesFor(editorialPaletteDark, "rgba(0,0,0,0.6)"),
} as const;

export { TSheet as SheetRoot };
