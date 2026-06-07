/**
 * Phone formatting for `<PhoneInput>` (onboarding "Pessoal" step). The user
 * first picks a country (dial code), then types digits; we render a pretty
 * mask while storing the canonical `+<dial><national>` string.
 *
 * Example (Brazil): typing `11978833101` with country +55 renders
 * `+55 (11) 97883-3101` and stores `+5511978833101`.
 *
 * Backed by `libphonenumber-js`, so every country (~245) gets the correct
 * dial code and a real progressive (`AsYouType`) mask — not a generic one.
 * Country names come from the platform `Intl.DisplayNames` (localized, no
 * polyfill — same stance as `@patch-careers/i18n`); flags are derived from
 * the ISO code. The list is sorted A→Z by localized name.
 */

import {
  AsYouType,
  type CountryCode,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumber,
} from "libphonenumber-js";

export interface PhoneCountry {
  /** ISO 3166-1 alpha-2, also used to default from the location step. */
  readonly iso: CountryCode;
  readonly name: string;
  /** Without the leading `+`, e.g. `55`. */
  readonly dialCode: string;
  readonly flag: string;
}

/** Flag emoji from an ISO-3166 alpha-2 code (two regional-indicator symbols). */
function flagFromIso(iso: string): string {
  const BASE = 0x1f1e6; // regional indicator "A"
  return iso
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .replace(/./g, (c) => String.fromCodePoint(BASE + (c.charCodeAt(0) - 65)));
}

// Localized region-name resolver. `Intl.DisplayNames` is part of the platform
// Intl on Hermes (>= RN 0.74) and modern browsers; if an engine lacks it we
// fall back to the raw ISO code so the picker still works.
const regionNames = (() => {
  try {
    const locale = new Intl.DateTimeFormat().resolvedOptions().locale;
    return new Intl.DisplayNames([locale], { type: "region" });
  } catch {
    return undefined;
  }
})();

function nameFromIso(iso: string): string {
  try {
    return regionNames?.of(iso) ?? iso;
  } catch {
    return iso;
  }
}

function buildCountries(): PhoneCountry[] {
  return getCountries()
    .map(
      (iso): PhoneCountry => ({
        iso,
        name: nameFromIso(iso),
        dialCode: getCountryCallingCode(iso),
        flag: flagFromIso(iso),
      }),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const PHONE_COUNTRIES: readonly PhoneCountry[] = buildCountries();

export const DEFAULT_PHONE_COUNTRY: PhoneCountry = PHONE_COUNTRIES.find((c) => c.iso === "BR") ??
  PHONE_COUNTRIES[0] ?? { iso: "BR", name: "Brazil", dialCode: "55", flag: flagFromIso("BR") };

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
  return new AsYouType(country.iso).input(digits);
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
 * Parse a stored canonical phone back into `{ country, national }` for editing.
 * Uses libphonenumber's parser; on failure (legacy free-form values), falls
 * back to the longest dial-code prefix match, then to the default country.
 */
export function parseCanonicalPhone(value: string | undefined): {
  country: PhoneCountry;
  national: string;
} {
  const raw = (value ?? "").trim();
  if (raw.length === 0) return { country: DEFAULT_PHONE_COUNTRY, national: "" };

  try {
    const parsed = parsePhoneNumber(raw.startsWith("+") ? raw : `+${onlyDigits(raw)}`);
    if (parsed?.country) {
      const country = findCountryByIso(parsed.country) ?? DEFAULT_PHONE_COUNTRY;
      return { country, national: parsed.nationalNumber };
    }
  } catch {
    // Not a parseable E.164 number — fall through to the prefix heuristic.
  }

  const digits = onlyDigits(raw);
  const matches = PHONE_COUNTRIES.filter((c) => digits.startsWith(c.dialCode)).sort(
    (a, b) => b.dialCode.length - a.dialCode.length,
  );
  const country = matches[0];
  if (!country) return { country: DEFAULT_PHONE_COUNTRY, national: digits };
  return { country, national: digits.slice(country.dialCode.length) };
}
