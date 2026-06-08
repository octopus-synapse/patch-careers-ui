/** Full-screen modal showing the resume preview + "Baixar PDF" (shared component). */
import { editorialPalette } from "@patch-careers/tokens";
import { X } from "lucide-react-native";
import type { ReactElement } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ResumePreview } from "../../../components/ResumePreview";
import { pf } from "../styles";

export function CvModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}): ReactElement {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
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
