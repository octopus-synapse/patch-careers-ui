/** `/u/<username>` — the Portuguese version of a public profile (decision 21). */

import type { ReactElement } from "react";
import { PublicProfileRoute } from "@/features/public-profile";
import { useI18n } from "@/providers/i18n-provider";

export default function PublicProfilePtRoute(): ReactElement {
  const { locale } = useI18n();
  return <PublicProfileRoute locale={locale} />;
}
