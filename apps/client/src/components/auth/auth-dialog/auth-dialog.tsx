/**
 * Native stub — the unified auth dialog is a web/landing surface (the
 * `NavBar` that opens it already renders null on native). On
 * native the standalone `(auth)` screens remain the auth entry points;
 * they can adopt the same identifier-first flow later via the shared
 * `branchForIdentity` + `POST /v1/auth/identify`.
 */
import type { ReactElement } from "react";

export function AuthDialog(_props: { readonly onClose: () => void }): ReactElement | null {
  return null;
}
