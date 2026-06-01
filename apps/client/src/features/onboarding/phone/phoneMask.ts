/**
 * Phone formatting for the onboarding "Pessoal" step. The user first picks
 * a country (dial code), then types digits; we render a pretty mask while
 * storing the canonical `+<dial><national>` string.
 *
 * Example (Brazil): typing `11978833101` with country +55 renders
 * `+55 (11) 97883-3101` and stores `+5511978833101`.
 *
 * Self-contained on purpose — no `libphonenumber-js` dependency. Each
 * country carries a progressive `groupNational` so the mask stays correct
 * mid-typing. Countries without a bespoke grouping fall back to a generic
 * 3-3-4 grouping, which is good enough for a display aid (the value is a
 * free-form string server-side, max 20 chars).
 */

export interface PhoneCountry {
  /** ISO 3166-1 alpha-2, also used to default from the location step. */
  readonly iso: string;
  readonly name: string;
  /** Without the leading `+`, e.g. `55`. */
  readonly dialCode: string;
  readonly flag: string;
  /** Progressive grouping of the national digits (no country code). */
  readonly groupNational?: (national: string) => string;
}

/** Brazil: `(AA) NNNNN-NNNN` (mobile, 9 digits) or `(AA) NNNN-NNNN`
 *  (landline, 8 digits), formatted progressively as the user types. */
function groupBR(national: string): string {
  const area = national.slice(0, 2);
  const rest = national.slice(2);
  if (national.length <= 1) return area;
  if (rest.length === 0) return `(${area})`;
  if (rest.length <= 4) return `(${area}) ${rest}`;
  // BR mobile subscriber numbers are 9 digits and start with `9` (first
  // group of 5); landlines are 8 digits (first group of 4).
  const isMobile = rest.length > 8 || rest.startsWith("9");
  const firstLen = isMobile ? 5 : 4;
  const first = rest.slice(0, firstLen);
  const second = rest.slice(firstLen);
  return second ? `(${area}) ${first}-${second}` : `(${area}) ${first}`;
}

/** US/CA NANP: `(AAA) NNN-NNNN`. */
function groupNANP(national: string): string {
  const a = national.slice(0, 3);
  const b = national.slice(3, 6);
  const c = national.slice(6, 10);
  if (national.length <= 3) return a;
  if (national.length <= 6) return `(${a}) ${b}`;
  return `(${a}) ${b}-${c}`;
}

/** Generic fallback: groups of 3-3-4 separated by spaces. */
function groupGeneric(national: string): string {
  const groups = national.match(/.{1,3}/g);
  return groups ? groups.join(" ") : national;
}

const BRAZIL: PhoneCountry = {
  iso: "BR",
  name: "Brasil",
  dialCode: "55",
  flag: "🇧🇷",
  groupNational: groupBR,
};

export const PHONE_COUNTRIES: readonly PhoneCountry[] = [
  BRAZIL,
  { iso: "US", name: "United States", dialCode: "1", flag: "🇺🇸", groupNational: groupNANP },
  { iso: "CA", name: "Canada", dialCode: "1", flag: "🇨🇦", groupNational: groupNANP },
  { iso: "PT", name: "Portugal", dialCode: "351", flag: "🇵🇹" },
  { iso: "AR", name: "Argentina", dialCode: "54", flag: "🇦🇷" },
  { iso: "MX", name: "México", dialCode: "52", flag: "🇲🇽" },
  { iso: "ES", name: "España", dialCode: "34", flag: "🇪🇸" },
  { iso: "GB", name: "United Kingdom", dialCode: "44", flag: "🇬🇧" },
  { iso: "DE", name: "Deutschland", dialCode: "49", flag: "🇩🇪" },
  { iso: "FR", name: "France", dialCode: "33", flag: "🇫🇷" },
] as const;

export const DEFAULT_PHONE_COUNTRY: PhoneCountry = BRAZIL;

/** Keep only digits. */
export function onlyDigits(value: string): string {
  return value.replace(/\D+/g, "");
}

export function findCountryByIso(iso: string | undefined): PhoneCountry | undefined {
  if (!iso) return undefined;
  const upper = iso.toUpperCase();
  return PHONE_COUNTRIES.find((c) => c.iso === upper);
}

/** Group just the national digits (no dial code), e.g. `(11) 97883-3101`. */
export function formatNational(country: PhoneCountry, national: string): string {
  const digits = onlyDigits(national);
  if (digits.length === 0) return "";
  return (country.groupNational ?? groupGeneric)(digits);
}

/** Render the pretty display string: `+<dial> <grouped national>`. */
export function formatPhoneDisplay(country: PhoneCountry, national: string): string {
  const grouped = formatNational(country, national);
  return grouped ? `+${country.dialCode} ${grouped}` : `+${country.dialCode}`;
}

/** The canonical value stored server-side: `+<dial><national>` (digits
 *  only after the `+`). Empty national → empty string (phone is optional). */
export function toCanonicalPhone(country: PhoneCountry, national: string): string {
  const digits = onlyDigits(national);
  if (digits.length === 0) return "";
  return `+${country.dialCode}${digits}`;
}

/**
 * Parse a stored canonical phone back into `{ country, national }` for
 * editing. Picks the country whose dial code is the longest prefix match.
 * Falls back to the default country with the raw digits when nothing
 * matches (e.g. legacy free-form values).
 */
export function parseCanonicalPhone(value: string | undefined): {
  country: PhoneCountry;
  national: string;
} {
  const digits = onlyDigits(value ?? "");
  if (digits.length === 0) return { country: DEFAULT_PHONE_COUNTRY, national: "" };

  const matches = PHONE_COUNTRIES.filter((c) => digits.startsWith(c.dialCode)).sort(
    (a, b) => b.dialCode.length - a.dialCode.length,
  );
  const country = matches[0];
  if (!country) return { country: DEFAULT_PHONE_COUNTRY, national: digits };
  return { country, national: digits.slice(country.dialCode.length) };
}
