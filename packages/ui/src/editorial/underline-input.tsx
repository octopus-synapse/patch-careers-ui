/**
 * UnderlineInput — hairline-bottom input with an animated focus underline.
 *
 * Layout/label are Tamagui; the editable field stays a bare RN `TextInput`
 * (ref forwarding, selection/cursor color, web outline removal) and the
 * focus underline stays a Reanimated `scaleX` grow — neither is expressible
 * as a Tamagui styled component without diverging from the original look.
 */

import { editorialPalette } from "@patch-careers/tokens";
import { forwardRef, type ReactElement, type ReactNode, useEffect, useState } from "react";
import {
  type KeyboardTypeOptions,
  type NativeSyntheticEvent,
  Platform,
  type ReturnKeyTypeOptions,
  StyleSheet,
  TextInput,
  type TextInputSubmitEditingEventData,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { resolveUnderlineColors } from "../internal/editorial-variants";
import { TStack, TXStack, TYStack } from "../internal/tamagui-shim";
import { EditorialLabel } from "./editorial-label";
import { editorialFonts } from "./fonts";

export type UnderlineInputProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  testID?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: "email" | "password" | "new-password" | "username" | "name" | "off";
  textContentType?:
    | "emailAddress"
    | "password"
    | "newPassword"
    | "username"
    | "name"
    | "oneTimeCode";
  autoCorrect?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void;
  blurOnSubmit?: boolean;
  secureTextEntry?: boolean;
  editable?: boolean;
  hasError?: boolean;
  /** Slot for an action icon at the right edge of the input row. */
  rightSlot?: ReactNode;
};

export const UnderlineInput = forwardRef<TextInput, UnderlineInputProps>(
  (
    { label, value, onChangeText, hasError = false, rightSlot, testID, ...rest },
    ref,
  ): ReactElement => {
    const [focused, setFocused] = useState(false);
    const progress = useSharedValue(0);
    const colors = resolveUnderlineColors(hasError);

    useEffect(() => {
      progress.value = withTiming(focused ? 1 : 0, {
        duration: 280,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
    }, [focused, progress]);

    const underlineStyle = useAnimatedStyle(() => ({
      transform: [{ scaleX: progress.value }],
      backgroundColor: colors.focus,
    }));

    return (
      <TYStack paddingTop={4}>
        <EditorialLabel error={hasError}>{label}</EditorialLabel>
        <TXStack alignItems="center" minHeight={40}>
          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            style={inputStyles.input}
            placeholderTextColor={editorialPalette.subtle}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            selectionColor={editorialPalette.accent}
            cursorColor={editorialPalette.accent}
            {...(testID ? { testID } : {})}
            {...rest}
          />
          {rightSlot ? <TStack paddingLeft={8}>{rightSlot}</TStack> : null}
        </TXStack>
        <TStack height={1} width="100%" backgroundColor={colors.hairline} />
        <Animated.View style={[inputStyles.focusLine, underlineStyle]} />
      </TYStack>
    );
  },
);
UnderlineInput.displayName = "UnderlineInput";

// RN-primitive styles (the bare TextInput + absolute focus line). Everything
// else is expressed with Tamagui props above.
const inputStyles = StyleSheet.create({
  input: {
    flex: 1,
    fontFamily: editorialFonts.sans,
    fontSize: 18,
    color: editorialPalette.ink,
    paddingVertical: 8,
    paddingHorizontal: 0,
    // Remove default RN-Web input outline.
    ...Platform.select({
      web: { outlineStyle: "none" as unknown as undefined },
      default: {},
    }),
  },
  focusLine: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1.5,
    transformOrigin: "left center",
  },
});
