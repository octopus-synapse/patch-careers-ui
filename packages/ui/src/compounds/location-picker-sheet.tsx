/**
 * `<LocationPickerSheet>` — the "Prosa" location modal: a serif question
 * heading with the brand-indigo italic tail (same gesture as the step
 * titles), an underline-only search field, and a FIXED-height result box so
 * the card never jumps between its states (idle hint → searching → grouped
 * results → no matches). Results group by country under mono small-caps
 * labels, each row leading with its country's flag emoji.
 *
 * Purely presentational, like `<CatalogPickerSheet>`: consumers own the geo
 * fetch/debounce and hand items + translated strings down. Items arrive as
 * flat `"City[, Region], Country"` labels (the geo endpoint's shape) and the
 * sheet does the grouping/meta split, so both consumers render identically
 * by construction.
 */

import {
  type EditorialPalette,
  editorialOverlays,
  editorialPalette,
  editorialPaletteDark,
  landingAccentPalettes,
} from "@patch-careers/tokens";
import { MapPin, X } from "lucide-react-native";
import { type ReactElement, useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextStyle,
  View,
} from "react-native";
import { editorialFonts } from "../editorial/fonts";
import { useEditorialPalette } from "../internal/use-editorial-palette";
import { useThemeName } from "../internal/use-theme-name";
import { Sheet } from "./sheet";

export interface LocationSheetItem {
  key: string;
  /** `"City[, Region], Country"` — the geo endpoint's display label. */
  label: string;
  /** ISO-3166 alpha-2; renders the country's flag emoji on the row. */
  countryCode?: string | undefined;
}

/** Flag emoji from an ISO-3166 alpha-2 code (two regional-indicator chars). */
function flagFromIso(iso: string | undefined): string {
  if (!iso || iso.length !== 2) return "";
  return iso
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .replace(/./g, (c) => String.fromCodePoint(0x1f1e6 + (c.charCodeAt(0) - 65)));
}

export interface LocationPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Serif question; the tail renders italic in the brand indigo. */
  titleHead: string;
  titleTail: string;
  searchPlaceholder: string;
  searchText: string;
  onSearchTextChange: (text: string) => void;
  clearLabel: string;
  /** Mono footer hint (e.g. "enter seleciona · esc fecha"); omit to hide. */
  kbdHint?: string | undefined;
  /** Centered hint shown before the query is long enough to search. */
  idleHint: string;
  searchingLabel: string;
  emptyTitle: string;
  emptyHint: string;
  /** True while the query is in flight and there is nothing to show yet. */
  searching: boolean;
  /** Queries shorter than this show the idle state (endpoint minimum). */
  minQueryLength?: number;
  items: LocationSheetItem[];
  onSelectItem: (item: LocationSheetItem) => void;
  closeLabel?: string | undefined;
}

interface ParsedRow {
  item: LocationSheetItem;
  /** Flat index across every group, for keyboard navigation. */
  index: number;
  city: string;
  /** Middle segments (state/region); empty when the label is City, Country. */
  meta: string;
}

/** Accent-insensitive lowercase, one char per input char (é → e). */
function fold(text: string): string {
  return Array.from(text)
    .map((c) => {
      const base = c.normalize("NFD").replace(/[̀-ͯ]/g, "");
      return (base || c).toLowerCase();
    })
    .join("");
}

/** Split `city` around the first accent-insensitive match of `query`. */
function splitMatch(city: string, query: string): [string, string, string] {
  const q = fold(query.trim());
  if (!q) return [city, "", ""];
  const start = fold(city).indexOf(q);
  if (start < 0) return [city, "", ""];
  const chars = Array.from(city);
  return [
    chars.slice(0, start).join(""),
    chars.slice(start, start + q.length).join(""),
    chars.slice(start + q.length).join(""),
  ];
}

/** Group items by their label's last segment (the country), keeping order. */
function groupByCountry(items: LocationSheetItem[]): Array<[string, ParsedRow[]]> {
  const groups = new Map<string, ParsedRow[]>();
  items.forEach((item, index) => {
    const segments = item.label.split(", ");
    const country = segments.length > 1 ? (segments.at(-1) ?? "") : "";
    const city = segments[0] ?? item.label;
    const meta = segments.slice(1, -1).join(", ");
    const rows = groups.get(country) ?? [];
    rows.push({ item, index, city, meta });
    groups.set(country, rows);
  });
  return [...groups.entries()];
}

export function LocationPickerSheet({
  open,
  onOpenChange,
  titleHead,
  titleTail,
  searchPlaceholder,
  searchText,
  onSearchTextChange,
  clearLabel,
  kbdHint,
  idleHint,
  searchingLabel,
  emptyTitle,
  emptyHint,
  searching,
  minQueryLength = 2,
  items,
  onSelectItem,
  closeLabel,
}: LocationPickerSheetProps): ReactElement {
  const styles = stylesByTheme[useThemeName()];
  const palette = useEditorialPalette();
  const [active, setActive] = useState(0);

  // A new result set restarts keyboard navigation at the top.
  // biome-ignore lint/correctness/useExhaustiveDependencies: items identity is the reset signal
  useEffect(() => setActive(0), [items]);

  const query = searchText.trim();
  const state =
    query.length < minQueryLength
      ? "idle"
      : items.length > 0
        ? "results"
        : searching
          ? "searching"
          : "empty";
  const groups = state === "results" ? groupByCountry(items) : [];

  const move = (delta: number): void => {
    if (items.length === 0) return;
    setActive((current) => Math.min(Math.max(current + delta, 0), items.length - 1));
  };
  const commit = (): void => {
    const picked = items[Math.min(active, items.length - 1)];
    if (picked) onSelectItem(picked);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      presentation="card"
      webMaxWidth={520}
      {...(closeLabel ? { closeLabel } : {})}
    >
      <View style={styles.wrap}>
        <View style={styles.headingRow}>
          <Text style={styles.heading}>
            {titleHead} <Text style={styles.headingTail}>{titleTail}</Text>?
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={closeLabel ?? "Fechar"}
            hitSlop={12}
            onPress={() => onOpenChange(false)}
          >
            <X size={22} color={palette.muted} />
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            value={searchText}
            onChangeText={onSearchTextChange}
            placeholder={searchPlaceholder}
            placeholderTextColor={palette.subtle}
            autoFocus
            autoCorrect={false}
            style={styles.searchInput}
            onSubmitEditing={commit}
            // Arrow keys only exist on web; react-native-web delivers them
            // through onKeyPress, native never fires these key names.
            onKeyPress={(e) => {
              const key = e.nativeEvent.key;
              if (key === "ArrowDown") move(1);
              else if (key === "ArrowUp") move(-1);
            }}
          />
          {query ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => onSearchTextChange("")}
            >
              <Text style={styles.clear}>{clearLabel}</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.searchLine} />

        {/* One fixed height for every state — the card never jumps. */}
        <View style={styles.resultBox}>
          {state === "idle" ? (
            <View style={styles.centerState}>
              <MapPin size={26} color={palette.hairlineStrong} strokeWidth={1.5} />
              <Text style={styles.idleHint}>{idleHint}</Text>
            </View>
          ) : state === "searching" ? (
            <View style={styles.centerState}>
              <Text style={styles.searchingLabel}>{searchingLabel}</Text>
            </View>
          ) : state === "empty" ? (
            <View style={styles.centerState}>
              <Text style={styles.emptyTitle}>{emptyTitle}</Text>
              <Text style={styles.emptyHint}>{emptyHint}</Text>
            </View>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll}>
              {groups.map(([country, rows]) => (
                <View key={country || "?"}>
                  {country ? <Text style={styles.groupLabel}>{country}</Text> : null}
                  {rows.map((row) => {
                    const [before, match, after] = splitMatch(row.city, query);
                    const flag = flagFromIso(row.item.countryCode);
                    return (
                      <Pressable
                        key={row.item.key}
                        accessibilityRole="button"
                        onPress={() => onSelectItem(row.item)}
                        onHoverIn={() => setActive(row.index)}
                        style={({ pressed }) => [
                          styles.row,
                          pressed || row.index === active ? styles.rowActive : null,
                        ]}
                      >
                        {flag ? <Text style={styles.rowFlag}>{flag}</Text> : null}
                        <Text numberOfLines={1} style={styles.rowTitle}>
                          {before}
                          {match ? <Text style={styles.rowMatch}>{match}</Text> : null}
                          {after}
                        </Text>
                        {row.meta ? (
                          <Text numberOfLines={1} style={styles.rowMeta}>
                            {row.meta}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {kbdHint ? (
          <View style={styles.footer}>
            <Text style={styles.kbdHint}>{kbdHint}</Text>
          </View>
        ) : null}
      </View>
    </Sheet>
  );
}

const stylesFor = (p: EditorialPalette, theme: "light" | "dark") => {
  const overlay = editorialOverlays[theme];
  const indigo = landingAccentPalettes[theme].indigo.accent;
  return StyleSheet.create({
    wrap: { paddingHorizontal: 8, paddingTop: 8 },
    // X aligned with the question's first line; `flex-start` keeps it pinned
    // to the top when the heading wraps to two lines.
    headingRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },
    heading: {
      flex: 1,
      fontFamily: editorialFonts.serif,
      fontSize: 27,
      lineHeight: 34,
      color: p.ink,
      letterSpacing: -0.4,
      fontWeight: "400",
    },
    headingTail: { fontStyle: "italic", color: indigo },
    searchRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 20 },
    searchInput: {
      flex: 1,
      fontFamily: editorialFonts.sans,
      fontSize: 16,
      color: p.ink,
      paddingVertical: 8,
      // RN-web draws a UA border + focus ring on <input>; the hairline
      // below is this field's whole chrome.
      borderWidth: 0,
      ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as unknown as TextStyle) : null),
    },
    clear: { fontFamily: editorialFonts.mono, fontSize: 10, color: p.subtle },
    searchLine: { height: 1, width: "100%", backgroundColor: p.hairlineStrong },
    resultBox: { height: 292, marginTop: 10 },
    centerState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
    idleHint: { fontFamily: editorialFonts.sans, fontSize: 13, color: p.subtle },
    searchingLabel: { fontFamily: editorialFonts.mono, fontSize: 12, color: p.muted },
    emptyTitle: { fontFamily: editorialFonts.serif, fontSize: 17, color: p.ink },
    emptyHint: { fontFamily: editorialFonts.sans, fontSize: 13, color: p.muted },
    scroll: { flex: 1 },
    groupLabel: {
      fontFamily: editorialFonts.mono,
      fontSize: 10,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: p.subtle,
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 4,
    },
    row: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    rowActive: { backgroundColor: overlay.rowHover },
    rowFlag: { fontSize: 14, flexShrink: 0 },
    rowTitle: { fontFamily: editorialFonts.sans, fontSize: 15, color: p.ink, flexShrink: 1 },
    rowMatch: { color: indigo, fontWeight: "600" },
    rowMeta: { fontFamily: editorialFonts.sans, fontSize: 12.5, color: p.muted },
    footer: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: p.hairline,
    },
    kbdHint: { fontFamily: editorialFonts.mono, fontSize: 10, color: p.subtle },
  });
};

const stylesByTheme = {
  light: stylesFor(editorialPalette, "light"),
  dark: stylesFor(editorialPaletteDark, "dark"),
} as const;
