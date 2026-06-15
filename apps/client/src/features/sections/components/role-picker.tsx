/**
 * `<RolePicker>` — work experience's role field backed by the backend's
 * job-title dictionary (ESCO / CBO / O*NET). Renders through the shared
 * `<CatalogPickerField>` shell (same chrome as `<CompanyPicker>`). The
 * search prioritizes the user's locale and the backend tops the list up
 * with the other language, so pt-BR users typing English titles still get
 * hits. The value is NOT restricted to catalog hits — niche or brand-new
 * titles won't be in any taxonomy, so the typed text can always be used
 * as-is.
 */

import { useGetV1RolesSearch } from "@patch-careers/api-client";
import { CatalogPickerField } from "@patch-careers/ui";
import { useEffect, useState } from "react";
import { useI18n } from "@/providers/i18n-provider";

export interface RolePickerProps {
  label: string;
  value: string;
  onChange: (label: string) => void;
  /** Fires with the picked title's seniority (null for free text) so the
   *  editor can auto-lock employmentType when it's an internship. */
  onPickSeniority?: ((seniority: string | null) => void) | undefined;
  error?: string | undefined;
}

// Two chars matches the backend's minimum query length.
const MIN_QUERY = 2;
const DEBOUNCE_MS = 250;
const LIMIT = 20;

export function RolePicker({ label, value, onChange, onPickSeniority, error }: RolePickerProps) {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");

  // Debounce the typed text into the query that hits the endpoint.
  useEffect(() => {
    const id = setTimeout(() => setQuery(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [text]);

  const lang = locale === "pt-BR" ? "PT" : "EN";
  const enabled = open && query.length >= MIN_QUERY;
  const { data, isFetching } = useGetV1RolesSearch(
    { q: query, lang, limit: LIMIT },
    { query: { enabled } },
  );
  const roles = enabled ? (data?.items ?? []) : [];

  const openModal = () => {
    // Seed the search with the current value so editing an entry starts
    // from what's already saved instead of a blank box.
    setText(value);
    setQuery(value.trim());
    setOpen(true);
  };

  const select = (roleLabel: string, seniority: string | null) => {
    onChange(roleLabel);
    onPickSeniority?.(seniority);
    setOpen(false);
  };

  const typed = text.trim();
  // Offer the free-text row unless a catalog hit already matches exactly.
  const showUseTyped =
    typed.length > 0 && !roles.some((role) => role.label.toLowerCase() === typed.toLowerCase());

  const hint =
    query.length < MIN_QUERY
      ? t("onboarding.role.hintMinChars")
      : isFetching && roles.length === 0
        ? t("onboarding.role.hintSearching")
        : roles.length === 0
          ? t("onboarding.role.hintEmpty", { q: query })
          : null;

  return (
    <CatalogPickerField
      label={label}
      value={value}
      error={error}
      placeholder={t("onboarding.role.placeholder")}
      sheetTitle={t("onboarding.role.title")}
      searchPlaceholder={t("onboarding.role.searchPlaceholder")}
      open={open}
      onOpenChange={setOpen}
      onTriggerPress={openModal}
      searchText={text}
      onSearchTextChange={setText}
      hint={hint}
      rows={roles.map((role) => ({
        key: `${role.lang}|${role.label}`,
        title: role.label,
        // Tag suggestions topped up from the other language so the mix
        // doesn't read as a glitch.
        meta: role.lang === lang ? undefined : role.lang,
      }))}
      onSelectRow={(row) => {
        const picked = roles.find((role) => `${role.lang}|${role.label}` === row.key);
        if (picked) select(picked.label, picked.seniority ?? null);
      }}
      useTypedLabel={showUseTyped ? t("onboarding.role.useTyped", { q: typed }) : null}
      onUseTyped={() => select(typed, null)}
    />
  );
}
