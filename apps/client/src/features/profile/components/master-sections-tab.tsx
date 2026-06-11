/**
 * "Perfil" sub-tab body — the master resume's section manager plus the quick
 * CV preview button (the preview also lives on the Currículos sub-tab; here
 * it gives instant feedback while editing).
 */
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { FileText } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ResumePreviewModal } from "@/components/resume-preview-modal";
import { resumeLanguageToLocale, useMasterResumeId } from "@/features/resumes";
import { ResumeSectionsManager } from "@/features/sections";
import { usePf } from "../lib/styles";

export function MasterSectionsTab(): ReactElement {
  const palette = useEditorialPalette();
  const pf = usePf();
  const { resumeId, language, isLoading } = useMasterResumeId();
  const [cvOpen, setCvOpen] = useState(false);

  if (!resumeId && !isLoading) {
    return (
      <Text style={pf.noResume}>Conclua o onboarding para montar seu currículo principal.</Text>
    );
  }

  return (
    <View style={pf.masterTab}>
      <ResumeSectionsManager resumeId={resumeId} locale={resumeLanguageToLocale(language)} />

      {resumeId ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver currículo"
          onPress={() => setCvOpen(true)}
          style={pf.cvButton}
        >
          <FileText size={18} color={palette.ink} strokeWidth={1.75} />
          <Text style={pf.cvButtonLabel}>Ver currículo (CV)</Text>
        </Pressable>
      ) : null}

      <ResumePreviewModal visible={cvOpen} onClose={() => setCvOpen(false)} resumeId={resumeId} />
    </View>
  );
}
