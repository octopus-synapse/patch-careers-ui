/**
 * <LocationEditModal> — tapping the "Localização" row opens the geo search
 * modal DIRECTLY (no intermediate sheet): the same "Prosa"
 * `<LocationPickerSheet>` as onboarding, backed by GET /v1/geo/locations.
 * Picking a result saves it via PATCH /v1/users/profile and closes. Value
 * can only be a picked (geo-valid) location — never free text.
 */
import { useGetV1GeoLocations } from "@patch-careers/api-client";
import { LocationPickerSheet } from "@patch-careers/ui";
import { type ReactElement, useEffect, useState } from "react";
import { Platform } from "react-native";
import { useI18n } from "@/providers/i18n-provider";

const MIN_QUERY = 2;
const DEBOUNCE_MS = 250;
const LIMIT = 25;

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

  const rowKey = (item: (typeof items)[number]) =>
    `${item.label}-${item.countryCode}-${item.stateCode ?? ""}`;

  return (
    <LocationPickerSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      titleHead={t("onboarding.location.titleHead")}
      titleTail={t("onboarding.location.titleTail")}
      searchPlaceholder={t("onboarding.location.searchPlaceholder")}
      searchText={text}
      onSearchTextChange={setText}
      clearLabel={t("onboarding.location.clear")}
      kbdHint={Platform.OS === "web" ? t("onboarding.location.kbdHint") : undefined}
      idleHint={t("onboarding.location.idleHint")}
      searchingLabel={t("onboarding.location.hintSearching")}
      emptyTitle={t("onboarding.location.emptyTitle")}
      emptyHint={t("onboarding.location.emptyHint")}
      searching={isFetching}
      minQueryLength={MIN_QUERY}
      items={items.map((item) => ({
        key: rowKey(item),
        label: item.label,
        countryCode: item.countryCode,
      }))}
      onSelectItem={(picked) => {
        const item = items.find((candidate) => rowKey(candidate) === picked.key);
        if (!item) return;
        void onSave(item.label).then(onClose);
      }}
    />
  );
}
