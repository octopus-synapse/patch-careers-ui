/**
 * `<LocationPicker>` — País/Estado/Cidade as a modal selection (NOT a free
 * text field), rendered through the shared `<CatalogPickerField>` shell
 * (same chrome as the education institution/course pickers). The trigger
 * shows the chosen location; tapping it opens the shared `<Sheet>` with a
 * search box backed by the geo endpoint. The value can only be set by
 * picking a predefined result (no "use as typed" row) — selecting one also
 * surfaces its `countryCode` so the caller can default the phone country.
 */

import { useGetV1GeoLocations } from "@patch-careers/api-client";
import { CatalogPickerField } from "@patch-careers/ui";
import { useEffect, useState } from "react";
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

  const hint =
    query.length < MIN_QUERY
      ? t("onboarding.location.hintMinChars")
      : isFetching && items.length === 0
        ? t("onboarding.location.hintSearching")
        : items.length === 0
          ? t("onboarding.location.hintEmpty", { q: query })
          : null;

  const rowKey = (item: (typeof items)[number]) =>
    `${item.label}-${item.countryCode}-${item.stateCode ?? ""}`;

  return (
    <CatalogPickerField
      label={label}
      value={value}
      error={error}
      placeholder={placeholder ?? t("onboarding.location.placeholder")}
      sheetTitle={title ?? t("onboarding.location.title")}
      searchPlaceholder={searchPlaceholder ?? t("onboarding.location.searchPlaceholder")}
      open={open}
      onOpenChange={setOpen}
      onTriggerPress={openModal}
      searchText={text}
      onSearchTextChange={setText}
      hint={hint}
      rows={items.map((item) => ({
        key: rowKey(item),
        title: item.label,
        leading: flagFromIso(item.countryCode),
      }))}
      onSelectRow={(row) => {
        const picked = items.find((item) => rowKey(item) === row.key);
        if (!picked) return;
        onChange(picked.label, { countryCode: picked.countryCode });
        setOpen(false);
      }}
    />
  );
}
