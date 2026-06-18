/**
 * "Perfil" sub-tab body — the profile fields group (identity / about / links
 * as tappable rows) followed by the master resume's section manager and a quick
 * CV preview button. Editing a profile field and editing a resume entry now use
 * the exact same row→sheet gesture.
 */
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { ChevronRight } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ResumePreviewModal } from "@/components/resume-preview-modal";
import { ResumeThumbnail } from "@/components/resume-thumbnail";
import { resumeLanguageToLocale, useMasterResumeId } from "@/features/resumes";
import { ResumeSectionsManager } from "@/features/sections";
import { useI18n } from "@/providers/i18n-provider";
import type { EditableProfile, ProfileFieldKey } from "../lib/profile-fields";
import { usePf } from "../lib/styles";
import { ProfileFieldsSection } from "./profile-fields-section";

export function MasterSectionsTab({
  profile,
  onEdit,
}: {
  profile: EditableProfile | undefined;
  onEdit: (key: ProfileFieldKey) => void;
}): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const pf = usePf();
  const { resumeId, language, isLoading } = useMasterResumeId();
  const [cvOpen, setCvOpen] = useState(false);

  return (
    <View style={pf.masterTab}>
      <ProfileFieldsSection profile={profile} onEdit={onEdit} />

      {!resumeId && !isLoading ? (
        <Text style={pf.noResume}>{t("profile.master.onboardingRequired")}</Text>
      ) : (
        <>
          <ResumeSectionsManager resumeId={resumeId} locale={resumeLanguageToLocale(language)} />

          {resumeId ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("profile.master.viewResumeA11y")}
              onPress={() => setCvOpen(true)}
              style={pf.previewBanner}
            >
              <ResumeThumbnail resumeId={resumeId} width={46} height={62} radius={8} />
              <View style={pf.previewBannerBody}>
                <Text style={pf.previewBannerTitle}>{t("profile.master.viewResume")}</Text>
                <Text style={pf.previewBannerMeta}>{t("profile.master.previewHint")}</Text>
              </View>
              <ChevronRight size={18} color={palette.subtle} strokeWidth={1.75} />
            </Pressable>
          ) : null}

          <ResumePreviewModal
            visible={cvOpen}
            onClose={() => setCvOpen(false)}
            resumeId={resumeId}
          />
        </>
      )}
    </View>
  );
}
