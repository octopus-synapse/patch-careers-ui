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
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react-native";
import { type ReactElement, useCallback, useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { monthLabel, parseYearMonth } from "../lib/helpers";
import { useEd } from "../lib/styles";
import type { SectionField } from "../types";
import { CompanyPicker, type PickedCompany } from "./company-picker";
import { CoursePicker, type PickedCourse } from "./course-picker";
import { InstitutionPicker } from "./institution-picker";
import { FieldLabel, FieldShell, OptionPill, OverlayModal } from "./primitives";

function DateField({
  allowEmpty,
  error,
  futureYears,
  label,
  onChange,
  value,
}: {
  allowEmpty: boolean;
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
    : allowEmpty
      ? t("onboarding.date.present")
      : t("onboarding.date.placeholder");
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

function MonthYearPicker({
  allowEmpty,
  futureYears,
  onChange,
  onClose,
  title,
  value,
  visible,
}: {
  allowEmpty: boolean;
  futureYears: number;
  onChange: (value: string) => void;
  onClose: () => void;
  title: string;
  value: string;
  visible: boolean;
}): ReactElement {
  const ed = useEd();
  const authTokens = useEditorialPalette();
  const { locale, t } = useI18n();
  const selected = parseYearMonth(value);
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(selected?.year ?? thisYear);
  // Re-seed the visible year each time the sheet opens.
  useEffect(() => {
    if (visible) setYear(parseYearMonth(value)?.year ?? thisYear);
  }, [visible, value, thisYear]);
  const months = Array.from({ length: 12 }, (_, i) =>
    monthLabel(2020, i + 1, locale, { month: "short" }),
  );
  return (
    <OverlayModal visible={visible} onRequestClose={onClose}>
      <Pressable style={ed.pickerOverlay} onPress={onClose}>
        {/* Absorb taps inside the card so they don't dismiss it. */}
        <Pressable style={ed.pickerCard} onPress={() => undefined}>
          <Text style={ed.pickerTitle}>{title}</Text>
          <View style={ed.pickerYearRow}>
            <Pressable
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t("onboarding.date.prevYear")}
              onPress={() => setYear((y) => Math.max(1950, y - 1))}
            >
              <ChevronLeft size={22} color={authTokens.ink} />
            </Pressable>
            <Text style={ed.pickerYear}>{year}</Text>
            <Pressable
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t("onboarding.date.nextYear")}
              onPress={() => setYear((y) => Math.min(thisYear + futureYears, y + 1))}
            >
              <ChevronRight size={22} color={authTokens.ink} />
            </Pressable>
          </View>
          <View style={ed.pickerGrid}>
            {months.map((monthName, i) => {
              const month = i + 1;
              const isSel = selected?.month === month && selected?.year === year;
              return (
                <Pressable
                  key={monthName}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSel }}
                  onPress={() => onChange(`${year}-${String(month).padStart(2, "0")}-01`)}
                  style={[ed.pickerMonth, isSel ? ed.pickerMonthSelected : null]}
                >
                  <Text style={[ed.pickerMonthText, isSel ? ed.pickerMonthTextSelected : null]}>
                    {monthName}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {allowEmpty ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => onChange("")}
              style={ed.pickerClear}
            >
              <Text style={ed.pickerClearText}>{t("onboarding.date.present")}</Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </OverlayModal>
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
  error,
  field,
  institutionName,
  onChange,
  onCompanyPick,
  onCoursePick,
  value,
}: {
  error?: string;
  field: SectionField;
  /** Sibling `institution` value — present only in sections that have one. */
  institutionName?: string | undefined;
  onChange: (value: string) => void;
  /** Forwarded to the company picker so the editor can sync `companyDomain`. */
  onCompanyPick?: ((company: PickedCompany | null) => void) | undefined;
  /** Forwarded to the course picker so the editor can derive degree fields. */
  onCoursePick?: ((course: PickedCourse | null) => void) | undefined;
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
        // End dates reach far enough for a degree starting today (e.g. 10
        // semesters of medicine); other dates only need next year.
        futureYears={field.key === "endDate" ? 8 : 1}
      />
    );
  }

  if (hasOptions) {
    return (
      <View>
        <FieldLabel error={Boolean(error)}>{field.label}</FieldLabel>
        <View style={ed.pillWrap}>
          {(field.options ?? []).map((option) => (
            <OptionPill
              key={option}
              label={option}
              selected={option === value}
              onPress={() => onChange(option)}
            />
          ))}
        </View>
        {error ? <FieldError text={error} /> : null}
      </View>
    );
  }

  if (multiline) {
    return (
      <FieldShell label={field.label} error={error} focused={focused}>
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={authTokens.subtle}
          multiline
          style={ed.textarea}
        />
      </FieldShell>
    );
  }

  return (
    <View>
      <UnderlineInput
        label={field.label}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        hasError={Boolean(error)}
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
