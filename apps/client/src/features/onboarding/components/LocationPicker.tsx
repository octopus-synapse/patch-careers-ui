/**
 * `<LocationPicker>` — País/Estado/Cidade as a modal selection (NOT a free
 * text field). The trigger shows the chosen location; tapping it opens the
 * shared `<Sheet>` (centered card on web, bottom sheet on native) with a
 * search box backed by the geo endpoint. The value can only be set by
 * picking a predefined result — selecting one also surfaces its `countryCode`
 * so the caller can default the phone country.
 */

import { useGetV1GeoLocations } from "@patch-careers/api-client";
import { editorialPalette } from "@patch-careers/tokens";
import { Input, Sheet } from "@patch-careers/ui";
import { EditorialLabel, editorialFonts, FieldError } from "@patch-careers/ui/editorial";
import { ChevronDown } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useI18n } from "@/providers/i18n-provider";

export interface LocationMeta {
  countryCode?: string;
}

export interface LocationPickerProps {
  label: string;
  value: string;
  onChange: (label: string, meta?: LocationMeta) => void;
  placeholder?: string;
  error?: string | undefined;
  /** Modal header title. */
  title?: string;
  /** Search box placeholder. */
  searchPlaceholder?: string;
}

const MIN_QUERY = 2;
const DEBOUNCE_MS = 250;
const LIMIT = 25;

/** Flag emoji from an ISO-3166 alpha-2 code (two regional-indicator chars). */
function flagFromIso(iso: string | undefined): string {
  if (!iso || iso.length !== 2) return "";
  return iso
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .replace(/./g, (c) => String.fromCodePoint(0x1f1e6 + (c.charCodeAt(0) - 65)));
}

export function LocationPicker({
  label,
  value,
  onChange,
  placeholder,
  error,
  title,
  searchPlaceholder,
}: LocationPickerProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const hasError = Boolean(error);

  // Debounce the typed text into the query that hits the endpoint.
  useEffect(() => {
    const id = setTimeout(() => setQuery(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [text]);

  const enabled = open && query.length >= MIN_QUERY;
  const { data, isFetching } = useGetV1GeoLocations(
    { q: query, limit: LIMIT },
    { query: { enabled } },
  );
  const items = data?.items ?? [];

  const openModal = () => {
    setText("");
    setQuery("");
    setOpen(true);
  };

  const select = (itemLabel: string, countryCode: string) => {
    onChange(itemLabel, { countryCode });
    setOpen(false);
  };

  return (
    <View>
      <EditorialLabel error={hasError}>{label}</EditorialLabel>

      <Pressable accessibilityRole="button" onPress={openModal} style={styles.trigger}>
        <Text
          numberOfLines={1}
          style={[styles.triggerText, value ? styles.valueText : styles.placeholderText]}
        >
          {value || placeholder || t("onboarding.location.placeholder")}
        </Text>
        <ChevronDown size={18} color={editorialPalette.subtle} />
      </Pressable>
      <View style={[styles.hairline, hasError ? styles.hairlineError : null]} />

      {error ? <FieldError text={error} /> : null}

      <Sheet open={open} onOpenChange={setOpen} title={title ?? t("onboarding.location.title")}>
        <View style={styles.body}>
          <Input
            value={text}
            onChangeText={setText}
            placeholder={searchPlaceholder ?? t("onboarding.location.searchPlaceholder")}
            autoFocus
            autoCorrect={false}
          />

          {query.length < MIN_QUERY ? (
            <Text style={styles.hint}>{t("onboarding.location.hintMinChars")}</Text>
          ) : isFetching && items.length === 0 ? (
            <Text style={styles.hint}>{t("onboarding.location.hintSearching")}</Text>
          ) : items.length === 0 ? (
            <Text style={styles.hint}>{t("onboarding.location.hintEmpty", { q: query })}</Text>
          ) : null}

          <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll}>
            {items.map((item) => (
              <Pressable
                key={`${item.label}-${item.countryCode}-${item.stateCode ?? ""}`}
                accessibilityRole="button"
                onPress={() => select(item.label, item.countryCode)}
                style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
              >
                <Text style={styles.flag}>{flagFromIso(item.countryCode)}</Text>
                <Text numberOfLines={1} style={styles.rowText}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 40,
    paddingVertical: 8,
    gap: 8,
  },
  triggerText: {
    flex: 1,
    fontFamily: editorialFonts.sans,
    fontSize: 18,
  },
  valueText: { color: editorialPalette.ink },
  placeholderText: { color: editorialPalette.subtle },
  hairline: { height: 1, width: "100%", backgroundColor: editorialPalette.hairline },
  hairlineError: { backgroundColor: editorialPalette.danger },

  body: { flex: 1, minHeight: 0, gap: 12 },
  hint: {
    fontFamily: editorialFonts.mono,
    fontSize: 12,
    color: editorialPalette.muted,
    paddingVertical: 4,
  },
  scroll: { flex: 1, minHeight: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  rowPressed: { backgroundColor: editorialPalette.surface },
  flag: { fontSize: 20 },
  rowText: { flex: 1, fontFamily: editorialFonts.sans, fontSize: 16, color: editorialPalette.ink },
});
