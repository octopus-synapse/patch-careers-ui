/**
 * The Profile "Perfil" sub-tab's single add entry point, self-contained so it
 * can be pinned as a floating CTA over the scroll (which is what gives the
 * button's backdrop blur something to actually frost). Renders the black
 * frosted "add" slab + the catalog picker modal, and owns the create mutation.
 */

import { type ReactElement, useState } from "react";
import { resumeLanguageToLocale, useMasterResumeId } from "@/features/resumes";
import {
  AddSectionFlowModal,
  type MergedSection,
  type SectionItem,
  useResumeSections,
  useSectionItemMutations,
} from "@/features/sections";
import { useI18n } from "@/providers/i18n-provider";
import { AddSectionButton } from "./add-section-button";

export function MasterAddSection(): ReactElement {
  const { t } = useI18n();
  const { resumeId, language } = useMasterResumeId();
  const locale = resumeLanguageToLocale(language);
  const { catalog } = useResumeSections(resumeId, locale);
  const { persistFor, isPending } = useSectionItemMutations(resumeId);
  const [addOpen, setAddOpen] = useState(false);

  // Persist a new item for the picked type (the section row is created
  // implicitly by the keyed items POST).
  const createItem = async (section: MergedSection, item: SectionItem): Promise<void> => {
    await persistFor(section.key)({ kind: "create", item, index: section.items.length });
    setAddOpen(false);
  };

  return (
    <>
      <AddSectionButton
        label={t("sections.addToResume")}
        onPress={() => setAddOpen(true)}
        disabled={!resumeId}
      />
      <AddSectionFlowModal
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
