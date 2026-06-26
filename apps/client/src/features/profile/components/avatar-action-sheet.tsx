/**
 * <AvatarActionSheet> — bottom sheet offering the ways to set a profile
 * photo (take with the camera / pick from the library). Replaces the old
 * "tap → straight to the gallery" so the camera is reachable in one step.
 */
import { Sheet } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { Camera, Image as ImageIcon, Trash2 } from "lucide-react-native";
import type { ComponentType, ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useI18n } from "@/providers/i18n-provider";

type GlyphProps = { size?: number; color?: string; strokeWidth?: number };

export function AvatarActionSheet({
  open,
  onClose,
  onCamera,
  onGallery,
  onRemove,
  canRemove = false,
}: {
  open: boolean;
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
  onRemove?: () => void;
  canRemove?: boolean;
}): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();

  const rows: {
    key: string;
    label: string;
    icon: ComponentType<GlyphProps>;
    onPress: () => void;
    danger?: boolean;
  }[] = [
    { key: "camera", label: t("profile.photo.camera"), icon: Camera, onPress: onCamera },
    { key: "gallery", label: t("profile.photo.gallery"), icon: ImageIcon, onPress: onGallery },
    ...(canRemove && onRemove
      ? [
          {
            key: "remove",
            label: t("profile.photo.remove"),
            icon: Trash2,
            onPress: onRemove,
            danger: true,
          },
        ]
      : []),
  ];

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t("profile.photo.title")}
    >
      <View style={styles.list}>
        {rows.map(({ key, label, icon: Icon, onPress, danger }) => {
          const tint = danger ? palette.danger : palette.ink;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={label}
              style={({ pressed }) => [
                styles.row,
                { borderColor: palette.hairline },
                pressed ? { backgroundColor: palette.surface } : null,
              ]}
              onPress={() => {
                onClose();
                onPress();
              }}
            >
              <Icon size={20} color={tint} strokeWidth={1.75} />
              <Text style={[styles.label, { color: tint }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10, paddingBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  label: { fontFamily: editorialFonts.sans, fontSize: 15.5 },
});
