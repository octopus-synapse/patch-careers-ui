/**
 * `<CatalogPickerField>` — the shared visual shell for catalog-backed picker
 * fields (location, institution, course): an editorial trigger row (value or
 * placeholder + chevron over a hairline) that opens a `<CatalogPickerSheet>`.
 *
 * `<CatalogPickerSheet>` is the sheet half on its own — search box, hint
 * line, result rows (optional leading emoji + title + mono meta + selected
 * check) and an optional "use as typed" escape row — for pickers that bring
 * their own trigger (e.g. `<PhoneInput>`'s country box).
 *
 * Purely presentational — the pickers own their state and data fetching and
 * hand rows/hints down, so all of them render pixel-identical chrome by
 * construction.
 */

import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import { Check, ChevronDown, PenLine } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { EditorialLabel } from "../editorial/editorial-label";
import { FieldError } from "../editorial/field-error";
import { editorialFonts } from "../editorial/fonts";
import { useEditorialPalette } from "../internal/use-editorial-palette";
import { useThemeName } from "../internal/use-theme-name";
import { Input } from "../primitives/input";
import { Sheet } from "./sheet";

export interface CatalogRow {
  key: string;
  title: string;
  /** Mono caption under the title (e.g. "São Caetano do Sul · SP"). */
  meta?: string | undefined;
  /** Leading emoji slot (e.g. a country flag). */
  leading?: string | undefined;
  /** Remote image (e.g. a company logo). Wins over `leading`; falls back to
   *  a monogram chip when absent or the image fails to load. */
  leadingImageUri?: string | undefined;
  /** Renders a trailing check (e.g. the currently selected country). */
  selected?: boolean | undefined;
}

/** Logo chip on a surface pill (transparent logos stay visible on dark
 *  paper), degrading to the title's initial when there's no loadable image. */
function RowLeadingImage({
  uri,
  title,
  styles,
}: {
  uri: string | undefined;
  title: string;
  styles: (typeof stylesByTheme)[keyof typeof stylesByTheme];
}): ReactElement {
  const [errored, setErrored] = useState(false);
  const showImage = Boolean(uri) && !errored;
  return (
    <View style={styles.leadingImage}>
      {showImage ? (
        <Image
          source={{ uri: uri ?? "" }}
          style={styles.leadingImageInner}
          onError={() => setErrored(true)}
        />
      ) : (
        <Text style={styles.leadingMonogram}>{title.trim().charAt(0).toUpperCase()}</Text>
      )}
    </View>
  );
}

export interface CatalogPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  searchPlaceholder: string;
  searchText: string;
  onSearchTextChange: (text: string) => void;
  hint?: string | null | undefined;
  rows: CatalogRow[];
  onSelectRow: (row: CatalogRow) => void;
  /** When non-null, renders the free-text row with this label. */
  useTypedLabel?: string | null | undefined;
  onUseTyped?: (() => void) | undefined;
  /** Muted caption pinned under the list (e.g. a data-source attribution). */
  footer?: string | null | undefined;
}

export function CatalogPickerSheet({
  open,
  onOpenChange,
  title,
  searchPlaceholder,
  searchText,
  onSearchTextChange,
  hint,
  rows,
  onSelectRow,
  useTypedLabel,
  onUseTyped,
  footer,
}: CatalogPickerSheetProps): ReactElement {
  const styles = stylesByTheme[useThemeName()];
  const palette = useEditorialPalette();

  return (
    // Card presentation on every platform, filling the safe-area height so the
    // picker matches the section editor modal (tall + stable) instead of a low
    // bottom sheet or a card that collapses to the search box before results.
    <Sheet open={open} onOpenChange={onOpenChange} title={title} presentation="card" fillHeight>
      <View style={styles.body}>
        <Input
          value={searchText}
          onChangeText={onSearchTextChange}
          placeholder={searchPlaceholder}
          autoFocus
          autoCorrect={false}
        />

        {hint ? <Text style={styles.hint}>{hint}</Text> : null}

        <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll}>
          {rows.map((row) => (
            <Pressable
              key={row.key}
              accessibilityRole="button"
              accessibilityState={{ selected: Boolean(row.selected) }}
              onPress={() => onSelectRow(row)}
              style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
            >
              {row.leadingImageUri !== undefined ? (
                <RowLeadingImage uri={row.leadingImageUri} title={row.title} styles={styles} />
              ) : row.leading ? (
                <Text style={styles.leading}>{row.leading}</Text>
              ) : null}
              <View style={styles.rowBody}>
                <Text numberOfLines={1} style={styles.rowText}>
                  {row.title}
                </Text>
                {row.meta ? (
                  <Text numberOfLines={1} style={styles.rowMeta}>
                    {row.meta}
                  </Text>
                ) : null}
              </View>
              {row.selected ? <Check size={16} color={palette.ink} /> : null}
            </Pressable>
          ))}

          {useTypedLabel && onUseTyped ? (
            <Pressable
              accessibilityRole="button"
              onPress={onUseTyped}
              style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
            >
              <PenLine size={16} color={palette.muted} />
              <Text numberOfLines={1} style={styles.rowFreeText}>
                {useTypedLabel}
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>

        {footer ? <Text style={styles.footer}>{footer}</Text> : null}
      </View>
    </Sheet>
  );
}

export interface CatalogPickerFieldProps {
  label: string;
  value: string;
  error?: string | undefined;
  placeholder: string;
  sheetTitle: string;
  searchPlaceholder: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTriggerPress: () => void;
  searchText: string;
  onSearchTextChange: (text: string) => void;
  hint?: string | null | undefined;
  rows: CatalogRow[];
  onSelectRow: (row: CatalogRow) => void;
  /** When non-null, renders the free-text row with this label. */
  useTypedLabel?: string | null | undefined;
  onUseTyped?: (() => void) | undefined;
  /** Muted caption pinned under the list (e.g. a data-source attribution). */
  footer?: string | null | undefined;
}

export function CatalogPickerField({
  label,
  value,
  error,
  placeholder,
  sheetTitle,
  searchPlaceholder,
  open,
  onOpenChange,
  onTriggerPress,
  searchText,
  onSearchTextChange,
  hint,
  rows,
  onSelectRow,
  useTypedLabel,
  onUseTyped,
  footer,
}: CatalogPickerFieldProps): ReactElement {
  const styles = stylesByTheme[useThemeName()];
  const palette = useEditorialPalette();
  const hasError = Boolean(error);

  return (
    <View>
      <EditorialLabel error={hasError}>{label}</EditorialLabel>

      <Pressable accessibilityRole="button" onPress={onTriggerPress} style={styles.trigger}>
        <Text
          numberOfLines={1}
          style={[styles.triggerText, value ? styles.valueText : styles.placeholderText]}
        >
          {value || placeholder}
        </Text>
        <ChevronDown size={18} color={palette.subtle} />
      </Pressable>
      <View style={[styles.hairline, hasError ? styles.hairlineError : null]} />

      {error ? <FieldError text={error} /> : null}

      <CatalogPickerSheet
        open={open}
        onOpenChange={onOpenChange}
        title={sheetTitle}
        searchPlaceholder={searchPlaceholder}
        searchText={searchText}
        onSearchTextChange={onSearchTextChange}
        hint={hint}
        rows={rows}
        onSelectRow={onSelectRow}
        useTypedLabel={useTypedLabel}
        onUseTyped={onUseTyped}
        footer={footer}
      />
    </View>
  );
}

const stylesFor = (p: EditorialPalette) =>
  StyleSheet.create({
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
    valueText: { color: p.ink },
    placeholderText: { color: p.subtle },
    hairline: { height: 1, width: "100%", backgroundColor: p.hairline },
    hairlineError: { backgroundColor: p.danger },

    body: { flex: 1, minHeight: 0, gap: 12 },
    hint: {
      fontFamily: editorialFonts.mono,
      fontSize: 12,
      color: p.muted,
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
    rowPressed: { backgroundColor: p.surface },
    leading: { fontSize: 20 },
    leadingImage: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: p.surface,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    leadingImageInner: { width: 28, height: 28 },
    leadingMonogram: { fontFamily: editorialFonts.mono, fontSize: 13, color: p.muted },
    footer: {
      fontFamily: editorialFonts.mono,
      fontSize: 10,
      color: p.subtle,
      paddingTop: 8,
      textAlign: "center",
    },
    rowBody: { flex: 1, gap: 2 },
    rowText: { fontFamily: editorialFonts.sans, fontSize: 16, color: p.ink },
    rowMeta: { fontFamily: editorialFonts.mono, fontSize: 11, color: p.muted },
    rowFreeText: { flex: 1, fontFamily: editorialFonts.sans, fontSize: 15, color: p.muted },
  });

const stylesByTheme = {
  light: stylesFor(editorialPalette),
  dark: stylesFor(editorialPaletteDark),
} as const;
