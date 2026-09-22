/**
 * The Profile "Perfil" sub-tab's single add entry point, self-contained so it
 * can be pinned as a floating CTA over the scroll. Renders the shared black
 * action pill and the catalog picker modal, and owns the create mutation.
 */

import { type ComponentProps, type ReactElement, useState } from "react";
import { useContentLocale, useMasterResumeId } from "@/features/resumes";
import {
  AddSectionFlowModal,
  useResumeSections,
  useSectionItemMutations,
} from "@/features/sections";
import { useI18n } from "@/providers/i18n-provider";
import { AddSectionButton } from "./add-section-button";

export function MasterAddSection(): ReactElement {
  const { t, locale: uiLocale } = useI18n();
  const { resumeId, language } = useMasterResumeId();
  const contentLocale = useContentLocale(resumeId, language);
  const { catalog } = useResumeSections(resumeId, {
    chrome: uiLocale,
    content: contentLocale.content,
    canonical: contentLocale.canonical,
  });
  const { createFor, isPending } = useSectionItemMutations(resumeId);
  const [addOpen, setAddOpen] = useState(false);

  // Persist a new item for the picked type (the section row is created
  // implicitly by the keyed items POST).
  const createItem: ComponentProps<typeof AddSectionFlowModal>["onCreate"] = async (
    section,
    item,
    translation,
  ) => {
    const id = await createFor(section.key, item, translation);
    setAddOpen(false);
    return id;
  };

  return (
    <>
      <AddSectionButton
        label={t("sections.addToResume")}
        onPress={() => setAddOpen(true)}
        disabled={!resumeId}
      />
      <AddSectionFlowModal
        resumeId={resumeId}
        locales={{
          chrome: uiLocale,
          content: contentLocale.content,
          canonical: contentLocale.canonical,
        }}
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        catalog={catalog}
        onCreate={createItem}
        isPending={isPending}
        t={t}
      />
    </>
  );
}
