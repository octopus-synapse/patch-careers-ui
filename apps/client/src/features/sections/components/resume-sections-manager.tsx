/**
 * The resume section manager — the whole "Perfil" sub-tab body, reused as-is
 * by the resume detail screen (any resumeId). Renders the visible section
 * groups (mandatory always, optional with ≥1 item, catalog order — never
 * user-reorderable), with:
 *
 *   - tap on an item   → edit modal (the shared SectionItemModal);
 *   - swipe (native) / hover trash (web) → real delete behind the editorial
 *     ConfirmDialog;
 *   - add → AddSectionFlowModal (catalog → form).
 *
 * ONE add affordance per surface, but which one depends on the variant. The
 * flat and grouped variants pin a single box at the end: they are indexes, the
 * list is short, and the box is always in view. The `expanded` variant (the
 * desktop profile) renders every item open, so a section card can run hundreds
 * of pixels tall — a lone box far below reads as the end of the page, not as
 * the way into the section above it. There the global door moves to the rail
 * and each card carries its own scoped one.
 */

import type { Locale } from "@patch-careers/i18n";
import { YStack } from "@patch-careers/ui";
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
import { ActivityIndicator, Pressable, Text } from "react-native";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { I18nProvider, translatorFor } from "@/providers/i18n-provider";
import { type SectionLocales, useResumeSections } from "../hooks/use-resume-sections";
import { useSectionItemForm } from "../hooks/use-section-item-form";
import { type RewriteProposal, useSectionItemMutations } from "../hooks/use-section-item-mutations";
import type { MergedSection } from "../lib/section-visibility";
import { useEd } from "../lib/styles";
import { fieldValueFromText } from "../lib/text-diff";
import type { SectionItem } from "../types";
import { AddSectionFlowModal } from "./add-section-flow-modal";
import { LinksCard } from "./links-card";
import {
  decisionsFromProposal,
  type FieldDecision,
  RewriteReviewModal,
} from "./rewrite-review-modal";
import { SectionCard } from "./section-card";
import { SectionDetailRow } from "./section-detail-row";
import { SectionGroup } from "./section-group";
import { SectionItemModal } from "./section-item-modal";
import { SectionPanelCard } from "./section-panel-card";

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

/**
 * Edit modal wrapper — mounted per item (key) so the form resets cleanly.
 *
 * Bilingual save (backend ADR-003, decisions 11–12). On save, if the résumé
 * has another language, ask what that language's copy would become and let
 * the person review it field by field before anything is written:
 *
 *  - editing the CANONICAL side: the item is patched; accepted proposals (or
 *    the person's rewrite of them) are stored as the other copy with origin
 *    `manual`; if every change is refused the other copy is stored as
 *    `diverged` so the worker leaves it alone; accepting all as proposed
 *    stores nothing — the worker derives it, from the same cache.
 *  - editing the DERIVED side: the edited prose is stored as that copy with
 *    origin `manual`; non-prose fields (dates, names) and any accepted
 *    proposal for the canonical text are patched onto the item.
 */
function EditItemModal({
  editing,
  isPending,
  locales,
  onSave,
  onWriteTranslation,
  onProposeRewrite,
  onRequestDelete,
  onClose,
  t,
}: {
  editing: EditingState;
  isPending: boolean;
  locales: SectionLocales;
  onSave: (item: SectionItem) => Promise<void>;
  onWriteTranslation: (input: {
    itemId: string;
    locale: Locale;
    data: Record<string, unknown>;
    origin: "manual" | "diverged";
  }) => Promise<void>;
  onProposeRewrite: (input: {
    itemId: string;
    editedLocale: Locale;
    edited: Record<string, unknown>;
  }) => Promise<RewriteProposal>;
  onRequestDelete: () => void;
  onClose: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
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

  const [review, setReview] = useState<{
    values: Record<string, string>;
    proposal: RewriteProposal;
    decisions: FieldDecision[];
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const editingDerived = locales.content !== locales.canonical;
  const otherLocale: Locale = editingDerived ? locales.canonical : otherOf(locales.canonical);

  const persistPlain = async (values: Record<string, string>): Promise<void> => {
    await onSave({ ...(editing.item.id ? { id: editing.item.id } : {}), content: { ...values } });
  };

  const save = form.handleSubmit(async (values) => {
    const itemId = editing.item.id;
    // A new item, or nothing to translate on the other side: plain save.
    if (!itemId) {
      await persistPlain(values);
      return;
    }
    setBusy(true);
    try {
      const proposal = await onProposeRewrite({
        itemId,
        editedLocale: locales.content,
        edited: values,
      });
      const decisions = decisionsFromProposal(proposal.keys, proposal.current, proposal.proposal);
      if (decisions.length === 0) {
        await finish(values, proposal, []);
        return;
      }
      setReview({ values, proposal, decisions });
    } catch {
      // The rewrite is a courtesy; the edit itself must never be blocked by it.
      await persistPlain(values);
    } finally {
      setBusy(false);
    }
  });

  const finish = async (
    values: Record<string, string>,
    proposal: RewriteProposal,
    decisions: FieldDecision[],
  ): Promise<void> => {
    const itemId = editing.item.id as string;
    const translatable = new Set(proposal.keys);
    const accepted = decisions.filter((d) => d.accepted);
    const refused = decisions.filter((d) => !d.accepted);
    const edited = accepted.some((d) => d.text !== d.proposal);
    const asArray = (key: string): boolean => Array.isArray(editing.item.content?.[key]);
    const otherData: Record<string, unknown> = { ...proposal.current };
    for (const d of accepted) otherData[d.key] = fieldValueFromText(d.text, asArray(d.key));

    if (!editingDerived) {
      await persistPlain(values);
      if (decisions.length === 0) return;
      if (accepted.length === 0) {
        await onWriteTranslation({
          itemId,
          locale: otherLocale,
          data: otherData,
          origin: "diverged",
        });
      } else if (edited || refused.length > 0) {
        await onWriteTranslation({
          itemId,
          locale: otherLocale,
          data: otherData,
          origin: "manual",
        });
      }
      // all accepted as proposed → the worker derives it (same cache, same text)
      return;
    }

    // Editing the derived copy: prose goes to the envelope, everything else
    // (and accepted proposals) goes to the canonical item.
    const prose: Record<string, unknown> = {};
    const canonicalPatch: Record<string, unknown> = { ...(editing.item.content ?? {}) };
    for (const [key, value] of Object.entries(values)) {
      if (translatable.has(key)) prose[key] = value;
      else canonicalPatch[key] = value;
    }
    for (const d of accepted) canonicalPatch[d.key] = fieldValueFromText(d.text, asArray(d.key));
    await onWriteTranslation({ itemId, locale: locales.content, data: prose, origin: "manual" });
    await onSave({ id: itemId, content: canonicalPatch });
  };

  return (
    <>
      <SectionItemModal
        visible={!review}
        title={editing.section.title}
        fields={fields}
        control={form.control}
        readOnlyKeys={derivedKeys}
        onCompanyPick={hasCompany ? handleCompanyPick : undefined}
        onCoursePick={isEducation ? handleCoursePick : undefined}
        onRolePick={hasCompany ? handleRolePick : undefined}
        onSave={() => void save()}
        onCancel={onClose}
        onDelete={onRequestDelete}
        saveDisabled={hasErrors || isPending || busy}
        disabled={isPending || busy}
        t={t}
      />
      {review ? (
        <RewriteReviewModal
          visible
          localeLabel={t(
            otherLocale === "en" ? "sections.rewrite.localeEn" : "sections.rewrite.localePt",
          )}
          fields={fields}
          decisions={review.decisions}
          onChangeDecision={(key, patch) =>
            setReview((current) =>
              current
                ? {
                    ...current,
                    decisions: current.decisions.map((d) =>
                      d.key === key ? { ...d, ...patch } : d,
                    ),
                  }
                : current,
            )
          }
          onApply={() => {
            setBusy(true);
            void finish(review.values, review.proposal, review.decisions).finally(() =>
              setBusy(false),
            );
          }}
          onKeep={() => {
            setBusy(true);
            void finish(
              review.values,
              review.proposal,
              review.decisions.map((d) => ({ ...d, accepted: false })),
            ).finally(() => setBusy(false));
          }}
          busy={busy || isPending}
          t={t}
        />
      ) : null}
    </>
  );
}

const otherOf = (locale: Locale): Locale => (locale === "en" ? "pt-BR" : "en");

/** Imperative handle so the quality panel can deep-link an issue to the
 * exact section/item editor. */
export type SectionsManagerHandle = {
  openItem: (sectionKey: string, itemIndex?: number) => void;
};

export type ResumeSectionsManagerProps = {
  resumeId: string | undefined;
  /** ADR-0011 — the surface states both locales; nothing is inferred here. */
  locales: SectionLocales;
  /**
   * "flat" (default) = the plain small-caps groups used by the resume detail
   * screen. "grouped" = the Profile tab's supersection cards (links rendered as
   * a dedicated card, standalone sections each in their own card).
   */
  variant?: "flat" | "grouped" | "expanded";
  /**
   * Where the add affordance lives. "footer" (default) is the single pinned
   * box; "perSection" gives each card its own and drops the footer — the
   * caller is then responsible for a global entry point.
   */
  addPlacement?: "footer" | "perSection";
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

const ResumeSectionsManagerBody = forwardRef<SectionsManagerHandle, ResumeSectionsManagerProps>(
  function ResumeSectionsManagerBody(
    {
      resumeId,
      locales,
      variant = "flat",
      addPlacement = "footer",
      autoOpenSectionKey,
      onAutoOpenHandled,
      onlySection,
    },
    ref,
  ): ReactElement {
    const ed = useEd();
    const authTokens = useEditorialPalette();
    // Chrome (buttons, confirmations, "Presente") follows the surface's chrome
    // locale, which on the document is the document's — not the app's.
    const t = translatorFor(locales.chrome);
    const { visible, catalog, groups, isLoading, isError } = useResumeSections(resumeId, locales);
    const { persistFor, proposeRewrite, writeTranslation, isPending } =
      useSectionItemMutations(resumeId);

    const [editing, setEditing] = useState<EditingState | null>(null);
    const [addOpen, setAddOpen] = useState(false);
    /** Set when the add came from a card's own button, so the catalog step is skipped. */
    const [addingSection, setAddingSection] = useState<MergedSection | null>(null);
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
        <YStack alignItems="center" justifyContent="center" paddingVertical={40}>
          <ActivityIndicator color={authTokens.ink} />
        </YStack>
      );
    }

    if (isError) {
      return (
        <YStack alignItems="center" justifyContent="center" paddingVertical={40}>
          <Text style={ed.centeredText}>{t("sections.loadError")}</Text>
        </YStack>
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

    const openAddFor = (section: MergedSection): void => {
      setAddingSection(section);
      setAddOpen(true);
    };
    const closeAdd = (): void => {
      setAddOpen(false);
      setAddingSection(null);
    };

    if (variant === "expanded") {
      return (
        <YStack gap={16}>
          {visible.map((section) => (
            <SectionPanelCard
              key={section.key}
              title={section.title}
              addLabel={section.atCapacity ? undefined : section.addLabel}
              onAdd={section.atCapacity ? undefined : () => openAddFor(section)}
            >
              {section.key === LINKS_SECTION_KEY ? (
                <LinksCard
                  section={section}
                  onEditItem={(item, index) => editItem(section, item, index)}
                  onDeleteItem={(item, index) => deleteItem(section, item, index)}
                  deleteLabel={removeLabel}
                />
              ) : (
                section.items.map((item, index) => (
                  <SectionDetailRow
                    chromeLocale={locales.chrome}
                    key={item.id ?? `${section.key}-${index}`}
                    item={item}
                    fields={section.descriptor.fields ?? undefined}
                    onEdit={() => editItem(section, item, index)}
                    isFirst={index === 0}
                    isLast={index === section.items.length - 1}
                  />
                ))
              )}
            </SectionPanelCard>
          ))}

          {editing ? (
            <EditItemModal
              key={editing.item.id ?? `${editing.section.key}-${editing.index}`}
              editing={editing}
              locales={locales}
              onProposeRewrite={(input) =>
                proposeRewrite({ ...input, sectionTypeKey: editing.section.key })
              }
              onWriteTranslation={(input) =>
                writeTranslation({ ...input, sectionTypeKey: editing.section.key })
              }
              isPending={isPending}
              onSave={saveEdit}
              onRequestDelete={() => {
                const current = editing;
                setEditing(null);
                setConfirm(current);
              }}
              onClose={() => setEditing(null)}
              t={t}
            />
          ) : null}

          <AddSectionFlowModal
            key={addingSection?.key ?? "catalog"}
            visible={addOpen}
            onClose={closeAdd}
            catalog={addCatalog}
            initialPick={addingSection ?? undefined}
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
        </YStack>
      );
    }

    return (
      <YStack gap={26}>
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

        {/* The pinned add affordance for the index variants — even a 2nd item
          of an existing section comes through here. `expanded` returns above
          with its own per-card doors. */}
        {addPlacement === "footer" ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("sections.addToResume")}
            onPress={() => setAddOpen(true)}
            style={ed.addSection}
          >
            <Plus size={15} color={authTokens.ink} strokeWidth={2} />
            <Text style={ed.addSectionLabel}>{t("sections.addToResume")}</Text>
          </Pressable>
        ) : null}

        {editing ? (
          <EditItemModal
            key={editing.item.id ?? `${editing.section.key}-${editing.index}`}
            editing={editing}
            locales={locales}
            onProposeRewrite={(input) =>
              proposeRewrite({ ...input, sectionTypeKey: editing.section.key })
            }
            onWriteTranslation={(input) =>
              writeTranslation({ ...input, sectionTypeKey: editing.section.key })
            }
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
      </YStack>
    );
  },
);

/**
 * ADR-0011: everything the manager renders — the edit modal, the add flow,
 * pickers, field renderers, confirmations — is chrome of ONE surface, and that
 * surface's chrome locale is `locales.chrome`. Scoping an `I18nProvider` here
 * means every `useI18n()` below resolves to it by construction, instead of a
 * prop threaded through nine components that could each forget it. On the
 * profile this equals the app's locale; on the resume detail it is the
 * document's, so an English resume's editor says "Present".
 */
export const ResumeSectionsManager = forwardRef<SectionsManagerHandle, ResumeSectionsManagerProps>(
  function ResumeSectionsManager(props, ref): ReactElement {
    return (
      <I18nProvider locale={props.locales.chrome}>
        <ResumeSectionsManagerBody ref={ref} {...props} />
      </I18nProvider>
    );
  },
);
