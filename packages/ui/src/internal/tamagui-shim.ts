/**
 * Tamagui prop-type shim.
 *
 * Tamagui v1 ships extremely tight `variant` unions (e.g. `Button` has a
 * built-in "outlined" variant whose union collides with ours) and
 * theme-value generics that don't play well with `exactOptionalPropertyTypes`
 * in this package. Wrapping the components as `ComponentType<Record<string, unknown>>`
 * lets us pass style + accessibility props the same way Tamagui's own
 * docs do while keeping consumers' API surface fully typed via our
 * exported `ButtonProps`/`InputProps`/etc.
 *
 * This is the *only* place we relax Tamagui's typing — public components
 * still expose precise prop unions to the app layer.
 */

import type { ComponentType, ReactNode } from "react";
import {
  Button as TamaguiButton,
  Card as TamaguiCard,
  Dialog as TamaguiDialog,
  Input as TamaguiInput,
  Popover as TamaguiPopover,
  Stack as TamaguiStack,
  Tabs as TamaguiTabs,
  Text as TamaguiText,
  Unspaced as TamaguiUnspaced,
  XStack as TamaguiXStack,
  YStack as TamaguiYStack,
  ZStack as TamaguiZStack,
} from "tamagui";

export type LooseProps = Record<string, unknown> & { children?: ReactNode };

/**
 * The single sanctioned `as unknown as ...` typing escape — casts a Tamagui
 * (or RN) component to a relaxed prop surface. Consumers import this instead
 * of re-deriving the cast inline.
 */
export function asLoose<T>(component: unknown): T {
  return component as T;
}

export const TButton = TamaguiButton as unknown as ComponentType<LooseProps>;
export const TCard = TamaguiCard as unknown as ComponentType<LooseProps>;
export const TDialog = TamaguiDialog as unknown as ComponentType<LooseProps> & typeof TamaguiDialog;
export const TInput = TamaguiInput as unknown as ComponentType<LooseProps>;
export const TPopover = TamaguiPopover as unknown as ComponentType<LooseProps> &
  typeof TamaguiPopover;
export const TStack = TamaguiStack as unknown as ComponentType<LooseProps>;
export const TTabs = TamaguiTabs as unknown as ComponentType<LooseProps> & typeof TamaguiTabs;
export const TText = TamaguiText as unknown as ComponentType<LooseProps>;
export const TUnspaced = TamaguiUnspaced as unknown as ComponentType<LooseProps>;
export const TXStack = TamaguiXStack as unknown as ComponentType<LooseProps>;
export const TYStack = TamaguiYStack as unknown as ComponentType<LooseProps>;
export const TZStack = TamaguiZStack as unknown as ComponentType<LooseProps>;
