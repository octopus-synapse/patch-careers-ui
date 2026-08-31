/**
 * `/en` on native — the English tree is a web addressing concern; a
 * deep link that somehow lands here falls through to the root gate.
 */

import { Redirect } from "expo-router";
import type { ReactElement } from "react";

export default function EnglishIndex(): ReactElement {
  return <Redirect href="/" />;
}
