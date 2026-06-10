/**
 * Reusable multi-item section editor (work experience, education, …). Extracted
 * from the onboarding wizard so the Profile tab reuses the exact same UX: a list
 * of saved entry cards + a full-screen item editor modal.
 *
 * Two persistence modes via the optional `onPersistItem`:
 *   - absent  → onboarding: items live in local state, batch-saved on step submit
 *     (the wizard passes `onChange` and commits the whole section later).
 *   - present → Profile: each add/edit/delete is committed immediately to the
 *     resume's section items; the list is re-derived from the refetched query.
 */
import { AnimatedField, PrimaryAction, useEditorialPalette } from "@patch-careers/ui/editorial";
import { AlertCircle, Trash2, X } from "lucide-react-native";
import {
  type ComponentType,
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { type Control, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { fieldErrorsResolver } from "@/forms";
import { useI18n } from "@/providers/i18n-provider";
import {
  degreeTypeFromGrau,
  itemCardParts,
  itemSummary,
  suggestEndDateFromWorkload,
} from "../lib/helpers";
import { useEd, webNoOutline } from "../lib/styles";
import { validateSectionFields } from "../lib/validation";
import type {
  FormData,
  SectionDescriptor,
  SectionField,
  SectionItem,
  SectionPersistAction,
} from "../types";
import type { PickedCompany } from "./company-picker";
import type { PickedCourse } from "./course-picker";
import { AddRow, GhostButton, OverlayModal } from "./primitives";
import { SectionForm } from "./section-form";

const EMPTY_KEY_SET: ReadonlySet<string> = new Set();

/** Illustration component for a section's empty state (e.g. onboarding's art). */
type SectionArt = ComponentType<{ size?: number }>;

/**
 * A saved section entry rendered as an editorial card: mono ordinal · headline /
 * meta · subtle delete. The whole card taps to edit.
 */
function ItemCard({
  index,
  item,
  onEdit,
  onRemove,
  removeLabel,
}: {
  index: number;
  item: SectionItem;
  onEdit: () => void;
  onRemove: () => void;
  removeLabel: string;
}): ReactElement {
  const ed = useEd();
  const authTokens = useEditorialPalette();
  const { locale } = useI18n();
  const { primary, meta } = itemCardParts(item, locale);
  const [active, setActive] = useState(false);
  const [removeActive, setRemoveActive] = useState(false);
  const ordinal = String(index + 1).padStart(2, "0");
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={primary}
      {...(meta ? { accessibilityHint: meta } : {})}
      onPress={onEdit}
      onHoverIn={() => setActive(true)}
      onHoverOut={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      style={({ pressed }) => [ed.card, (active || pressed) && ed.cardActive, webNoOutline]}
    >
      <Text style={ed.cardIndex}>{ordinal}</Text>
      <View style={ed.cardBody}>
        <Text style={ed.cardPrimary} numberOfLines={1}>
          {primary}
        </Text>
        {meta ? (
          <Text style={ed.cardMeta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={removeLabel}
        onPress={onRemove}
        onHoverIn={() => setRemoveActive(true)}
        onHoverOut={() => setRemoveActive(false)}
        onFocus={() => setRemoveActive(true)}
        onBlur={() => setRemoveActive(false)}
        hitSlop={10}
        style={({ pressed }) => [
          ed.cardRemove,
          (removeActive || pressed) && ed.cardRemoveActive,
          webNoOutline,
        ]}
      >
        <Trash2
          size={16}
          color={removeActive ? authTokens.danger : authTokens.muted}
          strokeWidth={1.75}
        />
      </Pressable>
    </Pressable>
  );
}

/** Illustrated empty state for a section (item: SVG empty states). */
function SectionEmptyState({
  addLabel,
  art: Art,
  onAdd,
  t,
}: {
  addLabel: string;
  art?: SectionArt | undefined;
  onAdd: () => void;
  t: (key: string) => string;
}): ReactElement {
  const ed = useEd();
  return (
    <AnimatedField delay={120}>
      <View style={ed.emptyState}>
        {Art ? <Art size={120} /> : null}
        <Text style={ed.emptyTitle}>{t("onboarding.section.emptyTitle")}</Text>
        <Text style={ed.emptyBody}>{t("onboarding.section.emptyBody")}</Text>
        <AddRow label={addLabel} onPress={onAdd} style={ed.emptyAdd} />
      </View>
    </AnimatedField>
  );
}

/** Full-screen item editor for section steps. Slides up over the list. */
function MultiItemEditorModal({
  control,
  disabled,
  fields,
  onCancel,
  onCompanyPick,
  onCoursePick,
  onDelete,
  onSave,
  readOnlyKeys,
  saveDisabled,
  t,
  title,
  visible,
}: {
  control: Control<FormData>;
  disabled: boolean;
  fields: SectionField[];
  onCancel: () => void;
  onCompanyPick?: ((company: PickedCompany | null) => void) | undefined;
  onCoursePick?: ((course: PickedCourse | null) => void) | undefined;
  onDelete?: () => void;
  onSave: () => void;
  readOnlyKeys?: ReadonlySet<string> | undefined;
  saveDisabled: boolean;
  t: (key: string) => string;
  title: string;
  visible: boolean;
}): ReactElement {
  const ed = useEd();
  const authTokens = useEditorialPalette();
  return (
    <OverlayModal visible={visible} onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={ed.editorModalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Tap outside the card to dismiss */}
        <Pressable
          style={ed.editorModalBackdrop}
          accessibilityRole="button"
          accessibilityLabel={t("common.cancel")}
          onPress={onCancel}
        />
        <View style={ed.editorModalCard}>
          <View style={ed.editorModalHeader}>
            <Text style={ed.editorModalTitle}>{title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("common.cancel")}
              hitSlop={12}
              onPress={onCancel}
            >
              <X size={22} color={authTokens.muted} />
            </Pressable>
          </View>
          <ScrollView
            style={ed.flex}
            contentContainerStyle={ed.editorModalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <SectionForm
              control={control}
              fields={fields}
              readOnlyKeys={readOnlyKeys}
              onCompanyPick={onCompanyPick}
              onCoursePick={onCoursePick}
            />
          </ScrollView>
          <View style={ed.editorModalFooter}>
            {onDelete ? (
              <GhostButton
                danger
                label={t("common.delete")}
                onPress={onDelete}
                disabled={disabled}
              />
            ) : (
              <View />
            )}
            <PrimaryAction label={t("common.save")} onPress={onSave} disabled={saveDisabled} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </OverlayModal>
  );
}

export function SectionItemEditor({
  art,
  isPending = false,
  items,
  onChange,
  onPersistItem,
  step,
  t,
}: {
  art?: SectionArt | undefined;
  isPending?: boolean;
  items: SectionItem[];
  /** Local (batch) update — used when `onPersistItem` is absent. */
  onChange?: (items: SectionItem[]) => void;
  /** Live persistence — when present, add/edit/delete commit immediately. */
  onPersistItem?: (action: SectionPersistAction) => Promise<void>;
  step: SectionDescriptor;
  t: (key: string) => string;
}): ReactElement {
  const ed = useEd();
  const authTokens = useEditorialPalette();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [persisting, setPersisting] = useState(false);
  const fields = step.fields ?? [];
  // The per-item modal form lives in RHF (ADR-0005); the list of items stays in
  // the parent (local state for onboarding, refetched query for Profile).
  const form = useForm<FormData>({
    defaultValues: {},
    resolver: fieldErrorsResolver<FormData>((values) => validateSectionFields(fields, values)),
  });

  // Education cascade: degree + degreeType derive from the picked MEC course
  // (its `grau`), so they render read-only while derived; a free-text course
  // clears them back to manual entry. Changing the institution invalidates
  // everything downstream (the course may not exist there).
  const isEducation =
    fields.some((field) => field.key === "institution") &&
    fields.some((field) => field.key === "field");
  // Work experience cascade: the hidden `companyDomain` (drives the logo)
  // follows the company picker — a catalog pick sets it, a typed/edited
  // company clears it so a stale logo never outlives its company.
  const hasCompany = fields.some((field) => field.key === "company");
  const lastCompany = useRef("");
  const [derivedKeys, setDerivedKeys] = useState<ReadonlySet<string>>(EMPTY_KEY_SET);
  const lastInstitution = useRef("");
  // Workload (hours) of the picked MEC course + the end date we last suggested
  // from it — so a re-pick or start-date change updates our own suggestion but
  // never clobbers a date the user typed themselves.
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

  const handleCompanyPick = (company: PickedCompany | null) => {
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

  const handleCoursePick = (course: PickedCourse | null) => {
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
  // Safety net: if the section's item fields aren't available (definitions not
  // seeded), don't drop the user into a blank editor — show a notice instead.
  const hasNoFields = fields.length === 0;
  const isEmpty = items.length === 0;
  const isEditing = editingIndex !== null;
  const activeIndex = editingIndex ?? items.length;
  const isNew = activeIndex === items.length;
  const busy = isPending || persisting;
  const hasErrors = Object.keys(validateSectionFields(fields, form.watch())).length > 0;

  function openNew(): void {
    form.reset({});
    lastInstitution.current = "";
    lastCompany.current = "";
    pickedWorkload.current = null;
    lastSuggestedEnd.current = "";
    setDerivedKeys(EMPTY_KEY_SET);
    setEditingIndex(items.length);
  }

  function openExisting(index: number): void {
    const content = items[index]?.content ?? {};
    form.reset(
      Object.fromEntries(Object.entries(content).map(([key, value]) => [key, String(value ?? "")])),
    );
    // Saved entries open fully editable: we can't tell whether their degree
    // was MEC-derived, so nothing is marked read-only.
    lastInstitution.current = String(content.institution ?? "");
    // Seed with the saved name so reopening doesn't clear the saved domain.
    lastCompany.current = String(content.company ?? "");
    pickedWorkload.current = null;
    lastSuggestedEnd.current = "";
    setDerivedKeys(EMPTY_KEY_SET);
    setEditingIndex(index);
  }

  function closeEditor(): void {
    setEditingIndex(null);
    form.reset({});
    lastInstitution.current = "";
    lastCompany.current = "";
    pickedWorkload.current = null;
    lastSuggestedEnd.current = "";
    setDerivedKeys(EMPTY_KEY_SET);
  }

  function itemAt(index: number): SectionItem {
    const existing = items[index];
    return {
      ...(existing?.id ? { id: existing.id } : {}),
      content: existing?.content ?? {},
    };
  }

  const saveItem = form.handleSubmit(async (values) => {
    const existing = items[activeIndex];
    const item: SectionItem = {
      ...(existing?.id ? { id: existing.id } : {}),
      content: { ...values },
    };
    if (onPersistItem) {
      setPersisting(true);
      try {
        await onPersistItem({ kind: isNew ? "create" : "update", item, index: activeIndex });
        closeEditor();
      } catch {
        // Keep the editor open on failure; the host surfaces the error.
      } finally {
        setPersisting(false);
      }
      return;
    }
    const next = items.slice();
    next[activeIndex] = item;
    onChange?.(next);
    closeEditor();
  });

  async function removeAt(index: number): Promise<void> {
    if (onPersistItem) {
      setPersisting(true);
      try {
        await onPersistItem({ kind: "delete", item: itemAt(index), index });
      } catch {
        // no-op — list stays as-is.
      } finally {
        setPersisting(false);
      }
      return;
    }
    onChange?.(items.filter((_, itemIndex) => itemIndex !== index));
  }

  async function deleteEditing(): Promise<void> {
    if (!isEditing || isNew) return;
    await removeAt(activeIndex);
    closeEditor();
  }

  if (hasNoFields) {
    return (
      <View style={ed.noticeCard}>
        <AlertCircle size={18} color={authTokens.warn} />
        <Text style={ed.noticeTitle}>{t("onboarding.section.noFieldsTitle")}</Text>
        <Text style={ed.noticeBody}>{t("onboarding.section.noFieldsBody")}</Text>
      </View>
    );
  }

  const addLabel = step.addLabel ?? t("onboarding.addItem");

  // The list / empty-state stays mounted; the item editor opens as a full-screen
  // modal over it rather than replacing the content inline.
  const underlying = isEmpty ? (
    <SectionEmptyState art={art} addLabel={addLabel} onAdd={openNew} t={t} />
  ) : (
    <View>
      <View style={ed.list}>
        {items.map((item, index) => (
          <ItemCard
            key={item.id ?? `${index}-${itemSummary(item)}`}
            index={index}
            item={item}
            onEdit={() => openExisting(index)}
            onRemove={() => void removeAt(index)}
            removeLabel={t("onboarding.removeItem")}
          />
        ))}
      </View>

      <AddRow label={addLabel} onPress={openNew} style={ed.addRow} />
    </View>
  );

  return (
    <View>
      {underlying}
      <MultiItemEditorModal
        visible={isEditing}
        title={isNew ? addLabel : t("onboarding.editItem")}
        fields={fields}
        control={form.control}
        readOnlyKeys={derivedKeys}
        onCompanyPick={hasCompany ? handleCompanyPick : undefined}
        onCoursePick={isEducation ? handleCoursePick : undefined}
        onSave={() => void saveItem()}
        onCancel={closeEditor}
        {...(isEditing && !isNew ? { onDelete: () => void deleteEditing() } : {})}
        saveDisabled={hasErrors || busy}
        disabled={busy}
        t={t}
      />
    </View>
  );
}
