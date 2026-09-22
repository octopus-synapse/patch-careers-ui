/**
 * Neutral notice for an account that cannot use password sign-in.
 */
import { Text, YStack } from "@patch-careers/ui";
import { type AuthMascotController, useEditorialPalette } from "@patch-careers/ui/editorial";
import { type ReactElement, useEffect, useRef } from "react";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { AuthStepTitle } from "./auth-step-title";
import { EmailChip } from "./email-chip";

export function UnavailableStep({
  mascot,
  email,
  onChangeEmail,
}: {
  readonly mascot: AuthMascotController;
  readonly email: string;
  readonly onChangeEmail: () => void;
}): ReactElement {
  const { t } = useAuthScreen();
  const palette = useEditorialPalette();

  const sealedOnceRef = useRef(false);
  useEffect(() => {
    if (sealedOnceRef.current) return;
    sealedOnceRef.current = true;
    mascot.seal();
  }, [mascot]);

  return (
    <YStack gap={18} paddingVertical={22}>
      <AuthStepTitle variant="notice">{t("auth.dialogUnavailableTitle")}</AuthStepTitle>

      <EmailChip
        email={email}
        changeLabel={t("auth.dialogChangeEmail")}
        onChange={onChangeEmail}
        testID="authDialog.changeEmailUnavailable"
      />

      <Text fontSize={13.5} lineHeight={20} textAlign="center" color={palette.muted}>
        {t("auth.dialogUnavailableBody")}
      </Text>
    </YStack>
  );
}
