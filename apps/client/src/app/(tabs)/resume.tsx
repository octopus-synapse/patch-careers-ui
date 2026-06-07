/**
 * Resume tab — shows the user's master resume as a realtime, high-fidelity
 * HTML render that mirrors the Typst PDF (`GET /v1/export/resume/preview`).
 *
 * No Typst, no MinIO, no presigned URL for the view: the backend returns a
 * self-contained HTML document which we embed via `srcDoc` on web and
 * `WebView source.html` on native (same split as `legal-webview.tsx`).
 *
 * "Baixar PDF":
 *   - web: prints the embedded document (browser "Save as PDF") — faithful
 *     to what's on screen, no server round-trip.
 *   - native: opens the canonical Typst PDF (`GET /v1/export/resume/pdf`)
 *     in the system browser (needs the MinIO public host configured).
 */

import { Ionicons } from "@expo/vector-icons";
import { useGetV1ExportResumePdf, useGetV1ExportResumePreview } from "@patch-careers/api-client";
import { editorialPalette } from "@patch-careers/tokens";
import { Button, Text } from "@patch-careers/ui";
import * as WebBrowser from "expo-web-browser";
import { type ReactElement, type ReactNode, useRef } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from "react-native";
import WebView from "react-native-webview";

// Matches the HTML document's body backdrop so the safe-area inset blends in.
const BACKDROP = "#e5e7eb";

export default function ResumeScreen(): ReactElement {
  const preview = useGetV1ExportResumePreview(undefined, {
    query: { refetchOnWindowFocus: false },
  });
  // Lazy: only fetched (native) when the user taps "Baixar PDF".
  const pdf = useGetV1ExportResumePdf(undefined, { query: { enabled: false } });
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
          Renderizando seu currículo…
        </Text>
      </Centered>
    );
  }

  if (preview.isError || !preview.data?.html) {
    return (
      <Centered>
        <Ionicons name="document-text-outline" size={40} color={editorialPalette.subtle} />
        <Text preset="h3" color="$ink" textAlign="center">
          Não foi possível carregar seu currículo
        </Text>
        <Text preset="body" color="$inkMuted" textAlign="center">
          Confirme que você concluiu o onboarding e tente novamente.
        </Text>
        <Button intent="accent" onPress={() => void preview.refetch()}>
          Tentar novamente
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
          accessibilityLabel="Baixar PDF"
          onPress={() => void onDownload()}
          style={styles.download}
          hitSlop={8}
        >
          <Ionicons name="download-outline" size={18} color={editorialPalette.accent} />
          <Text preset="label" color="$accentBlue">
            Baixar PDF
          </Text>
        </Pressable>
      </View>

      {Platform.OS === "web" ? (
        // RNW renders the host <iframe> through react-dom; `srcDoc` embeds the
        // document inline so there's no cross-origin / presigned-URL hop.
        <iframe
          ref={iframeRef}
          srcDoc={html}
          title="Currículo"
          style={{ flex: 1, border: "none", width: "100%", height: "100%" } as unknown as undefined}
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
  return <View style={styles.centered}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BACKDROP },
  flex: { flex: 1, backgroundColor: BACKDROP },
  toolbar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: editorialPalette.surface,
    borderBottomWidth: 1,
    borderBottomColor: editorialPalette.hairline,
  },
  download: { flexDirection: "row", alignItems: "center", gap: 6 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
    backgroundColor: editorialPalette.bg,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BACKDROP,
  },
});
