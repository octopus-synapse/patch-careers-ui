/**
 * Supersection block — a serif-titled group (optional leading icon + trailing
 * action) wrapping a (super)section's content on the Profile tab (identity,
 * links, and each standalone section get one). It is deliberately NOT a bordered
 * surface: the rows inside are already hairline cards, so a box here would nest
 * borders. Used only by the grouped layout; the flat manager (resume detail)
 * keeps the plain small-caps groups.
 */
import { Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts as fonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement, ReactNode } from "react";

export function SectionCard({
  title,
  leading,
  action,
  children,
}: {
  title: string;
  leading?: ReactNode;
  /** Optional trailing element in the header (e.g. an add button). */
  action?: ReactNode;
  children: ReactNode;
}): ReactElement {
  const palette = useEditorialPalette();
  return (
    <YStack gap={12}>
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap={8} flex={1}>
          {leading ? (
            <YStack width={20} alignItems="center">
              {leading}
            </YStack>
          ) : null}
          <Text fontFamily={fonts.serif} fontSize={18} color={palette.ink}>
            {title}
          </Text>
        </XStack>
        {action}
      </XStack>
      <YStack gap={10}>{children}</YStack>
    </YStack>
  );
}
