/**
 * <ResumeThumbnail> — a small, non-interactive preview of a resume's realtime
 * HTML (GET /v1/export/resume/preview), clipped to a card so it reads as a
 * recognizable thumbnail (the top of the page). The WebView/iframe is
 * pointer-events:none, so taps fall through to the parent card. Loading shows a
 * spinner; error/empty shows a document glyph. Omitted resumeId = master.
 */
import { useGetV1ExportResumePreview } from "@patch-careers/api-client";
import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import { useThemeName } from "@patch-careers/ui/editorial";
import { FileText } from "lucide-react-native";
import type { ReactElement } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import WebView from "react-native-webview";
import { useI18n } from "@/providers/i18n-provider";

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
  const styles = stylesByTheme[theme];
  const palette = theme === "dark" ? editorialPaletteDark : editorialPalette;
  const preview = useGetV1ExportResumePreview(resumeId ? { resumeId } : undefined, {
    query: { refetchOnWindowFocus: false },
  });
  const box = { width, height, borderRadius: radius };

  if (preview.isLoading) {
    return (
      <View style={[styles.box, box, styles.center]}>
        <ActivityIndicator size="small" color={palette.subtle} />
      </View>
    );
  }
  if (preview.isError || !preview.data?.html) {
    return (
      <View style={[styles.box, box, styles.center]}>
        <FileText size={20} color={palette.subtle} strokeWidth={1.5} />
      </View>
    );
  }

  const html = preview.data.html;
  return (
    <View style={[styles.box, box]} pointerEvents="none">
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
    </View>
  );
}

const stylesFor = (p: EditorialPalette) =>
  StyleSheet.create({
    box: {
      overflow: "hidden",
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: p.hairline,
    },
    center: { alignItems: "center", justifyContent: "center", backgroundColor: p.surface },
  });

const stylesByTheme = {
  light: stylesFor(editorialPalette),
  dark: stylesFor(editorialPaletteDark),
} as const;
