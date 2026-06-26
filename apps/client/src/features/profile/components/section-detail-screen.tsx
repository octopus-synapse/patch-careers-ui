/**
 * <SectionDetailScreen> — a single master-resume section's sub-screen
 * (settings-style): the section's items with edit/delete and a scoped "add",
 * reusing the shared ResumeSectionsManager filtered to one section. The screen
 * title is the section's localized name.
 */

import type { ReactElement } from "react";
import { resumeLanguageToLocale, useMasterResumeId } from "@/features/resumes";
import { ResumeSectionsManager, useResumeSections } from "@/features/sections";
import { SettingsScreenShell } from "@/features/settings";
import { useI18n } from "@/providers/i18n-provider";

export function SectionDetailScreen({ sectionKey }: { sectionKey: string }): ReactElement {
  const { t } = useI18n();
  const { resumeId, language } = useMasterResumeId();
  const locale = resumeLanguageToLocale(language);
  const { catalog } = useResumeSections(resumeId, locale);
  const title = catalog.find((c) => c.key === sectionKey)?.title ?? t("profile.subTabs.profile");

  return (
    <SettingsScreenShell title={title}>
      <ResumeSectionsManager
        resumeId={resumeId}
        locale={locale}
        variant="grouped"
        onlySection={sectionKey}
      />
    </SettingsScreenShell>
  );
}
