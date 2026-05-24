/**
 * Reset-password screen — lives at the root `/reset-password` path
 * (not inside the `(auth)` group) so universal links of the form
 * `https://patchcareers.com/reset-password?token=X` land here directly
 * via Expo Router's typed routes.
 *
 * D100: token comes from the deep link → 2 password inputs with a
 * PasswordStrengthBar → POST /v1/auth/reset-password → toast + bounce
 * to /sign-in.
 */

import { postV1AuthResetPassword } from "@patch-careers/api-client";
import { palette } from "@patch-careers/tokens";
import {
  Button,
  FormField,
  Icon,
  PasswordStrengthBar,
  Text,
  useToast,
  XStack,
  YStack,
} from "@patch-careers/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AuthScreenLayout } from "../components/AuthScreenLayout";
import { useTranslator } from "../providers/I18nProvider";

export default function ResetPasswordScreen(): ReactElement {
  const t = useTranslator();
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ token?: string }>();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mismatchError, setMismatchError] = useState<string | undefined>(undefined);

  const tokenMissing = !params.token || params.token.length === 0;

  async function handleSubmit() {
    if (newPassword !== confirmPassword) {
      setMismatchError(t("auth.resetMismatch"));
      return;
    }
    if (tokenMissing) return;
    setMismatchError(undefined);
    setSubmitting(true);
    try {
      await postV1AuthResetPassword({
        token: params.token as string,
        newPassword,
      });
      toast.show({ title: t("auth.resetSuccess"), intent: "success" });
      router.replace("/(auth)/sign-in");
    } catch {
      toast.show({ title: t("auth.resetInvalidToken"), intent: "danger" });
    } finally {
      setSubmitting(false);
    }
  }

  if (tokenMissing) {
    return (
      <AuthScreenLayout title={t("auth.resetTitle")}>
        <View style={styles.errorBanner}>
          <Text preset="body" color={palette.red[700]}>
            {t("auth.resetInvalidToken")}
          </Text>
        </View>
        <Button
          intent="accent"
          size="lg"
          onPress={() => router.replace("/(auth)/forgot-password")}
          testID="reset.requestNew"
        >
          {t("auth.forgotPassword")}
        </Button>
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout title={t("auth.resetTitle")}>
      <YStack gap={12}>
        <YStack gap={8}>
          <XStack alignItems="flex-end">
            <YStack flex={1}>
              <FormField
                label={t("auth.resetNewPassword")}
                placeholder={t("auth.passwordPlaceholder")}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                textContentType="newPassword"
                value={newPassword}
                onChangeText={(next: string) => {
                  setNewPassword(next);
                  if (mismatchError) setMismatchError(undefined);
                }}
                testID="reset.password"
              />
            </YStack>
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              style={styles.eyeButton}
              testID="reset.passwordToggle"
            >
              <Icon as={showPassword ? EyeOff : Eye} size="md" />
            </Pressable>
          </XStack>
          <PasswordStrengthBar password={newPassword} />
        </YStack>

        <FormField
          label={t("auth.resetConfirmPassword")}
          placeholder={t("auth.passwordPlaceholder")}
          secureTextEntry={!showPassword}
          autoComplete="new-password"
          textContentType="newPassword"
          value={confirmPassword}
          onChangeText={(next: string) => {
            setConfirmPassword(next);
            if (mismatchError) setMismatchError(undefined);
          }}
          {...(mismatchError ? { error: mismatchError } : {})}
          testID="reset.confirm"
        />

        <Button
          intent="accent"
          size="lg"
          loading={submitting}
          onPress={handleSubmit}
          testID="reset.submit"
        >
          {t("common.submit")}
        </Button>
      </YStack>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  eyeButton: {
    padding: 12,
    marginLeft: 4,
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  errorBanner: {
    backgroundColor: palette.red[50],
    borderColor: palette.red[200],
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
});
