/**
 * <ResumeThumbnail> — a small, non-interactive preview of a resume's realtime
 * HTML (GET /v1/export/resume/preview), clipped to a card so it reads as a
 * recognizable thumbnail (the top of the page). The WebView/iframe is
 * pointer-events:none, so taps fall through to the parent card. Loading shows a
 * spinner; error/empty shows a document glyph. Omitted resumeId = master.
 */
import { useGetV1ExportResumePreview } from "@patch-careers/api-client";
import { editorialPalette, editorialPaletteDark } from "@patch-careers/tokens";
import { YStack } from "@patch-careers/ui";
import { useThemeName } from "@patch-careers/ui/editorial";
import { FileText } from "lucide-react-native";
import type { ReactElement } from "react";
import { ActivityIndicator, Platform } from "react-native";
import WebView from "react-native-webview";
import { useI18n } from "@/providers/i18n-provider";

// The resume render is a page on white paper — fixed regardless of theme.
// @style-allow color: resume paper is always white, independent of theme
const PAPER_WHITE = "#FFFFFF";

export function ResumeThumbnail({
  resumeId,
  width,
  height,
  radius = 10,
}: {
  resumeId?: string | undefined;
  width: number;
  height: number;
  radius?: number;
}): ReactElement {
  const { t } = useI18n();
  const theme = useThemeName();
  const palette = theme === "dark" ? editorialPaletteDark : editorialPalette;
  const preview = useGetV1ExportResumePreview(resumeId ? { resumeId } : undefined, {
    query: { refetchOnWindowFocus: false },
  });

  if (preview.isLoading) {
    return (
      <YStack
        width={width}
        height={height}
        borderRadius={radius}
        overflow="hidden"
        borderWidth={1}
        borderColor={palette.hairline}
        backgroundColor={palette.surface}
        alignItems="center"
        justifyContent="center"
      >
        <ActivityIndicator size="small" color={palette.subtle} />
      </YStack>
    );
  }
  if (preview.isError || !preview.data?.html) {
    return (
      <YStack
        width={width}
        height={height}
        borderRadius={radius}
        overflow="hidden"
        borderWidth={1}
        borderColor={palette.hairline}
        backgroundColor={palette.surface}
        alignItems="center"
        justifyContent="center"
      >
        <FileText size={20} color={palette.subtle} strokeWidth={1.5} />
      </YStack>
    );
  }

  const html = preview.data.html;
  return (
    <YStack
      width={width}
      height={height}
      borderRadius={radius}
      overflow="hidden"
      borderWidth={1}
      borderColor={palette.hairline}
      backgroundColor={PAPER_WHITE}
      pointerEvents="none"
    >
      {Platform.OS === "web" ? (
        <iframe
          srcDoc={html}
          scrolling="no"
          title={t("resumes.preview.title")}
          style={
            {
              width: "100%",
              height: "100%",
              border: "none",
              pointerEvents: "none",
            } as unknown as undefined
          }
        />
      ) : (
        <WebView
          originWhitelist={["*"]}
          source={{ html }}
          style={{ width, height, backgroundColor: "transparent" }}
          scrollEnabled={false}
          scalesPageToFit
        />
      )}
    </YStack>
  );
}
