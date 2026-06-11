/**
 * Sections of a resume merged with the backend's section-type catalog — the
 * data source for the section manager (Profile sub-tab A and the resume
 * detail screen). Visibility rules live in `lib/section-visibility.ts`.
 */
import {
  useGetV1ResumesResumeIdSections,
  useGetV1ResumesResumeIdSectionsTypes,
} from "@patch-careers/api-client";
import type { Locale } from "@patch-careers/i18n";
import { useI18n } from "@/providers/i18n-provider";
import { type MergedSection, mergeSectionsWithCatalog } from "../lib/section-visibility";

export type ResumeSections = {
  /** Sections to render in the manager (mandatory always; optional with items). */
  visible: MergedSection[];
  /** Every active type, for the single "add" entry point's picker. */
  catalog: MergedSection[];
  isLoading: boolean;
  isError: boolean;
};

export function useResumeSections(
  resumeId: string | undefined,
  /**
   * Locale to localize the section-type catalog. Pass the resume's own
   * language so the catalog matches the document being edited; falls back to
   * the app UI locale when omitted.
   */
  localeOverride?: Locale,
): ResumeSections {
  const { locale: uiLocale } = useI18n();
  const locale = localeOverride ?? uiLocale;
  const enabled = Boolean(resumeId);
  const sectionsQuery = useGetV1ResumesResumeIdSections(resumeId ?? "", {
    query: { enabled },
  });
  const typesQuery = useGetV1ResumesResumeIdSectionsTypes(
    resumeId ?? "",
    { locale },
    { query: { enabled } },
  );

  const sections = (sectionsQuery.data?.sections ?? []).map((section) => ({
    id: section.id,
    sectionTypeKey: section.sectionType?.key,
    items: (section.items ?? []).map((item) => ({ id: item.id, content: item.content ?? {} })),
  }));

  const { visible, catalog } = mergeSectionsWithCatalog(
    typesQuery.data?.sectionTypes ?? [],
    sections,
  );

  return {
    visible,
    catalog,
    isLoading: sectionsQuery.isLoading || typesQuery.isLoading,
    isError: sectionsQuery.isError || typesQuery.isError,
  };
}
