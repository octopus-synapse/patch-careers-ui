/**
 * Full-screen modal showing a resume's realtime HTML preview + "Baixar PDF".
 * Generalization of the Profile tab's old CV modal: takes an optional
 * `resumeId` (omitted = master) so the Currículos sub-tab's eye icon and the
 * resume detail screen preview any resume.
 */
import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import {
  editorialFonts as fonts,
  useEditorialPalette,
  useThemeName,
} from "@patch-careers/ui/editorial";
import { X } from "lucide-react-native";
import type { ReactElement } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ResumePreview } from "@/components/resume-preview";
import { useI18n } from "@/providers/i18n-provider";

export function ResumePreviewModal({
  visible,
  onClose,
  resumeId,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  resumeId?: string | undefined;
  title?: string | undefined;
}): ReactElement {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const palette = useEditorialPalette();
  const styles = stylesByTheme[useThemeName()];
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      // Android Modal windows are not hardware-accelerated by default and the
      // chromium WebView inside ResumePreview renders blank without it.
      hardwareAccelerated
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {title ?? t("resumes.preview.title")}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("resumes.preview.close")}
            hitSlop={12}
            onPress={onClose}
          >
            <X size={22} color={palette.muted} />
          </Pressable>
        </View>
        <ResumePreview resumeId={resumeId} />
      </View>
    </Modal>
  );
}

const stylesFor = (p: EditorialPalette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: p.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: p.hairline,
      backgroundColor: p.surface,
    },
    title: { fontFamily: fonts.serif, fontSize: 20, color: p.ink, flex: 1, marginRight: 12 },
  });

// Precomputed per theme so style-object identity is stable across renders.
const stylesByTheme = {
  light: stylesFor(editorialPalette),
  dark: stylesFor(editorialPaletteDark),
} as const;
