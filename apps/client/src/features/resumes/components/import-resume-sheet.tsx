/**
 * <ImportResumeSheet> — start a résumé from a PDF the person already has.
 *
 * The backend has extracted PDFs into a résumé for a long time; nothing in
 * the app ever offered it, so the first thing a new user could do was retype
 * a CV they already had. This is that door.
 *
 * LinkedIn is deliberately absent: `/v1/resumes/imports/linkedin` answers 503
 * by design until the LinkedIn client lands, and an option that always fails
 * is worse than no option.
 */

import { getV1ResumesQueryKey } from "@patch-careers/api-client";
import { Sheet, Text, useToast, YStack } from "@patch-careers/ui";
import {
  editorialFonts as fonts,
  PrimaryAction,
  useEditorialPalette,
} from "@patch-careers/ui/editorial";
import { useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { type ReactElement, useState } from "react";
import { useI18n } from "@/providers/i18n-provider";
import { uploadResumePdf } from "../lib/upload-resume-pdf";

export function ImportResumeSheet({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  /** Called with the new résumé's id so the caller can navigate to it. */
  onImported: (resumeId: string) => void;
}): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const pickAndImport = async (): Promise<void> => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
      multiple: false,
    });
    const asset = picked.canceled ? null : picked.assets[0];
    if (!asset) return;

    setBusy(true);
    try {
      const { resumeId } = await uploadResumePdf({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? "application/pdf",
      });
      await queryClient.invalidateQueries({ queryKey: getV1ResumesQueryKey() });
      toast.show({ title: t("resumes.import.done"), intent: "success" });
      onClose();
      onImported(resumeId);
    } catch {
      // The most common cause by far is a scanned PDF with no text layer,
      // which the backend rejects explicitly. Say that, not "error".
      toast.show({ title: t("resumes.import.failed"), intent: "danger" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t("resumes.import.title")}
    >
      <YStack gap={16} paddingBottom={8}>
        <Text fontFamily={fonts.sans} fontSize={13} lineHeight={19} color={palette.body}>
          {t("resumes.import.intro")}
        </Text>
        <Text fontFamily={fonts.sans} fontSize={12} lineHeight={17} color={palette.muted}>
          {t("resumes.import.caveat")}
        </Text>
        <PrimaryAction
          label={t("resumes.import.pick")}
          loading={busy}
          onPress={() => void pickAndImport()}
        />
      </YStack>
    </Sheet>
  );
}
