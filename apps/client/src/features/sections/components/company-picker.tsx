/**
 * `<CompanyPicker>` — work experience's company field backed by the logo.dev
 * brand search (proxied by the backend so the secret key stays server-side).
 * Renders through the shared `<CatalogPickerField>` shell (same chrome as
 * `<InstitutionPicker>`): rows show the company logo, name and domain. The
 * value is NOT restricted to catalog hits — local businesses and freelance
 * clients won't be in logo.dev, so the typed text can always be used as-is.
 */

import { useGetV1CompaniesSearch } from "@patch-careers/api-client";
import { CatalogPickerField } from "@patch-careers/ui";
import { useEffect, useState } from "react";
import { useI18n } from "@/providers/i18n-provider";
import { companyLogoUrl } from "../lib/company-logo";

export interface PickedCompany {
  name: string;
  /** The logo.dev domain the logo derives from; null for typed companies. */
  domain: string | null;
}

export interface CompanyPickerProps {
  label: string;
  value: string;
  onChange: (name: string) => void;
  /**
   * Fired alongside `onChange`: the catalog company (carrying `domain`) when
   * picked, or `null` when the typed text was used as-is — lets the editor
   * keep the hidden `companyDomain` field in sync.
   */
  onPickCompany?: ((company: PickedCompany | null) => void) | undefined;
  error?: string | undefined;
}

// Two chars, not three: short brands (XP, C6, 3M, GE) are real targets.
const MIN_QUERY = 2;
const DEBOUNCE_MS = 250;
const LIMIT = 20;

export function CompanyPicker({
  label,
  value,
  onChange,
  onPickCompany,
  error,
}: CompanyPickerProps) {
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
  const { data, isFetching } = useGetV1CompaniesSearch(
    { q: query, limit: LIMIT },
    { query: { enabled } },
  );
  const companies = enabled ? (data?.companies ?? []) : [];

  const openModal = () => {
    // Seed the search with the current value so editing an entry starts
    // from what's already saved instead of a blank box.
    setText(value);
    setQuery(value.trim());
    setOpen(true);
  };

  const select = (name: string, company: PickedCompany | null) => {
    onChange(name);
    onPickCompany?.(company);
    setOpen(false);
  };

  const typed = text.trim();
  // Offer the free-text row unless a catalog hit already matches exactly.
  const showUseTyped =
    typed.length > 0 && !companies.some((c) => c.name.toLowerCase() === typed.toLowerCase());

  const hint =
    query.length < MIN_QUERY
      ? t("onboarding.company.hintMinChars")
      : isFetching && companies.length === 0
        ? t("onboarding.company.hintSearching")
        : companies.length === 0
          ? t("onboarding.company.hintEmpty", { q: query })
          : null;

  return (
    <CatalogPickerField
      label={label}
      value={value}
      error={error}
      placeholder={t("onboarding.company.placeholder")}
      sheetTitle={t("onboarding.company.title")}
      searchPlaceholder={t("onboarding.company.searchPlaceholder")}
      open={open}
      onOpenChange={setOpen}
      onTriggerPress={openModal}
      searchText={text}
      onSearchTextChange={setText}
      hint={hint}
      rows={companies.map((company) => ({
        key: `${company.domain}|${company.name}`,
        title: company.name,
        meta: company.domain,
        // Empty string (no publishable token) still renders the monogram chip.
        leadingImageUri: companyLogoUrl(company.domain) ?? "",
      }))}
      onSelectRow={(row) => {
        const picked = companies.find((company) => `${company.domain}|${company.name}` === row.key);
        if (picked) select(picked.name, { name: picked.name, domain: picked.domain });
      }}
      useTypedLabel={showUseTyped ? t("onboarding.company.useTyped", { q: typed }) : null}
      onUseTyped={() => select(typed, null)}
      footer={t("onboarding.company.attribution")}
    />
  );
}
