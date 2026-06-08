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
import { editorialPalette as authTokens } from "@patch-careers/tokens";
import { AnimatedField, PrimaryAction } from "@patch-careers/ui/editorial";
import { AlertCircle, Trash2, X } from "lucide-react-native";
import { type ComponentType, type ReactElement, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useI18n } from "../../providers/I18nProvider";
import { itemCardParts, itemSummary } from "./helpers";
import { AddRow, GhostButton, OverlayModal } from "./primitives";
import { SectionForm } from "./SectionForm";
import { ed, webNoOutline } from "./styles";
import type {
  FormData,
  SectionDescriptor,
  SectionField,
  SectionItem,
  SectionPersistAction,
} from "./types";
import { validateSectionFields } from "./validation";

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
  disabled,
  draft,
  draftErrors,
  fields,
  onCancel,
  onChangeDraft,
  onDelete,
  onSave,
  saveDisabled,
  t,
  title,
  visible,
}: {
  disabled: boolean;
  draft: FormData;
  draftErrors: Record<string, string>;
  fields: SectionField[];
  onCancel: () => void;
  onChangeDraft: (data: FormData) => void;
  onDelete?: () => void;
  onSave: () => void;
  saveDisabled: boolean;
  t: (key: string) => string;
  title: string;
  visible: boolean;
}): ReactElement {
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
              fields={fields}
              data={draft}
              errors={draftErrors}
              onChange={onChangeDraft}
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<FormData>({});
  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});
  const [persisting, setPersisting] = useState(false);
  const fields = step.fields ?? [];
  // Safety net: if the section's item fields aren't available (definitions not
  // seeded), don't drop the user into a blank editor — show a notice instead.
  const hasNoFields = fields.length === 0;
  const isEmpty = items.length === 0;
  const isEditing = editingIndex !== null;
  const activeIndex = editingIndex ?? items.length;
  const isNew = activeIndex === items.length;
  const busy = isPending || persisting;
  const hasErrors = Object.keys(validateSectionFields(fields, draft)).length > 0;

  function openNew(): void {
    setDraft({});
    setDraftErrors({});
    setEditingIndex(items.length);
  }

  function openExisting(index: number): void {
    const content = items[index]?.content ?? {};
    setDraft(
      Object.fromEntries(Object.entries(content).map(([key, value]) => [key, String(value ?? "")])),
    );
    setDraftErrors({});
    setEditingIndex(index);
  }

  function closeEditor(): void {
    setEditingIndex(null);
    setDraft({});
    setDraftErrors({});
  }

  function itemAt(index: number): SectionItem {
    const existing = items[index];
    return {
      ...(existing?.id ? { id: existing.id } : {}),
      content: existing?.content ?? {},
    };
  }

  async function saveItem(): Promise<void> {
    const nextErrors = validateSectionFields(fields, draft);
    setDraftErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const existing = items[activeIndex];
    const item: SectionItem = {
      ...(existing?.id ? { id: existing.id } : {}),
      content: { ...draft },
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
  }

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
        draft={draft}
        draftErrors={draftErrors}
        onChangeDraft={setDraft}
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
