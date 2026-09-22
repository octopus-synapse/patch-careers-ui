import { postV1AuthResetPassword } from "@patch-careers/api-client";
import { authDialogPalette } from "@patch-careers/tokens";
import { Icon, Input, Text, XStack, YStack } from "@patch-careers/ui";
import {
  editorialFonts,
  PasswordStrengthMeter,
  useEditorialPalette,
  useThemeName,
} from "@patch-careers/ui/editorial";
import { ArrowUpRight, Eye, EyeOff } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { Controller } from "react-hook-form";
import { ActivityIndicator } from "react-native";
import { AuthFlowPanel } from "@/components/auth/auth-dialog/auth-flow-panel";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { useSubmit } from "@/components/auth/hooks/use-submit";
import { passwordMeterLabels } from "@/components/auth/password-meter-labels";
import { useFieldErrorsForm } from "@/forms";
import { messageOf, validatePassword } from "@/lib/validation";
import { useLocalizedHref } from "@/navigation/locale-prefix";

type ResetForm = { newPassword: string; confirmPassword: string };

export function ResetPasswordCard({ token }: { readonly token?: string }): ReactElement {
  const { t, router } = useAuthScreen();
  const localized = useLocalizedHref();
  const palette = useEditorialPalette();
  const colors = authDialogPalette[useThemeName()];
  const { submitting, run } = useSubmit();
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<"editing" | "invalid" | "success">(
    token ? "editing" : "invalid",
  );
  const [requestError, setRequestError] = useState("");
  const form = useFieldErrorsForm<ResetForm>(
    (values) => {
      const errors: Partial<Record<keyof ResetForm, string>> = {};
      const passwordError = messageOf(validatePassword(values.newPassword), t);
      if (passwordError) errors.newPassword = passwordError;
      if (!values.confirmPassword || values.newPassword !== values.confirmPassword) {
        errors.confirmPassword = t("validation.passwordMismatch");
      }
      return Object.keys(errors).length ? errors : null;
    },
    { defaultValues: { newPassword: "", confirmPassword: "" } },
  );
  const password = form.watch("newPassword");
  const onSubmit = form.handleSubmit(async ({ newPassword }) => {
    if (!token) return;
    setRequestError("");
    await run(async () => {
      try {
        await postV1AuthResetPassword({ token, newPassword });
        setStatus("success");
      } catch (error) {
        if (error && typeof error === "object" && "status" in error && error.status === 400) {
          setStatus("invalid");
        } else {
          setRequestError(t("auth.resetFailed"));
        }
      }
    });
  });

  const goTo = (path: "/(auth)/auth" | "/(auth)/auth?step=forgot-password"): void => {
    router.replace(localized(path));
  };

  const field = (name: keyof ResetForm, label: string) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field: value, fieldState }) => (
        <YStack gap={8}>
          <Text
            fontFamily={editorialFonts.sans}
            fontSize={9}
            fontWeight="600"
            letterSpacing={1.3}
            color={colors.muted}
          >
            {label.toUpperCase()}
          </Text>
          <XStack
            minHeight={51}
            alignItems="center"
            borderWidth={1}
            borderRadius={7}
            borderColor={fieldState.error ? palette.danger : colors.inputBorder}
            backgroundColor={colors.input}
          >
            <Input
              flex={1}
              height={49}
              paddingHorizontal={15}
              borderWidth={0}
              backgroundColor="transparent"
              color={colors.brand}
              fontFamily={editorialFonts.sans}
              fontSize={14}
              secureTextEntry={!visible}
              autoComplete="new-password"
              returnKeyType={name === "confirmPassword" ? "go" : "next"}
              onSubmitEditing={name === "confirmPassword" ? onSubmit : undefined}
              value={String(value.value ?? "")}
              onChangeText={value.onChange}
              testID={name === "newPassword" ? "reset.password" : "reset.confirm"}
            />
            <XStack
              onPress={() => setVisible((current) => !current)}
              accessibilityRole="button"
              accessibilityLabel={t(visible ? "auth.hidePassword" : "auth.showPassword")}
              width={48}
              height={49}
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={visible ? EyeOff : Eye} size={17} color={colors.muted} />
            </XStack>
          </XStack>
          {fieldState.error ? (
            <Text fontSize={11} color={palette.danger}>
              {fieldState.error.message}
            </Text>
          ) : null}
          {name === "newPassword" ? (
            <PasswordStrengthMeter password={password} {...passwordMeterLabels(t)} />
          ) : null}
        </YStack>
      )}
    />
  );

  const actionLabel =
    status === "editing"
      ? t("common.submit")
      : status === "success"
        ? t("auth.signIn")
        : t("auth.forgotPassword");
  const action =
    status === "editing"
      ? onSubmit
      : status === "success"
        ? () => goTo("/(auth)/auth")
        : () => goTo("/(auth)/auth?step=forgot-password");

  return (
    <AuthFlowPanel variant="page">
      <YStack gap={22} paddingTop={4} paddingBottom={8}>
        <Text
          fontFamily={editorialFonts.sans}
          fontSize={38}
          lineHeight={41}
          fontWeight="600"
          letterSpacing={-1.7}
          color={colors.brand}
        >
          {t("auth.resetTitle")}
        </Text>
        {status === "editing" ? (
          <>
            {field("newPassword", t("auth.resetNewPassword"))}
            {field("confirmPassword", t("auth.resetConfirmPassword"))}
            {requestError ? (
              <Text fontSize={12} color={palette.danger}>
                {requestError}
              </Text>
            ) : null}
          </>
        ) : (
          <Text
            fontFamily={editorialFonts.sans}
            fontSize={14}
            lineHeight={21}
            color={status === "invalid" ? palette.danger : colors.muted}
            testID={status === "invalid" ? "reset.invalidToken" : "reset.success"}
          >
            {t(status === "invalid" ? "auth.resetInvalidToken" : "auth.resetSuccess")}
          </Text>
        )}
        <XStack
          onPress={submitting ? undefined : action}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          accessibilityState={{ disabled: submitting, busy: submitting }}
          minHeight={53}
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal={19}
          borderRadius={7}
          backgroundColor={colors.primary}
          opacity={submitting ? 0.55 : 1}
          pressStyle={{ backgroundColor: colors.primaryPress }}
          testID={
            status === "editing"
              ? "reset.submit"
              : status === "invalid"
                ? "reset.requestNew"
                : "reset.backToAuth"
          }
        >
          {submitting ? (
            <ActivityIndicator size="small" color={palette.onPrimary} />
          ) : (
            <>
              <Text
                fontFamily={editorialFonts.sans}
                fontSize={12}
                fontWeight="600"
                color={palette.onPrimary}
              >
                {actionLabel}
              </Text>
              <Icon as={ArrowUpRight} size={18} color={palette.onPrimary} />
            </>
          )}
        </XStack>
      </YStack>
    </AuthFlowPanel>
  );
}
