/**
 * ConsentDialog — the sign-up consent gate as a dialog.
 *
 * Replaces the inline "I have read and agree…" checkbox: the form stays
 * clean and the decision happens at the moment it matters — on "Create
 * account". Built on the editorial <ConfirmDialog> (serif heading, pill
 * CTAs); the body lists the two documents as links so the user can read
 * them before accepting.
 *
 * Router-agnostic: `onOpenTerms` / `onOpenPrivacy` are wired by the screen.
 */

import { YStack } from "@patch-careers/ui";
import { EditorialTextLink } from "@patch-careers/ui/editorial";
import { FileText } from "lucide-react-native";
import type { ReactElement } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useI18n } from "@/providers/i18n-provider";

export type ConsentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accept → the screen submits the signup with the published versions. */
  onAccept: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  loading?: boolean | undefined;
  testID?: string | undefined;
};

export function ConsentDialog({
  open,
  onOpenChange,
  onAccept,
  onOpenTerms,
  onOpenPrivacy,
  loading = false,
  testID,
}: ConsentDialogProps): ReactElement {
  const { t } = useI18n();
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={FileText}
      title={t("auth.consentDialogTitle")}
      description={t("auth.consentDialogBody")}
      confirmLabel={t("auth.consentAccept")}
      cancelLabel={t("common.back")}
      loading={loading}
      onConfirm={onAccept}
    >
      {/* The two documents, one per line, so each link has a clear tap target. */}
      <YStack gap={10} {...(testID ? { testID } : {})}>
        <EditorialTextLink
          label={`${t("auth.consentTerms")} →`}
          onPress={onOpenTerms}
          fontSize={14}
          {...(testID ? { testID: `${testID}.terms` } : {})}
        />
        <EditorialTextLink
          label={`${t("auth.consentPrivacy")} →`}
          onPress={onOpenPrivacy}
          fontSize={14}
          {...(testID ? { testID: `${testID}.privacy` } : {})}
        />
      </YStack>
    </ConfirmDialog>
  );
}
