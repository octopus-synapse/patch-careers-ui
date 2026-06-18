/**
 * <LocationEditModal> — tapping the "Localização" row opens the geo search
 * modal DIRECTLY (no intermediate sheet): the same CatalogPickerSheet chrome as
 * onboarding, backed by GET /v1/geo/locations. Picking a result saves it via
 * PATCH /v1/users/profile and closes. Value can only be a picked (geo-valid)
 * location — never free text.
 */
import { useGetV1GeoLocations } from "@patch-careers/api-client";
import { CatalogPickerSheet } from "@patch-careers/ui";
import { type ReactElement, useEffect, useState } from "react";
import { useI18n } from "@/providers/i18n-provider";

const MIN_QUERY = 2;
const DEBOUNCE_MS = 250;
const LIMIT = 25;

/** Flag emoji from an ISO-3166 alpha-2 code (two regional-indicator chars). */
function flagFromIso(iso: string | undefined): string {
  if (iso?.length !== 2) return "";
  return iso
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .replace(/./g, (c) => String.fromCodePoint(0x1f1e6 + (c.charCodeAt(0) - 65)));
}

export function LocationEditModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (label: string) => Promise<void>;
}): ReactElement {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");

  // Reset the search each time the modal opens.
  useEffect(() => {
    if (open) {
      setText("");
      setQuery("");
    }
  }, [open]);

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
    <CatalogPickerSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t("onboarding.location.title")}
      searchPlaceholder={t("onboarding.location.searchPlaceholder")}
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
        void onSave(picked.label).then(onClose);
      }}
    />
  );
}
