/**
 * Shared type aliases for the UI library.
 *
 * These mirror the semantic intent vocabulary exposed by
 * `@patch-careers/tokens` so that consumers don't need to import token
 * types just to pass an `intent="accent"` prop.
 */

export type Intent = "neutral" | "accent" | "danger" | "success";

export type Size = "sm" | "md" | "lg";

export type ButtonVariant = "solid" | "outlined" | "ghost";

export type ThemeName = "light" | "dark";
