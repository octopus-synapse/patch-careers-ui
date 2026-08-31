/**
 * `/en` on native — the English landing is web-only (it's a marketing
 * page); a deep link that somehow lands here just falls through to the
 * root gate. Exists so the `.web` variant has a non-platform sibling,
 * which Expo Router requires for platform-specific routes.
 */

import { Redirect } from "expo-router";
import type { ReactElement } from "react";

export default function EnglishIndex(): ReactElement {
  return <Redirect href="/" />;
}
