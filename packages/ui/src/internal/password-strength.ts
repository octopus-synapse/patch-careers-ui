/**
 * Pure password-strength evaluator powering `<PasswordStrengthBar>`.
 *
 * Score 0..4 (zxcvbn-style buckets) computed from heuristics — we don't
 * want to ship the 800kb zxcvbn dictionary in the universal bundle.
 * The four signals tracked: length>=8, mixed case, digit, symbol.
 *
 * `passwordSignals` / `passwordScore` are the shared predicate layer:
 * the editorial meter (`internal/editorial-password`) reuses them so the
 * four-signal regexes live in exactly one place. The editorial-specific
 * "hard 0 below 6 chars" rule and label/colour ramps stay over there.
 */

export interface PasswordSignals {
  /** At least 8 characters. */
  longEnough: boolean;
  /** Contains both an upper- and a lower-case letter. */
  mixedCase: boolean;
  /** Contains a digit. */
  hasDigit: boolean;
  /** Contains a non-alphanumeric symbol. */
  hasSymbol: boolean;
}

export function passwordSignals(input: string): PasswordSignals {
  const password = input ?? "";
  return {
    longEnough: password.length >= 8,
    mixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
    hasDigit: /\d/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  };
}

/** Number of satisfied signals (0..4). */
export function passwordScore(signals: PasswordSignals): 0 | 1 | 2 | 3 | 4 {
  const count =
    Number(signals.longEnough) +
    Number(signals.mixedCase) +
    Number(signals.hasDigit) +
    Number(signals.hasSymbol);
  return count as 0 | 1 | 2 | 3 | 4;
}

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  hints: string[];
};

export function evaluatePasswordStrength(input: string): PasswordStrength {
  const signals = passwordSignals(input);
  const hints: string[] = [];

  if (!signals.longEnough) hints.push("min_length_8");
  if (!signals.mixedCase) hints.push("mixed_case");
  if (!signals.hasDigit) hints.push("add_digit");
  if (!signals.hasSymbol) hints.push("add_symbol");

  return { score: passwordScore(signals), hints };
}
