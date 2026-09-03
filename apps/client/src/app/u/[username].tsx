/** `/u/<username>` — the Portuguese version of a public profile (decision 21). */

import type { ReactElement } from "react";
import { PublicProfileRoute } from "@/features/public-profile";

export default function PublicProfilePtRoute(): ReactElement {
  return <PublicProfileRoute locale="pt-BR" />;
}
