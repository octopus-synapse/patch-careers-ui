/**
 * `<Stack>` — re-export Tamagui layout primitives under the patch-careers
 * namespace so consumers don't import from `tamagui` directly.
 *
 * Re-exported from the shim so we get the relaxed `LooseProps` typing
 * (Tamagui's strict `StackProps` is over-tight for our `exactOptional`
 * package config).
 */

export { TXStack as XStack, TYStack as YStack, TZStack as ZStack } from "../internal/tamagui-shim";
