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
import { type MergedSection, mergeSectionsWithCatalog } from "../lib/section-visibility";

/**
 * The two locales every resume surface must name (ADR-0011).
 *
 * `chrome` localizes what the backend catalog carries — section titles, add
 * labels, field labels — plus dates and enum values on the client. `content`
 * is which language version of the items to read. On the profile, chrome is
 * the app's locale and content is the version the switcher shows; on the
 * document (resume detail, export) both are the document's language. The
 * hook never infers one from the other, and never reads `useI18n()` itself:
 * the caller states the surface's rule.
 */
export type SectionLocales = {
  readonly chrome: Locale;
  readonly content: Locale;
};

/** Supersection group (localized) as served by GET …/sections/types. */
export type SectionGroupInfo = {
  key: string;
  title: string;
  description: string | null;
  icon: string;
  iconType: string;
  order: number;
};

export type ResumeSections = {
  /** Sections to render in the manager (only those with at least one item). */
  visible: MergedSection[];
  /** Every active type, for the single "add" entry point's picker. */
  catalog: MergedSection[];
  /** Supersection catalog, referenced by sectionTypes[].groupKey. */
  groups: SectionGroupInfo[];
  /** Echoed back so item renderers format dates/enums in the same locale as the titles. */
  chromeLocale: Locale;
  /** Which language version the items are in. */
  contentLocale: Locale;
  isLoading: boolean;
  isError: boolean;
};

export function useResumeSections(
  resumeId: string | undefined,
  locales: SectionLocales,
): ResumeSections {
  const enabled = Boolean(resumeId);
  // The content locale goes to the server as `?locale=`: items come back
  // resolved in that language (the derived copy merged over the canonical
  // text), each carrying `contentLocale` / `origin` / `translationState`.
  const sectionsQuery = useGetV1ResumesResumeIdSections(
    resumeId ?? "",
    { locale: locales.content },
    { query: { enabled } },
  );
  const typesQuery = useGetV1ResumesResumeIdSectionsTypes(
    resumeId ?? "",
    { locale: locales.chrome },
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

  const groups: SectionGroupInfo[] = typesQuery.data?.groups ?? [];

  return {
    visible,
    catalog,
    groups,
    chromeLocale: locales.chrome,
    contentLocale: locales.content,
    isLoading: sectionsQuery.isLoading || typesQuery.isLoading,
    isError: sectionsQuery.isError || typesQuery.isError,
  };
}
