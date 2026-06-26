/**
 * Pure helpers for the links_v1 section. `extractDomain` mirrors the server-side
 * backfill (prisma/seeds/migrate-profile-links-to-sections.seed.ts) so a link
 * added in-app stores the same `domain` shape; `domainToTitle` turns that host
 * into a friendly default label (medium.com → "Medium"), which the add-link
 * flow pre-fills and the user can override.
 */

/** Drop the protocol/`www.`/trailing slash so a URL reads as a handle. */
export function prettyLink(url: string): string {
  return url
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "");
}

/** Bare host (no protocol/`www.`), or undefined for anything unparseable. */
export function extractDomain(url: string): string | undefined {
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  // A non-web scheme (mailto:, tel:, …) has no meaningful domain.
  if (hasScheme && !/^https?:\/\//i.test(trimmed)) return undefined;
  try {
    const host = new URL(hasScheme ? trimmed : `https://${trimmed}`).hostname.toLowerCase();
    if (!host.includes(".")) return undefined;
    return host.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

/**
 * Friendly brand title from a host: take the registrable label (handling the
 * common two-part TLDs like `co.uk`/`com.br`) and capitalize it.
 *   medium.com → "Medium", youtube.com → "Youtube", joe.co.uk → "Joe"
 * Returns undefined when there's nothing meaningful to show.
 */
const TWO_PART_TLDS = new Set(["co.uk", "com.br", "co.jp", "com.au", "co.in", "co.nz", "com.mx"]);

export function domainToTitle(host: string | undefined | null): string | undefined {
  if (!host) return undefined;
  const clean = host
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
  if (!clean) return undefined;
  const parts = clean.split(".").filter(Boolean);
  if (parts.length < 2) return capitalize(parts[0] ?? clean);

  const lastTwo = parts.slice(-2).join(".");
  // For `joe.co.uk` the registrable label is the 3rd-from-last; otherwise 2nd.
  const labelIndex = TWO_PART_TLDS.has(lastTwo) ? parts.length - 3 : parts.length - 2;
  const label = parts[labelIndex] ?? parts[0] ?? clean;
  return capitalize(label);
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
