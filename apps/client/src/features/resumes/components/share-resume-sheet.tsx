/**
 * <ShareResumeSheet> — share a resume as its exported PDF. Lazily fetches the
 * (short-lived, presigned) PDF download URL when opened, shows a QR code of it
 * plus a native Share action. There is no public resume link by design, so the
 * shared artifact is the PDF URL itself.
 */
import { useGetV1ExportResumePdf } from "@patch-careers/api-client";
import { Sheet, Text, YStack } from "@patch-careers/ui";
import {
  editorialFonts as fonts,
  PrimaryAction,
  useEditorialPalette,
} from "@patch-careers/ui/editorial";
import { type ReactElement, useEffect, useState } from "react";
import { ActivityIndicator, Share } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useI18n } from "@/providers/i18n-provider";

export function ShareResumeSheet({
  open,
  onClose,
  resumeId,
}: {
  open: boolean;
  onClose: () => void;
  resumeId?: string | undefined;
}): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const params = resumeId ? { resumeId } : undefined;
  const pdf = useGetV1ExportResumePdf(params, { query: { enabled: false } });
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const { refetch } = pdf;

  useEffect(() => {
    if (!open) {
      setUrl(null);
      setError(false);
      return;
    }
    let cancelled = false;
    refetch()
      .then((r) => {
        if (cancelled) return;
        const next = r.data?.downloadUrl ?? null;
        if (next) setUrl(next);
        else setError(true);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, refetch]);

  const onShare = async (): Promise<void> => {
    if (!url) return;
    await Share.share({ message: url, url });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t("resumes.share.title")}
    >
      <YStack gap={18} alignItems="center" paddingBottom={8}>
        {error ? (
          <Text
            fontFamily={fonts.sans}
            fontSize={13}
            lineHeight={18}
            textAlign="center"
            color={palette.danger}
          >
            {t("resumes.share.error")}
          </Text>
        ) : url ? (
          <>
            <YStack padding={16} borderWidth={1} borderRadius={16} borderColor={palette.hairline}>
              <QRCode value={url} size={188} backgroundColor="transparent" color={palette.ink} />
            </YStack>
            <Text
              fontFamily={fonts.sans}
              fontSize={13}
              lineHeight={18}
              textAlign="center"
              color={palette.muted}
            >
              {t("resumes.share.hint")}
            </Text>
            <PrimaryAction label={t("resumes.share.shareLink")} onPress={() => void onShare()} />
          </>
        ) : (
          <YStack gap={12} alignItems="center" paddingVertical={24}>
            <ActivityIndicator color={palette.ink} />
            <Text
              fontFamily={fonts.sans}
              fontSize={13}
              lineHeight={18}
              textAlign="center"
              color={palette.muted}
            >
              {t("resumes.share.generating")}
            </Text>
          </YStack>
        )}
      </YStack>
    </Sheet>
  );
}
