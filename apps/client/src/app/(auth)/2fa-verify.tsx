/**
 * 2FA verification screen (D104) — "Editorial Calm" DS. Second leg of a
 * sign-in the backend gated with `twoFactorRequired: true`.
 *
 * Two input modes: TOTP (6-digit, auto-submit) and a single-use backup
 * code. On success `verifyTwoFactor()` persists the pair and
 * `finishAuthentication()` bootstraps + routes to the post-auth home.
 */

import { verifyTwoFactor } from "@patch-careers/auth";
import { OTPInput } from "@patch-careers/ui";
import {
  AuthShell,
  CaptionButton,
  IntroBlock,
  PrimaryAction,
  UnderlineInput,
} from "@patch-careers/ui/editorial";
import { useLocalSearchParams } from "expo-router";
import { type ReactElement, useState } from "react";
import { Platform, View } from "react-native";
import { BackToSignInLink } from "@/components/auth/back-to-sign-in-link";
import { failToSignIn } from "@/components/auth/helpers/failToSignIn";
import { useAuthScreen } from "@/components/auth/hooks/useAuthScreen";
import { useCompleteAuth } from "@/components/auth/hooks/useCompleteAuth";
import { useSubmit } from "@/components/auth/hooks/useSubmit";

export default function TwoFactorVerifyScreen(): ReactElement {
  const { t, router, toast } = useAuthScreen();
  const { finishAuthentication } = useCompleteAuth();
  const { submitting, run } = useSubmit();
  const params = useLocalSearchParams<{ userId?: string; keepSignedIn?: string }>();
  const keepSignedIn = params.keepSignedIn === "1";

  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [code, setCode] = useState("");
  const [backupCode, setBackupCode] = useState("");

  async function submitCode(value: string) {
    const userId = params.userId;
    if (!userId) {
      failToSignIn({ toast, router, t, titleKey: "auth.loginFailed" });
      return;
    }
    await run(async () => {
      try {
        const result = await verifyTwoFactor(
          userId,
          value,
          Platform.OS === "web" ? { keepSignedIn } : undefined,
        );
        await finishAuthentication(
          result.sessionExchangeId ? { sessionExchangeId: result.sessionExchangeId } : undefined,
        );
      } catch {
        toast.show({ title: t("auth.loginFailed"), intent: "danger" });
      }
    });
  }

  async function handleBackupSubmit() {
    if (backupCode.trim().length === 0) return;
    await submitCode(backupCode.trim());
  }

  return (
    <AuthShell>
      <IntroBlock
        emphasis={mode === "totp" ? t("auth.twoFaTitle") : t("auth.twoFaBackupTitle")}
        subtitle={mode === "totp" ? t("auth.twoFaIntro") : t("auth.twoFaBackupIntro")}
      />
      <View style={{ gap: 20 }}>
        {mode === "totp" ? (
          <View style={{ alignItems: "center" }}>
            <OTPInput
              value={code}
              onChangeText={setCode}
              onComplete={(v) => void submitCode(v)}
              autoFocus
            />
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <UnderlineInput
              label={t("auth.twoFaBackupTitle")}
              placeholder={t("auth.twoFaBackupPlaceholder")}
              autoCapitalize="characters"
              value={backupCode}
              onChangeText={setBackupCode}
              testID="twofa.backupCode"
            />
            <PrimaryAction
              label={t("common.submit")}
              loading={submitting}
              onPress={handleBackupSubmit}
              testID="twofa.backupSubmit"
            />
          </View>
        )}

        <CaptionButton
          label={mode === "totp" ? t("auth.twoFaUseBackup") : t("auth.twoFaUseTotp")}
          onPress={() => setMode(mode === "totp" ? "backup" : "totp")}
          testID="twofa.toggleMode"
        />
        <BackToSignInLink testID="twofa.backToSignIn" />
      </View>
    </AuthShell>
  );
}
