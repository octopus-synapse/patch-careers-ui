/**
 * <AvatarActionSheet> — bottom sheet offering the ways to set a profile
 * photo (take with the camera / pick from the library). Replaces the old
 * "tap → straight to the gallery" so the camera is reachable in one step.
 */
import { Sheet, Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { Camera, Image as ImageIcon, Trash2 } from "lucide-react-native";
import type { ComponentType, ReactElement } from "react";
import { Pressable } from "react-native";
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
      <YStack gap={10} paddingBottom={8}>
        {rows.map(({ key, label, icon: Icon, onPress, danger }) => {
          const tint = danger ? palette.danger : palette.ink;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={label}
              onPress={() => {
                onClose();
                onPress();
              }}
            >
              {({ pressed }) => (
                <XStack
                  alignItems="center"
                  gap={14}
                  paddingVertical={14}
                  paddingHorizontal={14}
                  borderWidth={1}
                  borderRadius={12}
                  borderColor={palette.hairline}
                  backgroundColor={pressed ? palette.surface : "transparent"}
                >
                  <Icon size={20} color={tint} strokeWidth={1.75} />
                  <Text color={tint} fontFamily={editorialFonts.sans} fontSize={15.5}>
                    {label}
                  </Text>
                </XStack>
              )}
            </Pressable>
          );
        })}
      </YStack>
    </Sheet>
  );
}
