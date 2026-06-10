/**
 * `<CoursePicker>` — education's field-of-study control backed by the MEC
 * course catalog, rendered through the shared `<CatalogPickerField>` shell
 * (same chrome as `<InstitutionPicker>`).
 *
 * The twist: suggestions are scoped to the selected institution. The
 * education entry stores `institution` as a plain name string (no FK), so the
 * picker resolves it back to a MEC `codigoIes` via the institution search and
 * then lists THAT institution's courses — picking USCS won't suggest "Física"
 * because USCS doesn't offer it. When the institution isn't in the MEC
 * catalog (high schools, bootcamps, foreign universities) it falls back to
 * the global course search, and the typed text can always be used as-is.
 */

import {
  useGetV1MecCoursesSearch,
  useGetV1MecInstitutionsCodigoIesCourses,
  useGetV1MecInstitutionsSearch,
} from "@patch-careers/api-client";
import { CatalogPickerField } from "@patch-careers/ui";
import { useEffect, useState } from "react";
import { useI18n } from "@/providers/i18n-provider";

export interface PickedCourse {
  nome: string;
  grau: string | null;
  /** MEC total workload in hours — feeds the end-date suggestion. */
  cargaHoraria: number | null;
}

export interface CoursePickerProps {
  label: string;
  value: string;
  onChange: (name: string) => void;
  /**
   * Fired alongside `onChange`: the MEC course (carrying `grau`) when picked
   * from the catalog, or `null` when the typed text was used as-is — lets the
   * editor derive degree/degreeType.
   */
  onPickCourse?: ((course: PickedCourse | null) => void) | undefined;
  error?: string | undefined;
  /** Current value of the sibling `institution` field (may be free text). */
  institutionName: string;
}

const MIN_QUERY = 3;
const DEBOUNCE_MS = 250;
const LIMIT = 20;

/** Accent/case folding so "fisica" matches "Física" (mirror of the backend). */
function fold(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

interface CourseRow {
  key: string;
  nome: string;
  grau: string | null;
  cargaHoraria: number | null;
}

/**
 * MEC repeats a course per modalidade — collapse to one row per name + grau.
 * Grau stays distinct (Ciências Biológicas Bacharelado ≠ Licenciatura) so a
 * pick carries a definite grau for the degree auto-fill.
 */
function dedupeCourses(
  courses: Array<{ nome: string; grau: string | null; cargaHoraria: number | null }>,
): CourseRow[] {
  const byKey = new Map<string, CourseRow>();
  for (const course of courses) {
    const key = `${fold(course.nome)}|${course.grau ?? ""}`;
    if (!byKey.has(key))
      byKey.set(key, {
        key,
        nome: course.nome,
        grau: course.grau,
        cargaHoraria: course.cargaHoraria,
      });
  }
  return [...byKey.values()].sort(
    (a, b) => a.nome.localeCompare(b.nome) || (a.grau ?? "").localeCompare(b.grau ?? ""),
  );
}

export function CoursePicker({
  label,
  value,
  onChange,
  onPickCourse,
  error,
  institutionName,
}: CoursePickerProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setQuery(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [text]);

  // Resolve the institution name back to its MEC code (exact folded match —
  // names picked through <InstitutionPicker> round-trip verbatim).
  const institutionQuery = institutionName.trim();
  const institutionSearch = useGetV1MecInstitutionsSearch(
    { q: institutionQuery, limit: 5 },
    { query: { enabled: open && institutionQuery.length >= MIN_QUERY, staleTime: 600_000 } },
  );
  const codigoIes = (institutionSearch.data?.institutions ?? []).find(
    (i) => fold(i.nome) === fold(institutionQuery),
  )?.codigoIes;
  const resolving = institutionSearch.isLoading && institutionSearch.fetchStatus !== "idle";

  // Scoped mode: the institution's own catalog, filtered locally (a single
  // institution has at most a few dozen course names).
  const scoped = useGetV1MecInstitutionsCodigoIesCourses(String(codigoIes ?? ""), {
    query: { enabled: open && codigoIes !== undefined, staleTime: 600_000 },
  });
  // Fallback mode: global MEC course search for non-catalog institutions.
  // Held back while the institution lookup is in flight so the panel doesn't
  // flash global results before scoping kicks in.
  const global = useGetV1MecCoursesSearch(
    { q: query, limit: LIMIT },
    {
      query: {
        enabled: open && !resolving && codigoIes === undefined && query.length >= MIN_QUERY,
        staleTime: 10_000,
      },
    },
  );

  const isScoped = codigoIes !== undefined;
  const courses: CourseRow[] = isScoped
    ? dedupeCourses(scoped.data?.courses ?? []).filter(
        (course) => query.length === 0 || fold(course.nome).includes(fold(query)),
      )
    : query.length >= MIN_QUERY
      ? dedupeCourses(global.data?.courses ?? [])
      : [];
  const searching = resolving || (isScoped ? scoped.isFetching : global.isFetching);

  const openModal = () => {
    setText(value);
    setQuery(value.trim());
    setOpen(true);
  };

  const select = (name: string, course: PickedCourse | null) => {
    onChange(name);
    onPickCourse?.(course);
    setOpen(false);
  };

  const typed = text.trim();
  const showUseTyped =
    typed.length > 0 && !courses.some((course) => fold(course.nome) === fold(typed));

  const hint =
    searching && courses.length === 0
      ? t("onboarding.course.hintSearching")
      : !isScoped && query.length < MIN_QUERY
        ? t("onboarding.course.hintMinChars")
        : courses.length === 0 && query.length > 0
          ? t("onboarding.course.hintEmpty", { q: query })
          : isScoped
            ? t("onboarding.course.hintInstitution", { institution: institutionQuery })
            : null;

  return (
    <CatalogPickerField
      label={label}
      value={value}
      error={error}
      placeholder={t("onboarding.course.placeholder")}
      sheetTitle={t("onboarding.course.title")}
      searchPlaceholder={t("onboarding.course.searchPlaceholder")}
      open={open}
      onOpenChange={setOpen}
      onTriggerPress={openModal}
      searchText={text}
      onSearchTextChange={setText}
      hint={hint}
      rows={courses.map((course) => ({
        key: course.key,
        title: course.nome,
        meta: course.grau ?? "",
      }))}
      onSelectRow={(row) => {
        const picked = courses.find((course) => course.key === row.key);
        if (picked)
          select(picked.nome, {
            nome: picked.nome,
            grau: picked.grau,
            cargaHoraria: picked.cargaHoraria,
          });
      }}
      useTypedLabel={showUseTyped ? t("onboarding.course.useTyped", { q: typed }) : null}
      onUseTyped={() => select(typed, null)}
    />
  );
}
