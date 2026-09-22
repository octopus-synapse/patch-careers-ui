/** Identifier-first entry matching the public landing auth modal. */
import { identify } from "@patch-careers/api-client";
import { authDialogPalette } from "@patch-careers/tokens";
import { Icon, Input, Text, XStack, YStack } from "@patch-careers/ui";
import type { AuthMascotController } from "@patch-careers/ui/editorial";
import { editorialFonts, useEditorialPalette, useThemeName } from "@patch-careers/ui/editorial";
import { ArrowUpRight } from "lucide-react-native";
import type { ReactElement } from "react";
import { Controller } from "react-hook-form";
import { ActivityIndicator } from "react-native";
import { fieldErrorsSetter } from "@/components/auth/helpers/apply-field-errors";
import { handleAuthApiError } from "@/components/auth/helpers/handle-auth-api-error";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { useMascotForm } from "@/components/auth/hooks/use-mascot-form";
import { useSubmit } from "@/components/auth/hooks/use-submit";
import { useFieldErrorsForm } from "@/forms";
import { messageOf, validateEmail } from "@/lib/validation";
import { AuthStepTitle } from "./auth-step-title";
import { type AuthBranch, branchForIdentity } from "./branch-for-identity";

type EmailForm = { email: string };

export function EmailStep({
  mascot,
  initialEmail,
  onBranch,
  isPage = false,
}: {
  readonly mascot: AuthMascotController;
  readonly initialEmail: string;
  readonly onBranch: (branch: AuthBranch, email: string) => void;
  readonly isPage?: boolean;
}): ReactElement {
  const { t, locale, toast } = useAuthScreen();
  const palette = useEditorialPalette();
  const dialogPalette = authDialogPalette[useThemeName()];
  const inputHeight = isPage ? 56 : 51;
  const actionGap = isPage ? 26 : 22;
  const { submitting, run } = useSubmit();
  const form = useFieldErrorsForm<EmailForm>(
    (values) => {
      const email = messageOf(validateEmail(values.email.trim()), t);
      return email ? { email } : null;
    },
    { defaultValues: { email: initialEmail } },
  );
  const canContinue = !submitting && validateEmail(form.watch("email")) === null;
  const bind = useMascotForm(mascot, form);

  const onSubmit = form.handleSubmit(
    async ({ email }) => {
      const trimmedEmail = email.trim();
      await run(async () => {
        try {
          const signals = await identify({ email: trimmedEmail });
          mascot.celebrate({ settle: true });
          onBranch(branchForIdentity(signals), trimmedEmail);
        } catch (err) {
          mascot.grimace();
          handleAuthApiError(err, {
            locale,
            t,
            toast,
            setFieldErrors: fieldErrorsSetter(form, ["email"]),
            fallbackKey: "auth.dialogIdentifyFailed",
          });
        }
      });
    },
    () => mascot.grimace(),
  );

  return (
    <YStack>
      <AuthStepTitle variant="hero" isPage={isPage}>
        {t("auth.dialogHeroTitlePre")}
        {"\n"}
        {t("auth.dialogHeroTitleEmphasis")}
      </AuthStepTitle>
      <Text
        fontFamily={editorialFonts.sans}
        fontSize={isPage ? 15 : 12}
        lineHeight={isPage ? 23 : 21.6}
        color={dialogPalette.muted}
        marginTop={isPage ? 20 : 16}
        marginBottom={isPage ? 32 : 28}
      >
        {t("auth.dialogSubtitle")}
      </Text>

      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState }) => (
          <YStack minHeight={inputHeight}>
            <Input
              value={field.value}
              onChangeText={field.onChange}
              placeholder={t("auth.emailPlaceholder")}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={canContinue ? onSubmit : undefined}
              height={inputHeight}
              paddingHorizontal={isPage ? 17 : 15}
              borderWidth={1}
              borderRadius={7}
              backgroundColor={dialogPalette.input}
              borderColor={fieldState.error ? palette.danger : dialogPalette.inputBorder}
              color={dialogPalette.brand}
              fontFamily={editorialFonts.sans}
              fontSize={isPage ? 15 : 14}
              focusStyle={{
                borderColor: dialogPalette.focus,
                outlineColor: dialogPalette.focus,
              }}
              testID="authDialog.email"
              {...bind.text("email", "email")}
            />
            {fieldState.error ? (
              <Text fontSize={11} color={palette.danger} marginTop={7}>
                {fieldState.error.message}
              </Text>
            ) : null}
          </YStack>
        )}
      />

      <XStack
        onPress={canContinue ? onSubmit : undefined}
        accessibilityRole="button"
        accessibilityLabel={t("auth.dialogContinue")}
        accessibilityState={{ disabled: !canContinue, busy: submitting }}
        alignItems="center"
        justifyContent="space-between"
        minHeight={isPage ? 57 : 51}
        marginTop={actionGap}
        paddingHorizontal={isPage ? 21 : 19}
        borderRadius={7}
        backgroundColor={dialogPalette.primary}
        opacity={canContinue ? 1 : 0.45}
        pressStyle={{ backgroundColor: dialogPalette.primaryPress }}
        testID="authDialog.continue"
      >
        {submitting ? (
          <ActivityIndicator size="small" color={palette.onPrimary} />
        ) : (
          <>
            <Text
              fontFamily={editorialFonts.sans}
              fontSize={isPage ? 14 : 12}
              fontWeight="500"
              color={palette.onPrimary}
            >
              {t("auth.dialogContinue")}
            </Text>
            <Icon as={ArrowUpRight} size={18} color={palette.onPrimary} />
          </>
        )}
      </XStack>
    </YStack>
  );
}
