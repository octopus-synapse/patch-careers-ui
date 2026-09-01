/**
 * OAuth-only step of the unified auth dialog — `identify` said this
 * account has no password (social sign-up), so a password field would be
 * a wall the user can never climb. Point at the provider chips instead.
 */
import { Text, YStack } from "@patch-careers/ui";
import {
  type AuthMascotController,
  editorialFonts,
  useEditorialPalette,
} from "@patch-careers/ui/editorial";
import { type ReactElement, useEffect, useRef } from "react";
import { useAuthScreen } from "@/components/auth/hooks/use-auth-screen";
import { OAuthProviderRow } from "@/components/auth/oauth-provider-row";
import { EmailChip } from "./email-chip";

export function OauthOnlyStep({
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
      <Text
        fontFamily={editorialFonts.serif}
        fontSize={27}
        lineHeight={32}
        letterSpacing={-0.4}
        textAlign="center"
        color={palette.ink}
      >
        {t("auth.dialogOauthOnlyTitle")}
      </Text>

      <EmailChip
        email={email}
        changeLabel={t("auth.dialogChangeEmail")}
        onChange={onChangeEmail}
        testID="authDialog.changeEmailOauth"
      />

      <Text fontSize={13.5} lineHeight={20} textAlign="center" color={palette.muted}>
        {t("auth.dialogOauthOnlyBody")}
      </Text>

      <YStack marginVertical={-22}>
        <OAuthProviderRow testIDPrefix="authDialog.oauthOnly" />
      </YStack>
    </YStack>
  );
}
