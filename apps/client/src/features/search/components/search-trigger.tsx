/**
 * SearchTrigger — the header's non-editable search pill. Visually the same
 * pill the old inline input drew, but it's a button: tapping it opens the
 * centered SearchModal command palette, where the real input lives.
 */

import { Icon, Text, XStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { Search } from "lucide-react-native";
import type { ReactElement } from "react";
import { Pressable } from "react-native";
import { useI18n } from "@/providers/i18n-provider";

export function SearchTrigger({ onPress }: { onPress: () => void }): ReactElement {
  const { t } = useI18n();
  const editorialPalette = useEditorialPalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("search.openA11y")}
      onPress={onPress}
    >
      {({ pressed }) => (
        <XStack
          alignItems="center"
          gap={7}
          height={38}
          paddingHorizontal={12}
          borderRadius={19}
          borderWidth={1}
          borderColor={editorialPalette.hairline}
          backgroundColor={pressed ? editorialPalette.bg : editorialPalette.surface}
        >
          <Icon as={Search} size={15} color={editorialPalette.subtle} />
          <Text preset="label" fontSize={14} color={editorialPalette.subtle}>
            {t("search.placeholder")}
          </Text>
        </XStack>
      )}
    </Pressable>
  );
}
