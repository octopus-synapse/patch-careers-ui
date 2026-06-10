/**
 * `<InstitutionPicker>` — education's institution field backed by the MEC
 * catalog (Brazilian higher-ed institutions synced from the official CSV).
 * Renders through the shared `<CatalogPickerField>` shell (same chrome as
 * `<CoursePicker>`): a trigger row opens the shared `<Sheet>` with a
 * debounced search. Unlike location, the value is NOT restricted to catalog
 * hits — degrees from high schools, bootcamps, or foreign universities
 * aren't in MEC, so the typed text can always be used as-is via the last row.
 */

import { useGetV1MecInstitutionsSearch } from "@patch-careers/api-client";
import { CatalogPickerField } from "@patch-careers/ui";
import { useEffect, useState } from "react";
import { useI18n } from "@/providers/i18n-provider";

export interface InstitutionPickerProps {
  label: string;
  value: string;
  onChange: (name: string) => void;
  error?: string | undefined;
}

const MIN_QUERY = 3;
const DEBOUNCE_MS = 250;
const LIMIT = 20;

export function InstitutionPicker({ label, value, onChange, error }: InstitutionPickerProps) {
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
  const { data, isFetching } = useGetV1MecInstitutionsSearch(
    { q: query, limit: LIMIT },
    { query: { enabled } },
  );
  const institutions = enabled ? (data?.institutions ?? []) : [];

  const openModal = () => {
    // Seed the search with the current value so editing an entry starts
    // from what's already saved instead of a blank box.
    setText(value);
    setQuery(value.trim());
    setOpen(true);
  };

  const select = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  const typed = text.trim();
  // Offer the free-text row unless a catalog hit already matches exactly.
  const showUseTyped =
    typed.length > 0 && !institutions.some((i) => i.nome.toLowerCase() === typed.toLowerCase());

  const hint =
    query.length < MIN_QUERY
      ? t("onboarding.institution.hintMinChars")
      : isFetching && institutions.length === 0
        ? t("onboarding.institution.hintSearching")
        : institutions.length === 0
          ? t("onboarding.institution.hintEmpty", { q: query })
          : null;

  return (
    <CatalogPickerField
      label={label}
      value={value}
      error={error}
      placeholder={t("onboarding.institution.placeholder")}
      sheetTitle={t("onboarding.institution.title")}
      searchPlaceholder={t("onboarding.institution.searchPlaceholder")}
      open={open}
      onOpenChange={setOpen}
      onTriggerPress={openModal}
      searchText={text}
      onSearchTextChange={setText}
      hint={hint}
      rows={institutions.map((institution) => ({
        key: institution.id,
        title: `${institution.nome}${institution.sigla ? ` (${institution.sigla})` : ""}`,
        meta: [institution.municipio, institution.uf].filter(Boolean).join(" · "),
      }))}
      onSelectRow={(row) => {
        const picked = institutions.find((institution) => institution.id === row.key);
        if (picked) select(picked.nome);
      }}
      useTypedLabel={showUseTyped ? t("onboarding.institution.useTyped", { q: typed }) : null}
      onUseTyped={() => select(typed)}
    />
  );
}
