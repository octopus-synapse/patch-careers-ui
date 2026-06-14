/**
 * People-search field for starting a new conversation. A hairline pill with a
 * leading search glyph, the `@patch-careers/ui` Input, and a clear button that
 * appears once there's a query.
 */

import { Icon, Input, XStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { Search, X } from "lucide-react-native";
import type { ReactElement } from "react";
import { Pressable } from "react-native";
import { useI18n } from "@/providers/i18n-provider";

export function UserSearchField({
  value,
  onChangeText,
  onClear,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
}): ReactElement {
  const editorialPalette = useEditorialPalette();
  const { t } = useI18n();
  return (
    <XStack
      alignItems="center"
      gap={8}
      marginHorizontal={20}
      marginBottom={8}
      paddingHorizontal={14}
      height={42}
      borderRadius={21}
      borderWidth={1}
      borderColor={editorialPalette.hairline}
      backgroundColor={editorialPalette.surface}
    >
      <Icon as={Search} size={16} color={editorialPalette.subtle} />
      <Input
        flex={1}
        value={value}
        onChangeText={onChangeText}
        placeholder={t("messages.search.placeholder")}
        placeholderTextColor={editorialPalette.subtle}
        autoCapitalize="none"
        autoCorrect={false}
        borderWidth={0}
        backgroundColor="transparent"
        paddingHorizontal={0}
        minHeight={40}
        fontSize={15}
        color={editorialPalette.ink}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("messages.search.clear")}
          onPress={onClear}
          hitSlop={8}
        >
          <Icon as={X} size={16} color={editorialPalette.subtle} />
        </Pressable>
      ) : null}
    </XStack>
  );
}
