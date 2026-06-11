/**
 * Resumes feature — the "Currículos" sub-tab of the Profile screen (list of
 * the user's resumes, master first, with slots), the resume detail screen,
 * and the create-derived-resume wizard. All resumes derive from the master
 * as snapshot copies (POST /v1/resumes/:id/duplicate).
 */
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
