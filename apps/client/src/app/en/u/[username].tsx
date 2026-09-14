/** `/en/u/<username>` — the English version of a public profile (decision 21). */

import type { ReactElement } from "react";
import { PublicProfileRoute } from "@/features/public-profile";

export default function PublicProfileEnRoute(): ReactElement {
  return <PublicProfileRoute locale="en" />;
}
