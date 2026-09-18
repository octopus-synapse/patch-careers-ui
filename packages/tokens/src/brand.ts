/**
 * Patch brand colours.
 *
 * This is the single source of truth for the green visual language shared by
 * the landing, product UI and focused auth dialog. Components should consume
 * semantic palette slots (`accent`, `primary`, `focus`, etc.) instead of
 * importing these raw values directly.
 */
export const brandColors = {
  forest: "#234D3B",
  forestDeep: "#153E2B",
  forestPressed: "#315D40",
  olive: "#6E9053",
  olivePressed: "#7F9F64",
  focus: "#416C4C",
  focusSoft: "#8AAB56",
  leaf: "#A9BE91",
  lime: "#D8EAA4",
  ivory: "#F7F7ED",
  sage: "#EAF0E4",
} as const;
