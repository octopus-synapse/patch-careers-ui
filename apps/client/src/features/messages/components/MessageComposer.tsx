/**
 * Thread composer — a pill text field that grows with the message plus a
 * deep-ink circular send button. Built from `@patch-careers/ui` Input +
 * IconButton so it inherits the app's touch-target and haptics conventions.
 */

import { editorialPalette } from "@patch-careers/tokens";
import { Icon, IconButton, Input, XStack } from "@patch-careers/ui";
import { Send } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { chatColors } from "../theme";

export function MessageComposer({
  disabled = false,
  onSend,
}: {
  disabled?: boolean;
  onSend: (content: string) => void;
}): ReactElement {
  const [content, setContent] = useState("");
  const canSend = !disabled && content.trim().length > 0;

  function submit(): void {
    if (!canSend) return;
    onSend(content);
    setContent("");
  }

  return (
    <XStack
      alignItems="flex-end"
      gap={10}
      paddingHorizontal={16}
      paddingVertical={10}
      borderTopWidth={1}
      borderTopColor={editorialPalette.hairline}
      backgroundColor={editorialPalette.surface}
    >
      <XStack
        flex={1}
        alignItems="center"
        minHeight={44}
        maxHeight={120}
        paddingHorizontal={16}
        borderRadius={22}
        borderWidth={1}
        borderColor={editorialPalette.hairline}
        backgroundColor={editorialPalette.bg}
      >
        <Input
          flex={1}
          value={content}
          onChangeText={setContent}
          placeholder="Escreva uma mensagem…"
          placeholderTextColor={editorialPalette.subtle}
          multiline
          minHeight={44}
          maxHeight={116}
          paddingHorizontal={0}
          borderWidth={0}
          backgroundColor="transparent"
          fontSize={15}
          color={editorialPalette.ink}
        />
      </XStack>

      <IconButton
        accessibilityLabel="Enviar mensagem"
        onPress={submit}
        disabled={!canSend}
        backgroundColor={chatColors.sendButton}
        borderRadius={22}
        width={44}
        height={44}
        minHeight={44}
        paddingHorizontal={0}
        paddingVertical={0}
      >
        <Icon as={Send} size={18} color={chatColors.sendButtonFg} />
      </IconButton>
    </XStack>
  );
}
