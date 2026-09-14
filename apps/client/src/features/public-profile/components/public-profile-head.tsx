/**
 * <PublicProfileHead> — the document head of a public profile on web.
 *
 * Two things a crawler needs that the screen cannot say (decision 22):
 * the two language versions declared as alternates of each other, and the
 * person's own indexing choice (`allowSearchEngineIndex`) as a robots rule —
 * a profile whose owner said "no" is served but not listed.
 */
import type { Locale } from "@patch-careers/i18n";
import Head from "expo-router/head";
import type { ReactElement } from "react";
import { publicProfileUrl } from "@/lib/public-profile-url";

export function PublicProfileHead({
  username,
  locale,
  indexable,
}: {
  username: string;
  locale: Locale;
  indexable: boolean;
}): ReactElement {
  return (
    <Head>
      <link rel="canonical" href={publicProfileUrl(username, locale)} />
      <link rel="alternate" hrefLang="pt-BR" href={publicProfileUrl(username, "pt-BR")} />
      <link rel="alternate" hrefLang="en" href={publicProfileUrl(username, "en")} />
      <link rel="alternate" hrefLang="x-default" href={publicProfileUrl(username, "pt-BR")} />
      <meta name="robots" content={indexable ? "index, follow" : "noindex, nofollow"} />
    </Head>
  );
}
