/**
 * `<LocationPicker>` — País/Estado/Cidade as a modal selection (NOT a free
 * text field). The trigger is the shared `<CatalogPickerTrigger>` (same
 * chrome at rest as the education pickers); tapping it opens the "Prosa"
 * `<LocationPickerSheet>` backed by the geo endpoint. The value can only be
 * set by picking a predefined result — selecting one also surfaces its
 * `countryCode` so the caller can default the phone country.
 */

import { useGetV1GeoLocations } from "@patch-careers/api-client";
import { CatalogPickerTrigger, LocationPickerSheet } from "@patch-careers/ui";
import { useEffect, useState } from "react";
import { Platform, View } from "react-native";
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
}

const MIN_QUERY = 2;
const DEBOUNCE_MS = 250;
const LIMIT = 25;

export function LocationPicker({
  label,
  value,
  onChange,
  placeholder,
  error,
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

  const rowKey = (item: (typeof items)[number]) =>
    `${item.label}-${item.countryCode}-${item.stateCode ?? ""}`;

  return (
    <View>
      <CatalogPickerTrigger
        label={label}
        value={value}
        error={error}
        placeholder={placeholder ?? t("onboarding.location.placeholder")}
        onPress={openModal}
      />

      <LocationPickerSheet
        open={open}
        onOpenChange={setOpen}
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
          onChange(item.label, { countryCode: item.countryCode });
          setOpen(false);
        }}
      />
    </View>
  );
}
