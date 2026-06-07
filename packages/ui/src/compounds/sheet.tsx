/**
 * `<Sheet>` — bottom sheet on native, centered modal dialog on web.
 *
 * Native wraps `@tamagui/sheet` (handle, snap points, backdrop). On web a
 * bottom sheet reads wrong, so we render a centered card that mirrors the
 * onboarding editor modal: warm-paper panel (max 560px wide), a serif title +
 * close (X) header over a hairline divider, and a scrollable body.
 *
 * The `@tamagui/sheet` import is tagged `as unknown as ...` to relax Tamagui's
 * tight generic surface (loaded for its runtime, not its TS types).
 */

import { editorialPalette } from "@patch-careers/tokens";
import { Sheet as TamaguiSheet } from "@tamagui/sheet";
import { X } from "lucide-react-native";
import type { ComponentType, ReactNode } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { editorialFonts } from "../editorial/fonts";
import { asLoose, type LooseProps } from "../internal/tamagui-shim";

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
  /** Web centered-modal max width in px. Ignored on native. */
  webMaxWidth?: number;
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
        <X size={22} color={editorialPalette.muted} />
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
  children,
  ...rest
}: SheetProps) {
  const close = () => onOpenChange?.(false);

  if (Platform.OS === "web") {
    return (
      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.webOverlay}>
          {/* Backdrop — tap outside the card to dismiss. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={closeLabel ?? "Fechar"}
            style={StyleSheet.absoluteFill}
            onPress={close}
          />
          <View style={[styles.webCard, { maxWidth: webMaxWidth }]}>
            <SheetHeader title={title} onClose={close} closeLabel={closeLabel} />
            <View style={styles.webBody}>{children}</View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <TSheet
      modal
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
  );
}

const styles = StyleSheet.create({
  webOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,10,10,0.45)",
  },
  webCard: {
    width: "90%",
    height: "90%",
    backgroundColor: editorialPalette.bg,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  webBody: { flex: 1, minHeight: 0, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 },
  nativeBody: { flex: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: editorialPalette.hairline,
  },
  title: { fontFamily: editorialFonts.serif, fontSize: 22, color: editorialPalette.ink },
});

export { TSheet as SheetRoot };
