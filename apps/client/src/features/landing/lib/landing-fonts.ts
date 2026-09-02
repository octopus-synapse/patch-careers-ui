/**
 * The landing's sans face — now just the app's.
 *
 * Inter used to be the landing's private art direction, loaded here, because
 * the rest of the app ran on the platform system face. The whole app is on
 * Inter now (the root layout calls `ensureAppSansFont`), so this is only an
 * alias kept so the landing's many call sites keep reading as feature-local.
 */

import { editorialFonts } from "@patch-careers/ui/editorial";

export const landingSans = editorialFonts.sans;
