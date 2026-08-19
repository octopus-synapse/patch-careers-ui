/**
 * <ResumePreviewCard> — the desktop rail's document card: the master resume as
 * a tall portrait thumbnail (the mobile layout uses the inline banner inside
 * MasterSectionsTab instead). Tapping opens the full preview modal, same as
 * the banner.
 */
import { Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts as fonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { ChevronRight } from "lucide-react-native";
import { type ReactElement, type ReactNode, useState } from "react";
import { Pressable } from "react-native";
import { ResumeThumbnail } from "@/components/resume-thumbnail";
import { ResumePreviewModal, useMasterResumeId } from "@/features/resumes";
import { useI18n } from "@/providers/i18n-provider";

// Portrait mini-page, roughly A4 — reads as a document, not a crop.
const THUMB_WIDTH = 150;
const THUMB_HEIGHT = 200;

export function ResumePreviewCard(): ReactElement | null {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const { resumeId } = useMasterResumeId();
  const [open, setOpen] = useState(false);
  if (!resumeId) return null;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("profile.master.viewResumeA11y")}
        onPress={() => setOpen(true)}
      >
        {({ pressed }: { pressed: boolean }): ReactNode => (
          <YStack
            borderWidth={1}
            borderColor={palette.hairline}
            backgroundColor={palette.panel}
            borderRadius={18}
            padding={18}
            gap={14}
            opacity={pressed ? 0.85 : 1}
          >
            <XStack alignItems="center" justifyContent="space-between">
              <Text
                fontFamily={fonts.sans}
                fontSize={10}
                fontWeight="600"
                letterSpacing={1.8}
                textTransform="uppercase"
                color={palette.muted}
              >
                {t("profile.master.resumeCardLabel")}
              </Text>
              <ChevronRight size={16} color={palette.subtle} strokeWidth={1.75} />
            </XStack>
            <YStack alignItems="center">
              <ResumeThumbnail
                resumeId={resumeId}
                width={THUMB_WIDTH}
                height={THUMB_HEIGHT}
                radius={12}
              />
            </YStack>
            <Text
              fontFamily={fonts.sans}
              fontSize={12}
              lineHeight={16}
              color={palette.muted}
              textAlign="center"
            >
              {t("profile.master.previewClickHint")}
            </Text>
          </YStack>
        )}
      </Pressable>
      <ResumePreviewModal visible={open} onClose={() => setOpen(false)} resumeId={resumeId} />
    </>
  );
}
