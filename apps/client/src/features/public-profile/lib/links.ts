/**
 * The outbound links a public profile shows, in a fixed order.
 *
 * Order is editorial, not alphabetical: a personal site says the most about
 * someone, a portfolio next, then the two networks. Blank fields drop out
 * rather than rendering an empty row — the backend returns every column as
 * `string | null`, and most profiles fill in one or two.
 */

import type { Translator } from "@patch-careers/i18n";
import type { PublicProfileLink, PublicProfileUser } from "../types";

const ORDER = ["website", "portfolio", "linkedin", "github"] as const;

const LABEL_KEY: Record<(typeof ORDER)[number], string> = {
  website: "profile.publicProfile.linkWebsite",
  portfolio: "profile.publicProfile.linkPortfolio",
  linkedin: "profile.publicProfile.linkLinkedin",
  github: "profile.publicProfile.linkGithub",
};

export function publicProfileLinks(
  user: Pick<PublicProfileUser, (typeof ORDER)[number]> | undefined,
  t: Translator,
): PublicProfileLink[] {
  if (!user) return [];
  const links: PublicProfileLink[] = [];
  for (const key of ORDER) {
    const url = user[key]?.trim();
    if (url) links.push({ key, label: t(LABEL_KEY[key]), url });
  }
  return links;
}

/**
 * A URL as a person reads it — no scheme, no trailing slash. The stored value
 * is whatever the user typed, so this normalises for display only; the href
 * always uses the original.
 */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}
