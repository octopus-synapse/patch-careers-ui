/**
 * Resumes feature — the "Currículos" sub-tab of the Profile screen (list of
 * the user's resumes, master first, with slots), the resume detail screen,
 * and the create-derived-resume wizard. All resumes derive from the master
 * as snapshot copies (POST /v1/resumes/:id/duplicate).
 */
export { CreateResumeWizard } from "./components/create-resume-wizard";
export { ResumeDetailScreen } from "./components/resume-detail-screen";
export { ResumeListTab } from "./components/resume-list-tab";
export { ResumePreviewModal } from "./components/resume-preview-modal";
export { ResumeQualityPanel } from "./components/resume-quality-panel";
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
export { resumeLanguageToLocale } from "./lib/helpers";
