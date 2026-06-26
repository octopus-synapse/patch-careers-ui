/**
 * Ordered add-link flow (used inside AddSectionFlowModal when "Links" is
 * picked): 1) choose the kind (LinkedIn / GitHub / Website / Portfolio / Other),
 * 2) enter the URL, 3) for a CUSTOM link, a label pre-filled from the domain
 * (medium.com → "Medium") that the user can override, then save. Known kinds
 * skip the label — the card derives it from the kind.
 */
import { Input } from "@patch-careers/ui";
import { PrimaryAction, useEditorialPalette } from "@patch-careers/ui/editorial";
import { ChevronRight } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { domainToTitle, extractDomain } from "../lib/link-title";
import { type LinkKind, LinkLeading } from "../lib/link-visual";
import { useEd } from "../lib/styles";
import type { SectionItem } from "../types";
import { FieldLabel } from "./primitives";

const KINDS: readonly LinkKind[] = ["LINKEDIN", "GITHUB", "WEBSITE", "PORTFOLIO", "CUSTOM"];

export function AddLinkForm({
  isPending,
  onSave,
  t,
}: {
  isPending: boolean;
  onSave: (item: SectionItem) => Promise<void>;
  t: (key: string) => string;
}): ReactElement {
  const ed = useEd();
  const palette = useEditorialPalette();
  const [kind, setKind] = useState<LinkKind | null>(null);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [labelTouched, setLabelTouched] = useState(false);

  // Auto-suggest the label from the URL's domain until the user edits it.
  const suggestedLabel = domainToTitle(extractDomain(url)) ?? "";
  const effectiveLabel = labelTouched ? label : suggestedLabel;
  const canSave = url.trim().length > 0 && !isPending;

  const save = async (): Promise<void> => {
    if (!kind || !canSave) return;
    const trimmedUrl = url.trim();
    const domain = extractDomain(trimmedUrl) ?? null;
    const content: Record<string, unknown> = { kind, url: trimmedUrl, domain };
    if (kind === "CUSTOM" && effectiveLabel.trim()) content.label = effectiveLabel.trim();
    await onSave({ content });
  };

  if (!kind) {
    return (
      <ScrollView style={ed.flex} contentContainerStyle={ed.editorModalScroll}>
        {KINDS.map((k) => (
          <Pressable
            key={k}
            accessibilityRole="button"
            accessibilityLabel={t(`sections.links.kinds.${k}`)}
            onPress={() => setKind(k)}
            style={({ pressed }) => [styles.kindRow, pressed && styles.kindRowPressed]}
          >
            <View style={styles.kindLeading}>
              <LinkLeading kind={k} color={palette.muted} />
            </View>
            <Text style={[ed.cardPrimary, styles.kindLabel]}>{t(`sections.links.kinds.${k}`)}</Text>
            <ChevronRight size={18} color={palette.subtle} strokeWidth={1.75} />
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  return (
    <>
      <ScrollView
        style={ed.flex}
        contentContainerStyle={ed.editorModalScroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <FieldLabel>{t("sections.links.urlLabel")}</FieldLabel>
          <Input
            value={url}
            onChangeText={setUrl}
            placeholder={t("sections.links.urlPlaceholder")}
            placeholderTextColor={palette.subtle}
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
            keyboardType="url"
            color={palette.ink}
            fontSize={16}
          />
        </View>

        {kind === "CUSTOM" ? (
          <View style={styles.field}>
            <FieldLabel>{t("sections.links.labelLabel")}</FieldLabel>
            <Input
              value={effectiveLabel}
              onChangeText={(v: string) => {
                setLabelTouched(true);
                setLabel(v);
              }}
              placeholder={t("sections.links.labelPlaceholder")}
              placeholderTextColor={palette.subtle}
              color={palette.ink}
              fontSize={16}
            />
          </View>
        ) : null}
      </ScrollView>
      <View style={ed.editorModalFooter}>
        <View />
        <PrimaryAction label={t("common.save")} onPress={() => void save()} disabled={!canSave} />
      </View>
    </>
  );
}

const styles = {
  kindRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingVertical: 14,
  },
  kindRowPressed: { opacity: 0.6 },
  kindLeading: { width: 22, alignItems: "center" as const },
  kindLabel: { flex: 1 },
  field: { gap: 8 },
};
