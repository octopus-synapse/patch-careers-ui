/**
 * PasswordInput — UnderlineInput + eye toggle slot.
 */

import { editorialPalette } from "@patch-careers/tokens";
import { Eye, EyeOff } from "lucide-react-native";
import { forwardRef, type ReactElement, useState } from "react";
import { Pressable, StyleSheet, type TextInput } from "react-native";
import { Icon } from "../icons/icon";
import { UnderlineInput, type UnderlineInputProps } from "./underline-input";

export type PasswordInputProps = Omit<
  UnderlineInputProps,
  "secureTextEntry" | "rightSlot" | "autoComplete" | "textContentType"
> & {
  showLabel: string;
  hideLabel: string;
  /** Use "new-password" / "newPassword" for sign-up flows; defaults to "password". */
  isNew?: boolean;
};

export const PasswordInput = forwardRef<TextInput, PasswordInputProps>(
  ({ showLabel, hideLabel, isNew = false, ...rest }, ref): ReactElement => {
    const [show, setShow] = useState(false);
    return (
      <UnderlineInput
        ref={ref}
        {...rest}
        secureTextEntry={!show}
        autoComplete={isNew ? "new-password" : "password"}
        textContentType={isNew ? "newPassword" : "password"}
        autoCorrect={false}
        rightSlot={
          <Pressable
            onPress={() => setShow((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={show ? hideLabel : showLabel}
            hitSlop={10}
            style={({ pressed }) => [eyeStyles.button, pressed ? eyeStyles.pressed : null]}
            testID="auth.passwordToggle"
          >
            <Icon
              as={show ? EyeOff : Eye}
              size={18}
              color={editorialPalette.muted}
              strokeWidth={1.5}
            />
          </Pressable>
        }
      />
    );
  },
);
PasswordInput.displayName = "PasswordInput";

const eyeStyles = StyleSheet.create({
  button: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.5 },
});
