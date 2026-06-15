/**
 * RHF form + derive/cascade behavior for ONE section item, extracted from
 * `SectionItemEditor` so the resume section manager (tap-to-edit modal, add
 * flow) and the legacy editor share it verbatim:
 *
 *   - education: degree/degreeType derive from the picked MEC course (`grau`),
 *     a new institution invalidates everything downstream, and the course's
 *     workload suggests an end date (never over a manually typed one);
 *   - work experience: the hidden `companyDomain` follows the company picker —
 *     a catalog pick sets it, a typed/edited company clears it; the hidden
 *     `roleSeniority` follows the role picker, and an INTERN pick auto-locks
 *     `employmentType` to Internship (cleared again on a manual role edit).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { fieldErrorsResolver } from "@/forms";
import { useI18n } from "@/providers/i18n-provider";
import type { PickedCompany } from "../components/company-picker";
import type { PickedCourse } from "../components/course-picker";
import { degreeTypeFromGrau, suggestEndDateFromWorkload } from "../lib/helpers";
import { validateSectionFields } from "../lib/validation";
import type { FormData, SectionField } from "../types";

const EMPTY_KEY_SET: ReadonlySet<string> = new Set();

export type SectionItemFormApi = {
  form: UseFormReturn<FormData>;
  /** Fields currently derived from a picker (render read-only). */
  derivedKeys: ReadonlySet<string>;
  hasCompany: boolean;
  isEducation: boolean;
  handleCompanyPick: (company: PickedCompany | null) => void;
  handleCoursePick: (course: PickedCourse | null) => void;
  /** Records the picked role's seniority; INTERN locks employmentType. */
  handleRolePick: (seniority: string | null) => void;
  /** Reset for a blank item. */
  resetForNew: () => void;
  /** Reset prefilled with a saved item's content (fully editable). */
  resetForExisting: (content: Record<string, unknown>) => void;
  hasErrors: boolean;
};

export function useSectionItemForm(fields: SectionField[]): SectionItemFormApi {
  const { t } = useI18n();
  const form = useForm<FormData>({
    defaultValues: {},
    resolver: fieldErrorsResolver<FormData>((values) => validateSectionFields(fields, values, t)),
  });

  const isEducation =
    fields.some((field) => field.key === "institution") &&
    fields.some((field) => field.key === "field");
  const hasCompany = fields.some((field) => field.key === "company");
  // `role`/`roleSeniority`/`employmentType` are work-experience-only; the
  // hidden roleSeniority isn't in `fields`, so gate on the visible `role`.
  const hasRole = fields.some((field) => field.key === "role");

  const lastCompany = useRef("");
  const lastRole = useRef("");
  const [derivedKeys, setDerivedKeys] = useState<ReadonlySet<string>>(EMPTY_KEY_SET);
  const lastInstitution = useRef("");
  const pickedWorkload = useRef<number | null>(null);
  const lastSuggestedEnd = useRef("");

  // Validate only when a value goes IN — clearing a downstream field must not
  // surface its "required" error while the user hasn't reached it yet.
  const setCascadeValue = useCallback(
    (key: string, value: string): void => {
      form.setValue(key, value, { shouldDirty: true, shouldValidate: value.length > 0 });
      if (value.length === 0) form.clearErrors(key);
    },
    [form],
  );

  // Fill `endDate` with the expected graduation derived from the course's
  // workload — only once a start date exists, and only over an empty field or
  // our own previous suggestion (never over a manually entered date).
  const suggestEndDate = useCallback((): void => {
    const startDate = String(form.getValues("startDate") ?? "");
    const suggestion = suggestEndDateFromWorkload(startDate, pickedWorkload.current);
    if (!suggestion) return;
    const currentEnd = String(form.getValues("endDate") ?? "");
    if (currentEnd.length > 0 && currentEnd !== lastSuggestedEnd.current) return;
    lastSuggestedEnd.current = suggestion;
    setCascadeValue("endDate", suggestion);
  }, [form, setCascadeValue]);

  const handleCompanyPick = (company: PickedCompany | null): void => {
    lastCompany.current = String(form.getValues("company") ?? "");
    setCascadeValue("companyDomain", company?.domain ?? "");
  };

  useEffect(() => {
    if (!hasCompany) return;
    const subscription = form.watch((values, { name }) => {
      if (name !== "company") return;
      const next = String(values.company ?? "");
      if (next === lastCompany.current) return;
      lastCompany.current = next;
      setCascadeValue("companyDomain", "");
    });
    return () => subscription.unsubscribe();
  }, [hasCompany, form, setCascadeValue]);

  // Role picker → seniority. An INTERN title pins employmentType to
  // Internship (the UI locks the other options); leaving an internship role
  // releases that pinned value so the user can pick again.
  const handleRolePick = (seniority: string | null): void => {
    lastRole.current = String(form.getValues("role") ?? "");
    const level = seniority ?? "";
    const wasIntern = String(form.getValues("roleSeniority") ?? "") === "INTERN";
    setCascadeValue("roleSeniority", level);
    // Canonical JobType value (matches the seed enum + backend invariant).
    if (level === "INTERN") setCascadeValue("employmentType", "INTERNSHIP");
    else if (wasIntern) setCascadeValue("employmentType", "");
  };

  // A manual role edit invalidates the picked seniority (it belonged to the
  // previous title) and, if that was an internship, releases the lock.
  useEffect(() => {
    if (!hasRole) return;
    const subscription = form.watch((values, { name }) => {
      if (name !== "role") return;
      const next = String(values.role ?? "");
      if (next === lastRole.current) return;
      lastRole.current = next;
      const wasIntern = String(values.roleSeniority ?? "") === "INTERN";
      setCascadeValue("roleSeniority", "");
      if (wasIntern) setCascadeValue("employmentType", "");
    });
    return () => subscription.unsubscribe();
  }, [hasRole, form, setCascadeValue]);

  const handleCoursePick = (course: PickedCourse | null): void => {
    const grau = course?.grau ?? null;
    setCascadeValue("degree", grau ?? "");
    setCascadeValue("degreeType", degreeTypeFromGrau(grau) ?? "");
    setDerivedKeys(grau ? new Set(["degree", "degreeType"]) : EMPTY_KEY_SET);
    pickedWorkload.current = course?.cargaHoraria ?? null;
    suggestEndDate();
  };

  useEffect(() => {
    if (!isEducation) return;
    const subscription = form.watch((values, { name }) => {
      if (name === "startDate") {
        suggestEndDate();
        return;
      }
      if (name !== "institution") return;
      const next = String(values.institution ?? "");
      if (next === lastInstitution.current) return;
      lastInstitution.current = next;
      setCascadeValue("field", "");
      setCascadeValue("degree", "");
      setCascadeValue("degreeType", "");
      setDerivedKeys(EMPTY_KEY_SET);
      pickedWorkload.current = null;
    });
    return () => subscription.unsubscribe();
  }, [isEducation, form, setCascadeValue, suggestEndDate]);

  const resetRefs = (institution: string, company: string, role: string): void => {
    lastInstitution.current = institution;
    lastCompany.current = company;
    lastRole.current = role;
    pickedWorkload.current = null;
    lastSuggestedEnd.current = "";
    setDerivedKeys(EMPTY_KEY_SET);
  };

  const resetForNew = (): void => {
    form.reset({});
    resetRefs("", "", "");
  };

  const resetForExisting = (content: Record<string, unknown>): void => {
    form.reset(
      Object.fromEntries(Object.entries(content).map(([key, value]) => [key, String(value ?? "")])),
    );
    // Saved entries open fully editable: we can't tell whether their degree
    // was MEC-derived, so nothing is marked read-only. Seed the refs with the
    // saved values so reopening doesn't clear saved cascades.
    resetRefs(
      String(content.institution ?? ""),
      String(content.company ?? ""),
      String(content.role ?? ""),
    );
  };

  const hasErrors = Object.keys(validateSectionFields(fields, form.watch(), t)).length > 0;

  return {
    form,
    derivedKeys,
    hasCompany,
    isEducation,
    handleCompanyPick,
    handleCoursePick,
    handleRolePick,
    resetForNew,
    resetForExisting,
    hasErrors,
  };
}
