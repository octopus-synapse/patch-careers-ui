/**
 * Reads a value out of a Tamagui theme accessor.
 *
 * A theme field may be a plain string or a gettable token object
 * (`{ get(): unknown }`); this normalises both to the underlying string,
 * or `undefined` when it is neither. Shared by `useThemeName`
 * (`theme.name`) and `<Icon>` (`theme.color`).
 */
export function readThemeValue(raw: unknown): string | undefined {
  if (typeof raw === "string") return raw;
  if (raw && typeof (raw as { get?: () => unknown }).get === "function") {
    const value = (raw as { get: () => unknown }).get();
    return typeof value === "string" ? value : undefined;
  }
  return undefined;
}
