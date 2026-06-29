/**
 * ResumePreview — the user's master resume as a realtime, high-fidelity HTML
 * render that mirrors the Typst PDF (`GET /v1/export/resume/preview`), plus a
 * "Baixar PDF" action. Rendered by the Profile tab's CV modal.
 *
 * The backend returns a self-contained HTML document: embedded via `srcDoc` on
 * web and `WebView source.html` on native (same split as `legal-webview.tsx`).
 * Download — web: prints the embedded document (browser "Save as PDF"); native:
 * opens the canonical Typst PDF (`GET /v1/export/resume/pdf`) in the browser.
 */
import { Ionicons } from "@expo/vector-icons";
import { useGetV1ExportResumePdf, useGetV1ExportResumePreview } from "@patch-careers/api-client";
import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import { Button, Text } from "@patch-careers/ui";
import { useEditorialPalette, useThemeName } from "@patch-careers/ui/editorial";
import * as WebBrowser from "expo-web-browser";
import { type ReactElement, type ReactNode, useRef } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from "react-native";
import WebView from "react-native-webview";
import { useI18n } from "@/providers/i18n-provider";

// Light: matches the HTML document's body backdrop so the safe-area inset
// blends in. Dark: the document stays a white "page", so the container frames
// it like a PDF viewer instead of mirroring it.
// @style-allow color: PDF-viewer backdrop (intentional neutral, not a surface token)
const BACKDROP = { light: "#e5e7eb", dark: "#111110" } as const;

// The host <iframe> is a web DOM element (rendered via react-dom), not a Tamagui
// node, so its layout stays a plain style object rather than style props.
// @style-allow inline: web <iframe> host element cannot take Tamagui props
const IFRAME_STYLE = {
  flex: 1,
  border: "none",
  width: "100%",
  height: "100%",
} as unknown as undefined;

export function ResumePreview({ resumeId }: { resumeId?: string | undefined }): ReactElement {
  const { t } = useI18n();
  const editorialPalette = useEditorialPalette();
  const styles = stylesByTheme[useThemeName()];
  // Omitted resumeId = the master resume (backend default).
  const params = resumeId ? { resumeId } : undefined;
  const preview = useGetV1ExportResumePreview(params, {
    query: { refetchOnWindowFocus: false },
  });
  // Lazy: only fetched (native) when the user taps "Baixar PDF".
  const pdf = useGetV1ExportResumePdf(params, { query: { enabled: false } });
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const onDownload = async (): Promise<void> => {
    if (Platform.OS === "web") {
      iframeRef.current?.contentWindow?.print();
      return;
    }
    const result = await pdf.refetch();
    const url = result.data?.downloadUrl;
    if (url) await WebBrowser.openBrowserAsync(url);
  };

  if (preview.isLoading) {
    return (
      <Centered>
        <ActivityIndicator color={editorialPalette.ink} />
        <Text preset="body" color="$inkMuted">
          {t("resumes.preview.rendering")}
        </Text>
      </Centered>
    );
  }

  if (preview.isError || !preview.data?.html) {
    return (
      <Centered>
        <Ionicons name="document-text-outline" size={40} color={editorialPalette.subtle} />
        <Text preset="h3" color="$ink" textAlign="center">
          {t("resumes.preview.errorTitle")}
        </Text>
        <Text preset="body" color="$inkMuted" textAlign="center">
          {t("resumes.preview.errorHint")}
        </Text>
        <Button intent="accent" onPress={() => void preview.refetch()}>
          {t("resumes.preview.retry")}
        </Button>
      </Centered>
    );
  }

  const html = preview.data.html;

  return (
    <View style={styles.root}>
      <View style={styles.toolbar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("resumes.preview.downloadPdf")}
          onPress={() => void onDownload()}
          style={styles.download}
          hitSlop={8}
        >
          <Ionicons name="download-outline" size={18} color={editorialPalette.accent} />
          <Text preset="label" color="$accentBlue">
            {t("resumes.preview.downloadPdf")}
          </Text>
        </Pressable>
      </View>

      {Platform.OS === "web" ? (
        // RNW renders the host <iframe> through react-dom; `srcDoc` embeds the
        // document inline so there's no cross-origin / presigned-URL hop.
        <iframe
          ref={iframeRef}
          srcDoc={html}
          title={t("resumes.preview.title")}
          style={IFRAME_STYLE}
        />
      ) : (
        <WebView
          originWhitelist={["*"]}
          source={{ html }}
          style={styles.flex}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={editorialPalette.ink} />
            </View>
          )}
        />
      )}
    </View>
  );
}

function Centered({ children }: { children: ReactNode }): ReactElement {
  const styles = stylesByTheme[useThemeName()];
  return <View style={styles.centered}>{children}</View>;
}

const stylesFor = (p: EditorialPalette, backdrop: string) =>
  // @style-allow stylesheet: themed style factory (palette + theme-specific backdrop) consumed by native WebView / web iframe / Pressable hosts that cannot take Tamagui props
  StyleSheet.create({
    root: { flex: 1, backgroundColor: backdrop },
    flex: { flex: 1, backgroundColor: backdrop },
    toolbar: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: p.surface,
      borderBottomWidth: 1,
      borderBottomColor: p.hairline,
    },
    download: { flexDirection: "row", alignItems: "center", gap: 6 },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      padding: 24,
      backgroundColor: p.bg,
    },
    loadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: backdrop,
    },
  });

// Precomputed per theme so style-object identity is stable across renders.
const stylesByTheme = {
  light: stylesFor(editorialPalette, BACKDROP.light),
  dark: stylesFor(editorialPaletteDark, BACKDROP.dark),
} as const;
