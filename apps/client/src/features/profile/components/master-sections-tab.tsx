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
import { useI18n } from "@/providers/i18n-provider";
import { usePf } from "../lib/styles";

export function MasterSectionsTab(): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const pf = usePf();
  const { resumeId, language, isLoading } = useMasterResumeId();
  const [cvOpen, setCvOpen] = useState(false);

  if (!resumeId && !isLoading) {
    return <Text style={pf.noResume}>{t("profile.master.onboardingRequired")}</Text>;
  }

  return (
    <View style={pf.masterTab}>
      <ResumeSectionsManager resumeId={resumeId} locale={resumeLanguageToLocale(language)} />

      {resumeId ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("profile.master.viewResumeA11y")}
          onPress={() => setCvOpen(true)}
          style={pf.cvButton}
        >
          <FileText size={18} color={palette.ink} strokeWidth={1.75} />
          <Text style={pf.cvButtonLabel}>{t("profile.master.viewResume")}</Text>
        </Pressable>
      ) : null}

      <ResumePreviewModal visible={cvOpen} onClose={() => setCvOpen(false)} resumeId={resumeId} />
    </View>
  );
}
