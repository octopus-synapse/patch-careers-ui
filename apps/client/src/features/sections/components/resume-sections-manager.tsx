/**
 * The resume section manager — the whole "Perfil" sub-tab body, reused as-is
 * by the resume detail screen (any resumeId). Renders the visible section
 * groups (mandatory always, optional with ≥1 item, catalog order — never
 * user-reorderable), with:
 *
 *   - tap on an item   → edit modal (the shared SectionItemModal);
 *   - swipe (native) / hover trash (web) → real delete behind the editorial
 *     ConfirmDialog;
 *   - ONE pinned add box at the end → AddSectionFlowModal (catalog → form),
 *     the only way to add an item, even to an existing section.
 */

import type { Locale } from "@patch-careers/i18n";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { Link as LinkIcon, Plus, Trash2 } from "lucide-react-native";
import {
  forwardRef,
  type ReactElement,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useI18n } from "@/providers/i18n-provider";
import { useResumeSections } from "../hooks/use-resume-sections";
import { useSectionItemForm } from "../hooks/use-section-item-form";
import { useSectionItemMutations } from "../hooks/use-section-item-mutations";
import type { MergedSection } from "../lib/section-visibility";
import { useEd } from "../lib/styles";
import type { SectionItem } from "../types";
import { AddSectionFlowModal } from "./add-section-flow-modal";
import { LinksCard } from "./links-card";
import { SectionCard } from "./section-card";
import { SectionGroup } from "./section-group";
import { SectionItemModal } from "./section-item-modal";

const LINKS_SECTION_KEY = "links_v1";

type EditingState = { section: MergedSection; item: SectionItem; index: number };
type ConfirmState = { section: MergedSection; item: SectionItem; index: number };

/** Collapse a section type key (`work_experience_v1`) or semanticKind
 * (`WORK_EXPERIENCE`) to a comparable token (`workexperience`). */
function normalizeSectionKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/_v\d+$/, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Edit modal wrapper — mounted per item (key) so the form resets cleanly. */
function EditItemModal({
  editing,
  isPending,
  onSave,
  onRequestDelete,
  onClose,
  t,
}: {
  editing: EditingState;
  isPending: boolean;
  onSave: (item: SectionItem) => Promise<void>;
  onRequestDelete: () => void;
  onClose: () => void;
  t: (key: string) => string;
}): ReactElement {
  const fields = editing.section.descriptor.fields ?? [];
  const {
    form,
    derivedKeys,
    hasCompany,
    isEducation,
    handleCompanyPick,
    handleCoursePick,
    handleRolePick,
    resetForExisting,
    hasErrors,
  } = useSectionItemForm(fields);
  // Prefill once on mount (the component is keyed by the item).
  const [seeded] = useState(() => {
    resetForExisting(editing.item.content ?? {});
    return true;
  });
  void seeded;

  const save = form.handleSubmit(async (values) => {
    await onSave({
      ...(editing.item.id ? { id: editing.item.id } : {}),
      content: { ...values },
    });
  });

  return (
    <SectionItemModal
      visible
      title={t("onboarding.editItem")}
      fields={fields}
      control={form.control}
      readOnlyKeys={derivedKeys}
      onCompanyPick={hasCompany ? handleCompanyPick : undefined}
      onCoursePick={isEducation ? handleCoursePick : undefined}
      onRolePick={hasCompany ? handleRolePick : undefined}
      onSave={() => void save()}
      onCancel={onClose}
      onDelete={onRequestDelete}
      saveDisabled={hasErrors || isPending}
      disabled={isPending}
      t={t}
    />
  );
}

/** Imperative handle so the quality panel can deep-link an issue to the
 * exact section/item editor. */
export type SectionsManagerHandle = {
  openItem: (sectionKey: string, itemIndex?: number) => void;
};

export type ResumeSectionsManagerProps = {
  resumeId: string | undefined;
  /** Localize the catalog by the resume's language (falls back to UI locale). */
  locale?: Locale | undefined;
  /**
   * "flat" (default) = the plain small-caps groups used by the resume detail
   * screen. "grouped" = the Profile tab's supersection cards (links rendered as
   * a dedicated card, standalone sections each in their own card).
   */
  variant?: "flat" | "grouped";
  /**
   * Deep-link target: once the sections load, open this section's editor
   * (or its add flow when empty). Used by `?section=` and the quality
   * "fix this" flow. The parent should clear it via `onAutoOpenHandled`.
   */
  autoOpenSectionKey?: string | undefined;
  onAutoOpenHandled?: (() => void) | undefined;
  /**
   * Render (and scope "add") to a single section only — used by the Profile
   * tab's per-section detail screens. Omit to manage every section.
   */
  onlySection?: string | undefined;
};

export const ResumeSectionsManager = forwardRef<SectionsManagerHandle, ResumeSectionsManagerProps>(
  function ResumeSectionsManager(
    { resumeId, locale, variant = "flat", autoOpenSectionKey, onAutoOpenHandled, onlySection },
    ref,
  ): ReactElement {
    const ed = useEd();
    const authTokens = useEditorialPalette();
    const { t } = useI18n();
    const { visible, catalog, groups, isLoading, isError } = useResumeSections(resumeId, locale);
    const { persistFor, isPending } = useSectionItemMutations(resumeId);

    const [editing, setEditing] = useState<EditingState | null>(null);
    const [addOpen, setAddOpen] = useState(false);
    const [confirm, setConfirm] = useState<ConfirmState | null>(null);

    // Open a section's editor by key. The quality issue's `context.sectionKey`
    // may be the section type key (`work_experience_v1`) or its semanticKind
    // (`WORK_EXPERIENCE`); normalize both sides so either resolves.
    const openByKey = useCallback(
      (sectionKey: string, itemIndex?: number): boolean => {
        const target = normalizeSectionKey(sectionKey);
        const section = visible.find((s) => normalizeSectionKey(s.key) === target);
        if (!section) return false;
        const index = itemIndex ?? 0;
        const item = section.items[index];
        if (item) setEditing({ section, item, index });
        else setAddOpen(true);
        return true;
      },
      [visible],
    );

    useImperativeHandle(
      ref,
      () => ({
        openItem: (sectionKey, itemIndex) => {
          openByKey(sectionKey, itemIndex);
        },
      }),
      [openByKey],
    );

    // Deep-link / "fix this" open: fire once the catalog has loaded.
    useEffect(() => {
      if (!autoOpenSectionKey || visible.length === 0) return;
      openByKey(autoOpenSectionKey);
      onAutoOpenHandled?.();
    }, [autoOpenSectionKey, visible, onAutoOpenHandled, openByKey]);

    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={authTokens.ink} />
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.centered}>
          <Text style={ed.centeredText}>{t("sections.loadError")}</Text>
        </View>
      );
    }

    const saveEdit = async (item: SectionItem): Promise<void> => {
      if (!editing) return;
      await persistFor(editing.section.key)({ kind: "update", item, index: editing.index });
      setEditing(null);
    };

    const confirmDelete = async (): Promise<void> => {
      if (!confirm) return;
      await persistFor(confirm.section.key)({
        kind: "delete",
        item: confirm.item,
        index: confirm.index,
      });
      setConfirm(null);
    };

    const createItem = async (section: MergedSection, item: SectionItem): Promise<void> => {
      await persistFor(section.key)({ kind: "create", item, index: section.items.length });
      setAddOpen(false);
    };

    const editItem = (section: MergedSection, item: SectionItem, index: number): void =>
      setEditing({ section, item, index });
    const deleteItem = (section: MergedSection, item: SectionItem, index: number): void =>
      setConfirm({ section, item, index });
    const removeLabel = t("onboarding.removeItem");

    const inScope = (key: string): boolean =>
      !onlySection || normalizeSectionKey(key) === normalizeSectionKey(onlySection);
    const linksSection = inScope(LINKS_SECTION_KEY)
      ? visible.find((s) => s.key === LINKS_SECTION_KEY)
      : undefined;
    const standalone = visible.filter((s) => s.key !== LINKS_SECTION_KEY && inScope(s.key));
    const onlineGroup = groups.find((g) => g.key === "online_presence");
    // Scope the add catalog to the focused section so its "+" adds an item to
    // it directly (rather than offering the whole catalog).
    const addCatalog = onlySection ? catalog.filter((c) => inScope(c.key)) : catalog;

    return (
      <View style={styles.root}>
        {variant === "grouped" ? (
          <>
            {standalone.map((section) => (
              <SectionCard key={section.key} title={section.title}>
                <SectionGroup
                  section={section}
                  showLabel={false}
                  onEditItem={(item, index) => editItem(section, item, index)}
                  onDeleteItem={(item, index) => deleteItem(section, item, index)}
                  deleteLabel={removeLabel}
                />
              </SectionCard>
            ))}

            {linksSection ? (
              <SectionCard
                title={onlineGroup?.title ?? linksSection.title}
                leading={<LinkIcon size={16} color={authTokens.muted} strokeWidth={1.75} />}
              >
                <LinksCard
                  section={linksSection}
                  onEditItem={(item, index) => editItem(linksSection, item, index)}
                  onDeleteItem={(item, index) => deleteItem(linksSection, item, index)}
                  deleteLabel={removeLabel}
                />
              </SectionCard>
            ) : null}
          </>
        ) : (
          visible.map((section) => (
            <SectionGroup
              key={section.key}
              section={section}
              onEditItem={(item, index) => editItem(section, item, index)}
              onDeleteItem={(item, index) => deleteItem(section, item, index)}
              deleteLabel={removeLabel}
            />
          ))
        )}

        {/* The single add affordance — even a 2nd item of an existing section
          comes through here. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("sections.addToResume")}
          onPress={() => setAddOpen(true)}
          style={ed.addSection}
        >
          <Plus size={15} color={authTokens.ink} strokeWidth={2} />
          <Text style={ed.addSectionLabel}>{t("sections.addToResume")}</Text>
        </Pressable>

        {editing ? (
          <EditItemModal
            key={editing.item.id ?? `${editing.section.key}-${editing.index}`}
            editing={editing}
            isPending={isPending}
            onSave={saveEdit}
            onRequestDelete={() => {
              // Close the editor first — stacking two RN Modals is flaky on
              // Android — then confirm the destructive action.
              const current = editing;
              setEditing(null);
              setConfirm(current);
            }}
            onClose={() => setEditing(null)}
            t={t}
          />
        ) : null}

        <AddSectionFlowModal
          visible={addOpen}
          onClose={() => setAddOpen(false)}
          catalog={addCatalog}
          onCreate={createItem}
          isPending={isPending}
          t={t}
        />

        <ConfirmDialog
          open={confirm !== null}
          onOpenChange={(open) => {
            if (!open) setConfirm(null);
          }}
          title={t("sections.deleteConfirm.title")}
          description={t("sections.deleteConfirm.description")}
          danger
          icon={Trash2}
          onConfirm={() => void confirmDelete()}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  root: { gap: 26 },
  centered: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },
});
