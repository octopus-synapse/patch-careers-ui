/**
 * Resume tab — the user's master resume preview + "Baixar PDF". The render and
 * download logic live in the shared `<ResumePreview>` (also used by the Profile
 * tab's CV modal).
 */
import type { ReactElement } from "react";
import { ResumePreview } from "../../components/ResumePreview";

export default function ResumeScreen(): ReactElement {
  return <ResumePreview />;
}
