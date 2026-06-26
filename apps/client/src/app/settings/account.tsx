/**
 * Account — email, password, username, connected accounts, plus an "Account
 * actions" section (export data / deactivate / delete) at the bottom.
 */

import {
  useDeleteV1AccountsDeactivate,
  useGetV1MeGdprExport,
  usePostV1AccountsDeleteRequest,
} from "@patch-careers/api-client";
import { logout } from "@patch-careers/auth";
import { useToast } from "@patch-careers/ui";
import { UnderlineInput } from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import { AtSign, Download, KeyRound, Link2, Mail, Trash2, UserMinus } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SectionHeader, SettingsCard, SettingsRow, SettingsScreenShell } from "@/features/settings";
import { AUTH_SIGN_IN_ROUTE } from "@/navigation/auth-redirect";
import { useAuthState } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

// The backend validates this exact English phrase (DELETION_CONFIRMATION_PHRASE
// in account-lifecycle) at the delete *request* step. The phrase the user
// *types* is localized for UX, but the payload we send must stay canonical —
// so the two are decoupled.
const DELETION_CONFIRMATION_PHRASE = "DELETE MY ACCOUNT";

export default function AccountScreen(): ReactElement {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const { currentUser } = useAuthState();

  const gdpr = useGetV1MeGdprExport({ query: { enabled: false } });
  const deactivate = useDeleteV1AccountsDeactivate();
  const deleteRequest = usePostV1AccountsDeleteRequest();

  const [exported, setExported] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deactivatePhrase, setDeactivatePhrase] = useState("");
  const [phrase, setPhrase] = useState("");
  const [password, setPassword] = useState("");

  // Deactivate has no backend phrase (the API only flips isActive), so this is
  // a purely client-side gate to make the action deliberate.
  const requiredDeactivatePhrase = t("settings.danger.deactivate.phrase");
  const canDeactivate = deactivatePhrase === requiredDeactivatePhrase;
  const requiredPhrase = t("settings.danger.delete.phrase");
  const canDelete = phrase === requiredPhrase && password.length > 0;

  const finishSignedOut = async (): Promise<void> => {
    await logout();
    router.replace(AUTH_SIGN_IN_ROUTE);
  };
  const doExport = (): void => {
    void gdpr.refetch().then(() => setExported(true));
  };
  const doDeactivate = (): void => {
    deactivate.mutate({ data: {} }, { onSuccess: () => void finishSignedOut() });
  };
  const closeDeactivate = (open: boolean): void => {
    setConfirmDeactivate(open);
    if (!open) setDeactivatePhrase("");
  };
  // Step 1 of the two-step deletion: re-auth (phrase + password) and email a
  // code. The account is only erased on the verify-code screen (step 2).
  // Step 1 of the two-step deletion: re-auth (phrase + password) and email a
  // code. The account is only erased on the verify-code screen (step 2).
  const doDelete = (): void => {
    deleteRequest.mutate(
      { data: { confirmationPhrase: DELETION_CONFIRMATION_PHRASE, currentPassword: password } },
      {
        onSuccess: () => {
          closeDelete(false);
          router.push({ pathname: "/settings/verify-code", params: { flow: "delete" } });
        },
        onError: () =>
          toast.show({ title: t("settings.danger.delete.requestFailed"), intent: "danger" }),
      },
    );
  };
  const closeDelete = (open: boolean): void => {
    setConfirmDelete(open);
    if (!open) {
      setPhrase("");
      setPassword("");
    }
  };

  return (
    <SettingsScreenShell title={t("settings.account.title")}>
      <SettingsCard>
        <SettingsRow
          first
          icon={Mail}
          label={t("settings.account.emailRow")}
          value={currentUser?.email ?? ""}
          badge={
            currentUser?.needsEmailVerification ? t("settings.account.emailUnverified") : undefined
          }
          onPress={() => router.push("/settings/change-email")}
        />
        <SettingsRow
          icon={KeyRound}
          label={t("settings.account.passwordRow")}
          onPress={() => router.push("/settings/change-password")}
        />
        <SettingsRow
          icon={AtSign}
          label={t("settings.account.usernameRow")}
          value={currentUser?.username ? `@${currentUser.username}` : ""}
          onPress={() => router.push("/settings/username")}
        />
        <SettingsRow
          icon={Link2}
          label={t("settings.account.connectedRow")}
          onPress={() => router.push("/settings/connected-accounts")}
        />
      </SettingsCard>

      <SectionHeader label={t("settings.account.actions")} />
      <SettingsCard>
        <SettingsRow
          first
          icon={Download}
          label={t("settings.danger.export.row")}
          value={exported ? t("settings.danger.export.requested") : undefined}
          onPress={doExport}
        />
        <SettingsRow
          danger
          icon={UserMinus}
          label={t("settings.danger.deactivate.row")}
          onPress={() => setConfirmDeactivate(true)}
        />
        <SettingsRow
          danger
          icon={Trash2}
          label={t("settings.danger.delete.row")}
          onPress={() => setConfirmDelete(true)}
        />
      </SettingsCard>

      <ConfirmDialog
        open={confirmDeactivate}
        onOpenChange={closeDeactivate}
        danger
        icon={UserMinus}
        title={t("settings.danger.deactivate.confirmTitle")}
        description={t("settings.danger.deactivate.confirmBody")}
        confirmLabel={t("settings.danger.deactivate.row")}
        confirmDisabled={!canDeactivate}
        loading={deactivate.isPending}
        onConfirm={doDeactivate}
      >
        <UnderlineInput
          label={t("settings.danger.deactivate.phraseLabel", { phrase: requiredDeactivatePhrase })}
          value={deactivatePhrase}
          onChangeText={setDeactivatePhrase}
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={closeDelete}
        danger
        icon={Trash2}
        title={t("settings.danger.delete.confirmTitle")}
        description={t("settings.danger.delete.confirmBody")}
        confirmLabel={t("settings.danger.delete.sendCode")}
        confirmDisabled={!canDelete}
        loading={deleteRequest.isPending}
        onConfirm={doDelete}
      >
        <UnderlineInput
          label={t("settings.danger.delete.phraseLabel", { phrase: requiredPhrase })}
          value={phrase}
          onChangeText={setPhrase}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <UnderlineInput
          label={t("settings.danger.delete.passwordLabel")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
      </ConfirmDialog>
    </SettingsScreenShell>
  );
}
