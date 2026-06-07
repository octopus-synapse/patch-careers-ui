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
import type { ReturnKeyTypeOptions, TextInput } from "react-native";
import { useTranslator } from "../../providers/I18nProvider";

export function AuthEmailField({
  value,
  onChangeText,
  error,
  testID,
  onSubmitEditing,
  delay = 300,
}: {
  value: string;
  onChangeText: (v: string) => void;
  error?: string | undefined;
  testID: string;
  onSubmitEditing?: () => void;
  delay?: number;
}): ReactElement {
  const t = useTranslator();
  return (
    <AnimatedField delay={delay}>
      <UnderlineInput
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
}): ReactElement {
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
      />
      {error ? <FieldError text={error} /> : null}
      {children}
    </AnimatedField>
  );
}
