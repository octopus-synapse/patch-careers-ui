/**
 * Section field controls — a dependency-free month/year date picker, option
 * pills, textarea, the username-availability chip, and the default underline
 * input. Extracted verbatim from `OnboardingWizard.tsx` so the wizard and the
 * Profile tab render the same field UX. Location/phone live in the wizard's own
 * `StepForm` (no section item uses those keys), so this stays dependency-light.
 */
import { getV1UsersUsernameCheck } from "@patch-careers/api-client";
import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import {
  FieldError,
  UnderlineInput,
  useEditorialPalette,
  useThemeName,
} from "@patch-careers/ui/editorial";
import { Calendar } from "lucide-react-native";
import { type ReactElement, type Ref, useCallback, useEffect, useState } from "react";
import { Pressable, type ReturnKeyTypeOptions, Text, TextInput, View } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { monthLabel, parseYearMonth } from "../lib/helpers";
import { useEd } from "../lib/styles";
import type { SectionField } from "../types";
import { CompanyPicker, type PickedCompany } from "./company-picker";
import { CoursePicker, type PickedCourse } from "./course-picker";
import { InstitutionPicker } from "./institution-picker";
import { MonthYearPicker } from "./month-year-picker";
import { FieldLabel, FieldShell, OptionPill } from "./primitives";
import { RolePicker } from "./role-picker";

function DateField({
  allowEmpty,
  clearLabel,
  emptyLabel,
  error,
  futureYears,
  label,
  onChange,
  value,
}: {
  allowEmpty: boolean;
  clearLabel: string;
  emptyLabel?: string | undefined;
  error?: string | undefined;
  /** How many years past the current one the picker can navigate to. */
  futureYears: number;
  label: string;
  onChange: (value: string) => void;
  value: string;
}): ReactElement {
  const ed = useEd();
  const authTokens = useEditorialPalette();
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const parsed = parseYearMonth(value);
  const display = parsed
    ? monthLabel(parsed.year, parsed.month, locale, { month: "short", year: "numeric" })
    : (emptyLabel ?? t("onboarding.date.placeholder"));
  return (
    <>
      <FieldShell label={label} error={error}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${display}`}
          onPress={() => setOpen(true)}
          style={ed.dateField}
        >
          <Text style={[ed.dateValue, parsed ? null : ed.datePlaceholder]}>{display}</Text>
          <Calendar size={18} color={authTokens.subtle} />
        </Pressable>
      </FieldShell>
      <MonthYearPicker
        visible={open}
        value={value}
        title={label}
        allowEmpty={allowEmpty}
        clearLabel={clearLabel}
        futureYears={futureYears}
        onClose={() => setOpen(false)}
        onChange={(next) => {
          onChange(next);
          setOpen(false);
        }}
      />
    </>
  );
}

/** Per-state visuals for the username availability chip (dot + text + label). */
const usernameStateMetaFor = (
  authTokens: EditorialPalette,
): Record<
  "checking" | "available" | "unavailable" | "error",
  { dot: string; color: string; labelKey: string }
> => ({
  checking: {
    dot: authTokens.subtle,
    color: authTokens.muted,
    labelKey: "onboarding.username.checking",
  },
  available: {
    dot: authTokens.success,
    color: authTokens.success,
    labelKey: "onboarding.username.available",
  },
  unavailable: {
    dot: authTokens.danger,
    color: authTokens.danger,
    labelKey: "onboarding.username.taken",
  },
  error: { dot: authTokens.warn, color: authTokens.warn, labelKey: "onboarding.username.error" },
});

// Precomputed per theme so the meta object identity is stable across renders.
const usernameStateMetaByTheme = {
  light: usernameStateMetaFor(editorialPalette),
  dark: usernameStateMetaFor(editorialPaletteDark),
} as const;

export function FieldRenderer({
  autoFocus,
  error,
  field,
  inputRef,
  institutionName,
  lockHint,
  lockedOption,
  onChange,
  onCompanyPick,
  onCoursePick,
  onRolePick,
  onSubmitEditing,
  returnKeyType,
  value,
}: {
  /** Focus this field's text input on mount (text/textarea fields only). */
  autoFocus?: boolean | undefined;
  error?: string;
  field: SectionField;
  /** Ref to the underlying text input (text/textarea fields only) — lets the
   *  host chain keyboard focus across fields. */
  inputRef?: Ref<TextInput> | undefined;
  /** Sibling `institution` value — present only in sections that have one. */
  institutionName?: string | undefined;
  /** When set on an options field, only `lockedOption` is selectable (others
   *  render disabled) and `lockHint` explains why. */
  lockHint?: string | undefined;
  lockedOption?: string | undefined;
  onChange: (value: string) => void;
  /** Forwarded to the company picker so the editor can sync `companyDomain`. */
  onCompanyPick?: ((company: PickedCompany | null) => void) | undefined;
  /** Forwarded to the course picker so the editor can derive degree fields. */
  onCoursePick?: ((course: PickedCourse | null) => void) | undefined;
  /** Forwarded to the role picker so the editor can sync `roleSeniority`. */
  onRolePick?: ((seniority: string | null) => void) | undefined;
  /** Keyboard-submit handler (single-line text fields only). */
  onSubmitEditing?: (() => void) | undefined;
  returnKeyType?: ReturnKeyTypeOptions | undefined;
  value: string;
}): ReactElement {
  const ed = useEd();
  const authTokens = useEditorialPalette();
  const usernameStateMeta = usernameStateMetaByTheme[useThemeName()];
  const { t } = useI18n();
  const [focused, setFocused] = useState(false);
  const [usernameState, setUsernameState] = useState<
    "idle" | "checking" | "available" | "unavailable" | "error"
  >("idle");
  const examples = field.examples ?? [];
  const placeholder = examples[0] ?? "";
  const multiline = field.type === "textarea" || field.widget === "textarea";
  const hasOptions = field.type === "select" || Boolean(field.options?.length);
  const isUsername = field.key === "username";
  // The backend still ships start/end dates as plain text; treat anything that
  // looks like a date (type/widget "date", or a `*Date` key) as a month picker.
  const isDate = field.type === "date" || field.widget === "date" || /[a-z]Date$/.test(field.key);
  // Education is the only section with an `institution` field — back it with
  // the MEC catalog search (free text still allowed inside the picker).
  const isInstitution = field.key === "institution";
  // Work experience's company is backed by the logo.dev brand search (free
  // text still allowed inside the picker).
  const isCompany = field.key === "company";
  // Work experience's role is backed by the ESCO/CBO/O*NET job-title
  // dictionary (free text still allowed inside the picker).
  const isRole = field.key === "role";
  // Field of study suggests the selected institution's MEC courses; the
  // sibling value only arrives in sections that have an institution field,
  // so it doubles as the gate (other sections' `field` keys stay plain text).
  const isCourse = field.key === "field" && institutionName !== undefined;

  // Surface the failure (item: username checker fallback) so the user can retry
  // instead of the chip silently disappearing. Stable so it can be reused by the
  // debounced effect and the manual retry.
  const checkUsername = useCallback((username: string) => {
    void getV1UsersUsernameCheck({ username })
      .then((result) => setUsernameState(result.available ? "available" : "unavailable"))
      .catch(() => setUsernameState("error"));
  }, []);

  useEffect(() => {
    if (!isUsername) return;
    const username = value.trim();
    if (username.length < 3) {
      setUsernameState("idle");
      return;
    }
    setUsernameState("checking");
    const timer = setTimeout(() => checkUsername(username), 450);
    return () => clearTimeout(timer);
  }, [isUsername, value, checkUsername]);

  const retryUsername = () => {
    const username = value.trim();
    if (username.length < 3) return;
    setUsernameState("checking");
    checkUsername(username);
  };

  if (isInstitution) {
    return (
      <InstitutionPicker label={field.label} value={value} onChange={onChange} error={error} />
    );
  }

  if (isCompany) {
    return (
      <CompanyPicker
        label={field.label}
        value={value}
        onChange={onChange}
        onPickCompany={onCompanyPick}
        error={error}
      />
    );
  }

  if (isRole) {
    return (
      <RolePicker
        label={field.label}
        value={value}
        onChange={onChange}
        onPickSeniority={onRolePick}
        error={error}
      />
    );
  }

  if (isCourse) {
    return (
      <CoursePicker
        label={field.label}
        value={value}
        onChange={onChange}
        onPickCourse={onCoursePick}
        error={error}
        institutionName={institutionName ?? ""}
      />
    );
  }

  if (isDate) {
    return (
      <DateField
        label={field.label}
        value={value}
        onChange={onChange}
        error={error}
        // An empty end date means "present"; start dates are required.
        allowEmpty={field.key === "endDate" || !field.required}
        emptyLabel={field.key === "endDate" ? t("onboarding.date.present") : undefined}
        clearLabel={t(
          field.key === "endDate" ? "onboarding.date.present" : "onboarding.date.clear",
        )}
        // Preserve projected graduation dates; starts and other past events stop today.
        futureYears={field.key === "endDate" ? 8 : 0}
      />
    );
  }

  if (hasOptions) {
    const locked = lockedOption !== undefined;
    return (
      <View>
        <FieldLabel error={Boolean(error)}>{field.label}</FieldLabel>
        <View style={ed.pillWrap}>
          {(field.options ?? []).map((option) => (
            <OptionPill
              key={option.value}
              label={option.label}
              selected={locked ? option.value === lockedOption : option.value === value}
              disabled={locked && option.value !== lockedOption}
              onPress={() => onChange(option.value)}
            />
          ))}
        </View>
        {locked && lockHint ? <Text style={ed.lockHint}>{lockHint}</Text> : null}
        {error ? <FieldError text={error} /> : null}
      </View>
    );
  }

  if (multiline) {
    return (
      <FieldShell label={field.label} error={error} focused={focused}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={authTokens.subtle}
          multiline
          {...(autoFocus ? { autoFocus } : {})}
          style={ed.textarea}
        />
      </FieldShell>
    );
  }

  return (
    <View>
      <UnderlineInput
        ref={inputRef}
        label={field.label}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        hasError={Boolean(error)}
        {...(autoFocus ? { autoFocus } : {})}
        {...(returnKeyType ? { returnKeyType } : {})}
        {...(onSubmitEditing ? { onSubmitEditing, blurOnSubmit: returnKeyType !== "next" } : {})}
        keyboardType={
          field.type === "email" ? "email-address" : field.type === "url" ? "url" : "default"
        }
        autoCapitalize={
          isUsername || field.type === "email" || field.type === "url" ? "none" : "sentences"
        }
        autoCorrect={field.type !== "url" && field.type !== "email" && !isUsername}
        {...(isUsername
          ? { autoComplete: "username" as const, textContentType: "username" as const }
          : {})}
      />
      {isUsername && usernameState !== "idle" ? (
        <Pressable
          style={ed.chip}
          disabled={usernameState !== "error"}
          onPress={retryUsername}
          accessibilityRole={usernameState === "error" ? "button" : "text"}
        >
          <View style={[ed.chipDot, { backgroundColor: usernameStateMeta[usernameState].dot }]} />
          <Text style={[ed.chipText, { color: usernameStateMeta[usernameState].color }]}>
            {t(usernameStateMeta[usernameState].labelKey)}
          </Text>
        </Pressable>
      ) : null}
      {error ? <FieldError text={error} /> : null}
    </View>
  );
}
