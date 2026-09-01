/**
 * The identified e-mail as a pill with a "change" affordance — the auth
 * dialog's later steps keep the address visible (password managers pair
 * `username` + `current-password` by proximity) and one tap returns to
 * the e-mail step, mirroring the verify screen's mail chip.
 */
import { Text, XStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { Pressable } from "react-native";

export function EmailChip({
  email,
  changeLabel,
  onChange,
  testID,
}: {
  readonly email: string;
  readonly changeLabel: string;
  readonly onChange: () => void;
  readonly testID: string;
}): ReactElement {
  const palette = useEditorialPalette();
  return (
    <XStack justifyContent="center">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={changeLabel}
        onPress={onChange}
        testID={testID}
      >
        <XStack
          alignItems="center"
          gap={8}
          paddingVertical={5}
          paddingHorizontal={12}
          borderRadius={999}
          borderWidth={1}
          borderColor={palette.hairline}
          backgroundColor={palette.surface}
        >
          <Text fontFamily={editorialFonts.mono} fontSize={11.5} color={palette.body}>
            {email}
          </Text>
          <Text fontFamily={editorialFonts.mono} fontSize={11.5} color={palette.accent}>
            {changeLabel}
          </Text>
        </XStack>
      </Pressable>
    </XStack>
  );
}
