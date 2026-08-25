/**
 * Validation rules — the ONE place client-side constraints live.
 *
 * Mirrors profile-services (`shared-kernel/schemas/primitives`): the
 * generated Zod SDK carries formats (`emailSchema`, `usernameSchema`, the
 * URL schemas) but collapses lengths and the password character-classes
 * into a single opaque regex, so the numbers are transcribed here once and
 * `rules.spec.ts` pins them against the generated `passwordSchema` — drift
 * fails CI instead of shipping a green meter that the server rejects.
 */

export interface ValidationIssue {
  /** Stable code — same vocabulary the backend's `fields[].code` uses. */
  readonly code: string;
  readonly params?: Readonly<Record<string, string | number>>;
}

export const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  /** Symbols the backend accepts — `#` is NOT one of them. */
  specialChars: "@$!%*?&",
} as const;

export const NAME_RULE = { min: 2, max: 100 } as const;
export const USERNAME_RULE = { min: 3, max: 30 } as const;

export interface PasswordRule {
  readonly code: string;
  readonly params?: Readonly<Record<string, string | number>>;
  readonly test: (password: string) => boolean;
}

const escapeForCharClass = (chars: string): string => chars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const PASSWORD_SPECIAL_CHAR_RE = new RegExp(
  `[${escapeForCharClass(PASSWORD_POLICY.specialChars)}]`,
);

/** Character-class rules, in the order the backend reports them. */
export const PASSWORD_RULES: ReadonlyArray<PasswordRule> = [
  { code: "PASSWORD_NEEDS_UPPERCASE", test: (p) => /[A-Z]/.test(p) },
  { code: "PASSWORD_NEEDS_LOWERCASE", test: (p) => /[a-z]/.test(p) },
  { code: "PASSWORD_NEEDS_DIGIT", test: (p) => /[0-9]/.test(p) },
  {
    code: "PASSWORD_NEEDS_SYMBOL",
    params: { chars: PASSWORD_POLICY.specialChars },
    test: (p) => PASSWORD_SPECIAL_CHAR_RE.test(p),
  },
];
