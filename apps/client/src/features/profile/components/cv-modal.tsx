/** Full-screen modal showing the resume preview + "Baixar PDF" (shared component). */
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { X } from "lucide-react-native";
import type { ReactElement } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ResumePreview } from "@/components/resume-preview";
import { usePf } from "../lib/styles";

export function CvModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}): ReactElement {
  const insets = useSafeAreaInsets();
  const editorialPalette = useEditorialPalette();
  const pf = usePf();
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
      <View style={[pf.cvModalRoot, { paddingTop: insets.top }]}>
        <View style={pf.cvModalHeader}>
          <Text style={pf.cvModalTitle}>Currículo</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            hitSlop={12}
            onPress={onClose}
          >
            <X size={22} color={editorialPalette.muted} />
          </Pressable>
        </View>
        <ResumePreview />
      </View>
    </Modal>
  );
}
