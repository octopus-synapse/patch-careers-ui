/**
 * Search field for the jobs list — the same hairline pill the Messages
 * people-search uses: leading glyph, borderless input, clear button once
 * there's a query.
 */

import { Icon, Input, XStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { Search, X } from "lucide-react-native";
import type { ReactElement } from "react";
import { Pressable } from "react-native";

export function JobSearchField({
  value,
  onChangeText,
  onClear,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
}): ReactElement {
  const editorialPalette = useEditorialPalette();
  return (
    <XStack
      alignItems="center"
      gap={8}
      marginHorizontal={20}
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
        placeholder="Buscar por cargo ou empresa…"
        placeholderTextColor={editorialPalette.subtle}
        accessibilityLabel="Buscar vagas"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
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
          accessibilityLabel="Limpar busca"
          onPress={onClear}
          hitSlop={8}
        >
          <Icon as={X} size={16} color={editorialPalette.subtle} />
        </Pressable>
      ) : null}
    </XStack>
  );
}
