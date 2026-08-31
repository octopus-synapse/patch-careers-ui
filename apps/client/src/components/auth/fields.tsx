/**
 * Shared editorial auth fields — the `AnimatedField → UnderlineInput/
 * PasswordInput → FieldError` blocks sign-in, sign-up and reset-password
 * were each duplicating. Labels/placeholders come from i18n internally so
 * callers only pass value/handlers + the testID.
 */

import {
  AnimatedField,
  FieldError,
  PasswordInput,
  UnderlineInput,
} from "@patch-careers/ui/editorial";
import type { ReactElement, ReactNode, Ref } from "react";
import type {
  NativeSyntheticEvent,
  ReturnKeyTypeOptions,
  TextInput,
  TextInputSelectionChangeEventData,
} from "react-native";
import { useTranslator } from "@/providers/i18n-provider";

/** Focus/caret observers (the auth mascot follows the form through these). */
export type FieldObservers = {
  onFocus?: () => void;
  onBlur?: () => void;
  onCaretChange?: (caretIndex: number) => void;
};

function observerProps(o: FieldObservers): {
  onFocus?: () => void;
  onBlur?: () => void;
  onSelectionChange?: (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => void;
} {
  return {
    ...(o.onFocus ? { onFocus: o.onFocus } : {}),
    ...(o.onBlur ? { onBlur: o.onBlur } : {}),
    ...(o.onCaretChange
      ? { onSelectionChange: (e) => o.onCaretChange?.(e.nativeEvent.selection.end) }
      : {}),
  };
}

export function AuthNameField({
  value,
  onChangeText,
  error,
  testID,
  onSubmitEditing,
  delay = 260,
  ...observers
}: {
  value: string;
  onChangeText: (v: string) => void;
  error?: string | undefined;
  testID: string;
  onSubmitEditing?: () => void;
  delay?: number;
} & FieldObservers): ReactElement {
  const t = useTranslator();
  return (
    <AnimatedField delay={delay}>
      <UnderlineInput
        label={t("auth.fullName")}
        placeholder={t("auth.fullNamePlaceholder")}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        autoCorrect={false}
        returnKeyType="next"
        blurOnSubmit={false}
        hasError={!!error}
        testID={testID}
        {...(onSubmitEditing ? { onSubmitEditing } : {})}
        {...observerProps(observers)}
      />
      {error ? <FieldError text={error} /> : null}
    </AnimatedField>
  );
}

export function AuthEmailField({
  value,
  onChangeText,
  error,
  testID,
  inputRef,
  onSubmitEditing,
  delay = 300,
  ...observers
}: {
  value: string;
  onChangeText: (v: string) => void;
  error?: string | undefined;
  testID: string;
  inputRef?: Ref<TextInput>;
  onSubmitEditing?: () => void;
  delay?: number;
} & FieldObservers): ReactElement {
  const t = useTranslator();
  return (
    <AnimatedField delay={delay}>
      <UnderlineInput
        {...(inputRef ? { ref: inputRef } : {})}
        label={t("auth.email")}
        placeholder={t("auth.emailPlaceholder")}
        value={value}
        onChangeText={onChangeText}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        autoCorrect={false}
        returnKeyType="next"
        blurOnSubmit={false}
        hasError={!!error}
        testID={testID}
        {...(onSubmitEditing ? { onSubmitEditing } : {})}
        {...observerProps(observers)}
      />
      {error ? <FieldError text={error} /> : null}
    </AnimatedField>
  );
}

export function AuthPasswordField({
  value,
  onChangeText,
  error,
  testID,
  label,
  placeholder,
  inputRef,
  returnKeyType = "go",
  onSubmitEditing,
  isNew = false,
  delay = 380,
  children,
  onVisibilityChange,
  ...observers
}: {
  value: string;
  onChangeText: (v: string) => void;
  error?: string | undefined;
  testID: string;
  label?: string;
  placeholder?: string;
  inputRef?: Ref<TextInput>;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  isNew?: boolean;
  delay?: number;
  children?: ReactNode;
  onVisibilityChange?: (visible: boolean) => void;
} & FieldObservers): ReactElement {
  const t = useTranslator();
  return (
    <AnimatedField delay={delay}>
      <PasswordInput
        ref={inputRef}
        label={label ?? t("auth.password")}
        placeholder={placeholder ?? t("auth.passwordPlaceholder")}
        value={value}
        onChangeText={onChangeText}
        returnKeyType={returnKeyType}
        showLabel={t("auth.showPassword")}
        hideLabel={t("auth.hidePassword")}
        hasError={!!error}
        isNew={isNew}
        testID={testID}
        {...(onSubmitEditing ? { onSubmitEditing } : {})}
        {...(onVisibilityChange ? { onVisibilityChange } : {})}
        {...observerProps(observers)}
      />
      {error ? <FieldError text={error} /> : null}
      {children}
    </AnimatedField>
  );
}
