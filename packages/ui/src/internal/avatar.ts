import { palette } from "@patch-careers/tokens";
/**
 * Avatar helpers — initial-fallback computation and color hashing.
 */

/**
 * Up-to-2-character initials derived from a name string.
 * Trims, splits on whitespace, takes first letter of first and last token.
 * Falls back to "?" when input is empty / non-alpha.
 */
export function initialsFromName(name: string): string {
  const trimmed = (name ?? "").trim();
  if (trimmed.length === 0) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  const result = `${first}${last}`.toUpperCase();
  return result.length === 0 ? "?" : result;
}

const AVATAR_RAMPS = [palette.blue, palette.green, palette.red, palette.gray] as const;

/**
 * Deterministic background color for an avatar fallback.
 * Uses a stable djb2-ish hash so the same name always yields the same hue.
 */
export function avatarBackgroundColor(seed: string): string {
  const source = seed ?? "";
  let hash = 5381;
  for (let i = 0; i < source.length; i++) {
    hash = (hash * 33) ^ source.charCodeAt(i);
  }
  const index = Math.abs(hash) % AVATAR_RAMPS.length;
  const ramp = AVATAR_RAMPS[index];
  if (!ramp) return palette.gray[500];
  return ramp[500];
}
