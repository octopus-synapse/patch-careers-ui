/**
 * Resumes feature — the Currículos bottom-bar tab (list of the user's
 * resumes, master first, with slots), the resume detail screen, and the
 * create-derived-resume wizard. All resumes derive from the master as
 * snapshot copies (POST /v1/resumes/:id/duplicate).
 */
export { ContentLanguageSwitch } from "./components/content-language-switch";
export { CreateResumeWizard } from "./components/create-resume-wizard";
export { ImportResumeSheet } from "./components/import-resume-sheet";
export { ResumeDetailScreen } from "./components/resume-detail-screen";
export { ResumeListTab } from "./components/resume-list-tab";
export { ResumePreviewModal } from "./components/resume-preview-modal";
export { ResumeQualityPanel } from "./components/resume-quality-panel";
export { ResumesScreen } from "./components/resumes-screen";
export { VersionHistorySheet } from "./components/version-history-sheet";
export {
  type ResumeListItem,
  useMasterResumeId,
  useResumeDetail,
  useResumeList,
  useResumeMutations,
  useResumeSlots,
  useResumeStyles,
  useTailoredVersions,
} from "./hooks/queries";
export { type ContentLocaleState, useContentLocale } from "./hooks/use-content-locale";
export {
  type LocaleTranslationStatus,
  needsTranslation,
  type TranslationProgress,
  useTranslateNow,
  useTranslationProgress,
  useTranslationStatus,
} from "./hooks/use-resume-translation";
export { resumeLanguageToLocale } from "./lib/helpers";
