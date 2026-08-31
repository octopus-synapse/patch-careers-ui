/**
 * `LandingHead` — hreflang alternates for the landing routes.
 *
 * The landing exists at `/` (pt-BR, the primary market) and `/en`
 * (English). These tags tell crawlers the two are the same page in
 * different languages, with the pt-BR root as the `x-default`. Rendered
 * by both routes so each version points at the full set.
 */

import Head from "expo-router/head";
import type { ReactElement } from "react";

const ORIGIN = "https://patchcareers.org";

export function LandingHead(): ReactElement {
  return (
    <Head>
      <link rel="alternate" hrefLang="pt-BR" href={`${ORIGIN}/`} />
      <link rel="alternate" hrefLang="en" href={`${ORIGIN}/en`} />
      <link rel="alternate" hrefLang="x-default" href={`${ORIGIN}/`} />
    </Head>
  );
}
