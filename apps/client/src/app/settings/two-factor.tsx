/**
 * Settings → Account → "Two-step verification".
 *
 * Sign-in already knows how to ask for a code — `(auth)/2fa-verify` has been
 * there all along. What was missing is the half where a person turns it on:
 * the QR to scan, the code that proves the app is paired, the backup codes,
 * and the way back out. Without this screen the five endpoints behind it
 * were unreachable and the feature did not exist for anyone.
 *
 * Backup codes are shown exactly once, when they are generated. The screen
 * says so before it shows them.
 */

import {
  useDeleteV1Auth2Fa,
  useGetV1Auth2FaStatus,
  usePostV1Auth2FaBackupCodesRegenerate,
  usePostV1Auth2FaSetup,
  usePostV1Auth2FaVerify,
} from "@patch-careers/api-client";
import { useToast, YStack } from "@patch-careers/ui";
import {
  PrimaryAction,
  SettingsCard,
  UnderlineInput,
  useEditorialPalette,
} from "@patch-careers/ui/editorial";
import { type ReactElement, useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SettingsScreenShell } from "@/components/settings-screen-shell";
import { SectionHeader, useSet } from "@/features/settings";
import { copyToClipboard } from "@/lib/clipboard";
import { useI18n } from "@/providers/i18n-provider";

const CODE_LENGTH = 6;
const QR_PX = 200;

export default function TwoFactorScreen(): ReactElement {
  const { t, locale } = useI18n();
  const styles = useSet();
  const palette = useEditorialPalette();
  const toast = useToast();

  const status = useGetV1Auth2FaStatus();
  const setup = usePostV1Auth2FaSetup();
  const verify = usePostV1Auth2FaVerify();
  const regenerate = usePostV1Auth2FaBackupCodesRegenerate();
  const disable = useDeleteV1Auth2Fa();

  // The pairing payload, held only while the person is mid-setup.
  const [pairing, setPairing] = useState<{ qrCode: string; manualEntryKey: string } | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [disableOpen, setDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");

  const enabled = status.data?.enabled === true;
  const busy = setup.isPending || verify.isPending;

  const startSetup = (): void => {
    setup.mutate(undefined, {
      onSuccess: (data) => {
        setPairing({ qrCode: data.qrCode, manualEntryKey: data.manualEntryKey });
        setCode("");
      },
      onError: () => toast.show({ title: t("settings.twoFactor.setupFailed"), intent: "danger" }),
    });
  };

  const confirmPairing = (): void => {
    verify.mutate(
      { data: { code } },
      {
        onSuccess: (data) => {
          setPairing(null);
          setCode("");
          setBackupCodes(data.backupCodes);
          void status.refetch();
          toast.show({ title: t("settings.twoFactor.enabled"), intent: "success" });
        },
        onError: () =>
          toast.show({ title: t("settings.twoFactor.codeRejected"), intent: "danger" }),
      },
    );
  };

  const doRegenerate = (): void => {
    regenerate.mutate(undefined, {
      onSuccess: (data) => setBackupCodes(data.backupCodes),
      onError: () =>
        toast.show({ title: t("settings.twoFactor.regenerateFailed"), intent: "danger" }),
    });
  };

  const doDisable = (): void => {
    disable.mutate(
      { data: { currentPassword: disablePassword, totpCode: disableCode } },
      {
        onSuccess: () => {
          setDisableOpen(false);
          setDisablePassword("");
          setDisableCode("");
          setBackupCodes(null);
          void status.refetch();
          toast.show({ title: t("settings.twoFactor.disabled"), intent: "success" });
        },
        onError: () =>
          toast.show({ title: t("settings.twoFactor.disableFailed"), intent: "danger" }),
      },
    );
  };

  const copyCodes = async (): Promise<void> => {
    if (!backupCodes) return;
    const ok = await copyToClipboard(backupCodes.join("\n"));
    toast.show({
      title: ok ? t("settings.twoFactor.codesCopied") : t("settings.twoFactor.codesCopyFailed"),
      intent: ok ? "success" : "danger",
    });
  };

  return (
    <SettingsScreenShell
      title={t("settings.twoFactor.title")}
      description={t("settings.twoFactor.description")}
    >
      {status.isLoading ? (
        <YStack marginTop={24}>
          <ActivityIndicator color={palette.ink} />
        </YStack>
      ) : pairing ? (
        <SettingsCard>
          <View style={styles.cardInner}>
            <Text style={styles.bodyText}>{t("settings.twoFactor.scanStep")}</Text>
            <Image
              source={{ uri: pairing.qrCode }}
              style={{ width: QR_PX, height: QR_PX, alignSelf: "center" }}
              accessibilityLabel={t("settings.twoFactor.qrA11y")}
            />
            <Text style={styles.bodyText}>
              {t("settings.twoFactor.manualKey", { key: pairing.manualEntryKey })}
            </Text>
            <UnderlineInput
              label={t("settings.twoFactor.codeLabel")}
              value={code}
              onChangeText={(next) => setCode(next.replace(/\D/g, "").slice(0, CODE_LENGTH))}
              keyboardType="number-pad"
            />
            <PrimaryAction
              label={t("settings.twoFactor.confirm")}
              loading={verify.isPending}
              disabled={code.length !== CODE_LENGTH}
              onPress={confirmPairing}
            />
          </View>
        </SettingsCard>
      ) : (
        <SettingsCard>
          <View style={styles.stackedRow}>
            <View style={styles.stackedRowBody}>
              <Text style={styles.rowLabel}>
                {enabled ? t("settings.twoFactor.onLabel") : t("settings.twoFactor.offLabel")}
              </Text>
              <Text style={styles.bodyText}>
                {enabled
                  ? status.data?.lastUsedAt
                    ? t("settings.twoFactor.lastUsed", {
                        date: new Date(status.data.lastUsedAt).toLocaleDateString(locale),
                      })
                    : t("settings.twoFactor.neverUsed")
                  : t("settings.twoFactor.offBody")}
              </Text>
            </View>
            <PrimaryAction
              label={enabled ? t("settings.twoFactor.disable") : t("settings.twoFactor.enable")}
              loading={busy}
              onPress={enabled ? () => setDisableOpen(true) : startSetup}
            />
          </View>
        </SettingsCard>
      )}

      {backupCodes ? (
        <>
          <SectionHeader label={t("settings.twoFactor.backupLabel")} />
          <SettingsCard>
            <View style={styles.cardInner}>
              <Text style={styles.bodyText}>{t("settings.twoFactor.backupWarning")}</Text>
              {backupCodes.map((backupCode) => (
                <Text key={backupCode} style={styles.rowLabel}>
                  {backupCode}
                </Text>
              ))}
              <PrimaryAction
                label={t("settings.twoFactor.copyCodes")}
                onPress={() => void copyCodes()}
              />
            </View>
          </SettingsCard>
        </>
      ) : enabled ? (
        <>
          <SectionHeader label={t("settings.twoFactor.backupLabel")} />
          <SettingsCard>
            <View style={styles.stackedRow}>
              <View style={styles.stackedRowBody}>
                <Text style={styles.rowLabel}>{t("settings.twoFactor.regenerateLabel")}</Text>
                <Text style={styles.bodyText}>{t("settings.twoFactor.regenerateBody")}</Text>
              </View>
              <PrimaryAction
                label={t("settings.twoFactor.regenerate")}
                loading={regenerate.isPending}
                onPress={doRegenerate}
              />
            </View>
          </SettingsCard>
        </>
      ) : null}

      <ConfirmDialog
        open={disableOpen}
        onOpenChange={(open) => {
          setDisableOpen(open);
          if (!open) {
            setDisablePassword("");
            setDisableCode("");
          }
        }}
        title={t("settings.twoFactor.disableTitle")}
        description={t("settings.twoFactor.disableBody")}
        danger
        confirmLabel={t("settings.twoFactor.disable")}
        confirmDisabled={disablePassword.length === 0 || disableCode.length !== CODE_LENGTH}
        onConfirm={doDisable}
      >
        <UnderlineInput
          label={t("settings.twoFactor.passwordLabel")}
          value={disablePassword}
          onChangeText={setDisablePassword}
          secureTextEntry
        />
        <UnderlineInput
          label={t("settings.twoFactor.codeLabel")}
          value={disableCode}
          onChangeText={(next) => setDisableCode(next.replace(/\D/g, "").slice(0, CODE_LENGTH))}
          keyboardType="number-pad"
        />
      </ConfirmDialog>
    </SettingsScreenShell>
  );
}
