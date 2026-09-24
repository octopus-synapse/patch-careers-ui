import { AppRedirect } from "@/navigation/app-redirect";

/** Kept as a redirect so old bookmarks do not land on a dead route while Fit is disabled. */
export default function FitQuestionnaireRoute() {
  return <AppRedirect href="/profile" />;
}
