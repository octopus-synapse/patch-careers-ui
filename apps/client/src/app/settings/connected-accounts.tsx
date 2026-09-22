import { AppRedirect } from "@/navigation/app-redirect";

import type { ReactElement } from "react";
import { useLocalizedHref } from "@/navigation/locale-prefix";

/** Old bookmark target; provider management is disabled. */
export default function ConnectedAccountsRedirect(): ReactElement {
  const localized = useLocalizedHref();
  return <AppRedirect href={localized("/settings/account")} />;
}
