import { postV1AuthForgotPassword } from "@patch-careers/api-client";
import { authDialogPalette } from "@patch-careers/tokens";
import { Icon, Input, Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette, useThemeName } from "@patch-careers/ui/editorial";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { ActivityIndicator } from "react-native";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { useSubmit } from "@/components/auth/hooks/use-submit";
import { messageOf, validateEmail } from "@/lib/validation";
import { AUTH_PAGE_PANEL_CONTENT_HEIGHT } from "./auth-flow-panel";
import { AuthStepTitle } from "./auth-step-title";

export function ForgotPasswordStep({
  initialEmail,
  onEmailAccepted,
  onBack,
  isPage = false,
}: {
  readonly initialEmail: string;
  readonly onEmailAccepted: (email: string) => void;
  readonly onBack: () => void;
  readonly isPage?: boolean;
}): ReactElement {
  const { t } = useAuthScreen();
  const palette = useEditorialPalette();
  const colors = authDialogPalette[useThemeName()];
  const { submitting, run } = useSubmit();
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = (): void => {
    const trimmed = email.trim();
    const validation = messageOf(validateEmail(trimmed), t);
    if (validation) {
      setError(validation);
      return;
    }
    void run(async () => {
      try {
        await postV1AuthForgotPassword({ email: trimmed });
        onEmailAccepted(trimmed);
        setSent(true);
      } catch {
        // The API gives the same response for existing and unknown accounts.
        // Transport failures must still allow a retry instead of claiming delivery.
        setError(t("auth.forgotSendFailed"));
      }
    });
  };

  return (
    <YStack
      position="relative"
      gap={sent ? 0 : isPage ? 26 : 22}
      height={isPage ? AUTH_PAGE_PANEL_CONTENT_HEIGHT : undefined}
      justifyContent={isPage ? "center" : undefined}
      paddingTop={isPage ? 0 : 4}
      paddingBottom={isPage ? 0 : 8}
    >
      {sent ? null : (
        <XStack
          onPress={onBack}
          accessibilityRole="button"
          alignItems="center"
          gap={8}
          alignSelf="flex-start"
          cursor="pointer"
          {...(isPage ? { position: "absolute" as const, top: 0, left: 0 } : {})}
          testID="forgot.backLink"
        >
          <Icon as={ArrowLeft} size={16} color={colors.brandMuted} />
          <Text fontFamily={editorialFonts.sans} fontSize={12} color={colors.brandMuted}>
            {t("common.back")}
          </Text>
        </XStack>
      )}
      {sent ? (
        <XStack alignItems="center" gap={8} marginBottom={16}>
          <Icon as={Check} size={16} color={colors.brandMuted} />
          <Text
            fontFamily={editorialFonts.sans}
            fontSize={11}
            fontWeight="600"
            letterSpacing={1.2}
            color={colors.brandMuted}
          >
            {t("auth.forgotSuccessEyebrow").toUpperCase()}
          </Text>
        </XStack>
      ) : null}
      <AuthStepTitle isPage={isPage} variant="plan">
        {t(sent ? "auth.forgotSuccessTitle" : "auth.forgotTitle")}
      </AuthStepTitle>
      <Text
        fontFamily={editorialFonts.sans}
        fontSize={isPage ? 16 : 14}
        lineHeight={isPage ? 24 : 21}
        color={colors.muted}
        marginTop={sent ? 14 : 0}
      >
        {sent ? t("auth.forgotSuccess") : t("auth.forgotIntro")}
      </Text>

      {sent ? null : (
        <YStack gap={isPage ? 10 : 8}>
          <Text
            fontFamily={editorialFonts.sans}
            fontSize={isPage ? 10 : 9}
            fontWeight="600"
            letterSpacing={1.3}
            color={colors.muted}
          >
            {t("auth.email").toUpperCase()}
          </Text>
          <Input
            value={email}
            onChangeText={(value: string) => {
              setEmail(value);
              setError("");
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            returnKeyType="send"
            onSubmitEditing={onSubmit}
            minHeight={isPage ? 56 : 51}
            paddingHorizontal={isPage ? 17 : 15}
            borderWidth={1}
            borderRadius={7}
            backgroundColor={colors.input}
            borderColor={error ? palette.danger : colors.inputBorder}
            color={colors.brand}
            fontFamily={editorialFonts.sans}
            fontSize={isPage ? 15 : 14}
            testID="forgot.email"
          />
          {error ? (
            <Text fontSize={12} color={palette.danger}>
              {error}
            </Text>
          ) : null}
        </YStack>
      )}

      <XStack
        onPress={submitting ? undefined : sent ? onBack : onSubmit}
        accessibilityRole="button"
        accessibilityLabel={t(sent ? "auth.signIn" : "common.submit")}
        accessibilityState={{ disabled: submitting, busy: submitting }}
        minHeight={isPage ? 57 : 53}
        marginTop={sent ? 30 : 0}
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal={isPage ? 21 : 19}
        borderRadius={7}
        backgroundColor={colors.primary}
        opacity={submitting ? 0.55 : 1}
        pressStyle={{ backgroundColor: colors.primaryPress }}
        testID={sent ? "forgot.backToSignIn" : "forgot.submit"}
      >
        {submitting ? (
          <ActivityIndicator size="small" color={palette.onPrimary} />
        ) : (
          <>
            <Text
              fontFamily={editorialFonts.sans}
              fontSize={isPage ? 14 : 12}
              fontWeight="600"
              color={palette.onPrimary}
            >
              {t(sent ? "auth.signIn" : "common.submit")}
            </Text>
            <Icon as={ArrowUpRight} size={18} color={palette.onPrimary} />
          </>
        )}
      </XStack>
    </YStack>
  );
}
