/**
 * Pure password-strength evaluator powering `<PasswordStrengthBar>`.
 *
 * Score 0..4 (zxcvbn-style buckets) computed from heuristics — we don't
 * want to ship the 800kb zxcvbn dictionary in the universal bundle.
 * The four signals tracked: length>=8, mixed case, digit, symbol.
 */

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  hints: string[];
};

export function evaluatePasswordStrength(input: string): PasswordStrength {
  const password = input ?? "";
  const hints: string[] = [];

  const longEnough = password.length >= 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  if (!longEnough) hints.push("min_length_8");
  if (!(hasLower && hasUpper)) hints.push("mixed_case");
  if (!hasDigit) hints.push("add_digit");
  if (!hasSymbol) hints.push("add_symbol");

  let count = 0;
  if (longEnough) count++;
  if (hasLower && hasUpper) count++;
  if (hasDigit) count++;
  if (hasSymbol) count++;

  return { score: count as PasswordStrength["score"], hints };
}
