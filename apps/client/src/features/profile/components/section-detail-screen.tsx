/**
 * <SectionDetailScreen> — a single master-resume section's sub-screen
 * (settings-style): the section's items with edit/delete and a scoped "add",
 * reusing the shared ResumeSectionsManager filtered to one section. The screen
 * title is the section's localized name.
 */

import type { ReactElement } from "react";
import { SettingsScreenShell } from "@/components/settings-screen-shell";
import { resumeLanguageToLocale, useMasterResumeId } from "@/features/resumes";
import { ResumeSectionsManager, useResumeSections } from "@/features/sections";
import { useI18n } from "@/providers/i18n-provider";

export function SectionDetailScreen({ sectionKey }: { sectionKey: string }): ReactElement {
  const { t, locale: uiLocale } = useI18n();
  const { resumeId, language } = useMasterResumeId();
  const resumeLocale = resumeLanguageToLocale(language) ?? uiLocale;
  const locales = { chrome: uiLocale, content: resumeLocale, canonical: resumeLocale };
  const { catalog } = useResumeSections(resumeId, locales);
  const title = catalog.find((c) => c.key === sectionKey)?.title ?? t("tabs.profile");

  return (
    <SettingsScreenShell title={title}>
      <ResumeSectionsManager
        resumeId={resumeId}
        locales={locales}
        variant="grouped"
        onlySection={sectionKey}
      />
    </SettingsScreenShell>
  );
}
