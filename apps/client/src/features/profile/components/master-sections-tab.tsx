/**
 * "Perfil" sub-tab body — a settings-style list of supersections (Identidade,
 * then each master-resume section the user has actually filled: Experiência,
 * Formação, …). Empty section types are NOT listed; they live only behind the
 * big "add" button at the end, which opens the catalog picker (AddSectionFlow).
 * Each existing row pushes its own detail screen, keeping the tab a clean index.
 * Below the list sit the resume quality panel and the CV preview banner.
 */
import { SettingsCard, SettingsRow, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import {
  Award,
  BadgeCheck,
  Briefcase,
  ChevronRight,
  FileText,
  FolderGit2,
  GraduationCap,
  HeartHandshake,
  Languages,
  Link as LinkIcon,
  Sparkles,
  User,
} from "lucide-react-native";
import { type ComponentType, type ReactElement, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ResumeThumbnail } from "@/components/resume-thumbnail";
import {
  ResumePreviewModal,
  ResumeQualityPanel,
  resumeLanguageToLocale,
  useMasterResumeId,
} from "@/features/resumes";
import { type MergedSection, useResumeSections } from "@/features/sections";
import { useI18n } from "@/providers/i18n-provider";
import type { EditableProfile } from "../lib/profile-fields";
import { usePf } from "../lib/styles";

type Glyph = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

/** A lucide glyph per section, matched loosely on the section-type key. */
function iconForSection(section: MergedSection): Glyph {
  const k = section.key.toUpperCase();
  if (k.includes("EXPERIENCE") || k.includes("WORK")) return Briefcase;
  if (k.includes("EDUCATION")) return GraduationCap;
  if (k.includes("SKILL")) return Sparkles;
  if (k.includes("PROJECT")) return FolderGit2;
  if (k.includes("SUMMARY")) return FileText;
  if (k.includes("LINK") || k.includes("ONLINE")) return LinkIcon;
  if (k.includes("VOLUNTEER")) return HeartHandshake;
  if (k.includes("CERT")) return BadgeCheck;
  if (k.includes("LANG")) return Languages;
  if (k.includes("AWARD") || k.includes("HONOR")) return Award;
  return FileText;
}

export function MasterSectionsTab({
  profile,
}: {
  profile: EditableProfile | undefined;
}): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const pf = usePf();
  const router = useRouter();
  const { resumeId, language, isLoading } = useMasterResumeId();
  const locale = resumeLanguageToLocale(language);
  const { visible } = useResumeSections(resumeId, locale);
  const [cvOpen, setCvOpen] = useState(false);

  if (!resumeId && !isLoading) {
    return <Text style={pf.noResume}>{t("profile.master.onboardingRequired")}</Text>;
  }

  return (
    <View style={pf.masterTab}>
      <SettingsCard>
        <SettingsRow
          first
          icon={User}
          label={t("profile.sections.identity")}
          value={profile?.name ?? undefined}
          onPress={() => router.push("/profile/identity")}
        />
        {visible.map((section) => (
          <SettingsRow
            key={section.key}
            icon={iconForSection(section)}
            label={section.title}
            value={String(section.items.length)}
            onPress={() => router.push(`/profile/section/${section.key}`)}
          />
        ))}
      </SettingsCard>

      {resumeId ? (
        <ResumeQualityPanel
          resumeId={resumeId}
          onOpenIssue={(sectionKey) => router.push(`/profile/section/${sectionKey}`)}
        />
      ) : null}

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

      <ResumePreviewModal visible={cvOpen} onClose={() => setCvOpen(false)} resumeId={resumeId} />
    </View>
  );
}
