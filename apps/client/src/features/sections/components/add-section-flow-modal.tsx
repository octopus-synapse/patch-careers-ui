/**
 * The single "add" entry point of the resume section manager: a modal that
 * first lists the whole section-type catalog (existing sections included —
 * adding a 2nd education also comes through here), then slides straight into
 * the item form for the picked type, with a back chevron to re-pick. Saving
 * creates the section implicitly (the items POST is keyed by sectionTypeKey)
 * plus the item in one flow.
 */

import { fetcher } from "@patch-careers/api-client";
import type { Locale } from "@patch-careers/i18n";
import { ModalHeader, useToast, YStack } from "@patch-careers/ui";
import { PrimaryAction, useEditorialPalette } from "@patch-careers/ui/editorial";
import { ChevronLeft } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import type { SectionLocales } from "../hooks/use-resume-sections";
import { useSectionItemForm } from "../hooks/use-section-item-form";
import type { RewriteProposal } from "../hooks/use-section-item-mutations";
import { sectionModalTitle } from "../lib/section-modal-title";
import type { MergedSection } from "../lib/section-visibility";
import { useEd } from "../lib/styles";
import type { SectionItem } from "../types";
import { AddLinkForm } from "./add-link-form";
import { OverlayModal } from "./primitives";
import {
  decisionsFromProposal,
  type FieldDecision,
  RewriteReviewModal,
} from "./rewrite-review-modal";
import { SectionCatalogList } from "./section-catalog-list";
import { SectionForm } from "./section-form";

/** Form pane — mounted per picked type (key={section.key}) so the RHF form
 *  and its cascades reset cleanly when the user re-picks. */
function AddItemForm({
  section,
  resumeId,
  locales,
  isPending,
  onSave,
  t,
}: {
  section: MergedSection;
  resumeId: string | undefined;
  locales: SectionLocales;
  isPending: boolean;
  onSave: (
    item: SectionItem,
    translation?: {
      locale: Locale;
      data: Record<string, string | string[]>;
      origin: "manual" | "diverged";
    },
  ) => Promise<string>;
  t: (key: string, params?: Record<string, string | number>) => string;
}): ReactElement {
  const ed = useEd();
  const toast = useToast();
  const fields = section.descriptor.fields ?? [];
  const {
    form,
    derivedKeys,
    hasCompany,
    isEducation,
    handleCompanyPick,
    handleCoursePick,
    handleRolePick,
    hasErrors,
  } = useSectionItemForm(fields);
  const [review, setReview] = useState<{
    item: SectionItem;
    proposal: RewriteProposal;
    decisions: FieldDecision[];
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const save = form.handleSubmit(async (values) => {
    const item: SectionItem = { content: { ...values } };
    if (!resumeId) {
      await onSave(item);
      return;
    }
    setBusy(true);
    try {
      let proposal: RewriteProposal;
      try {
        const response = await fetcher<RewriteProposal>({
          method: "POST",
          url: `/api/v1/resumes/${resumeId}/sections/${section.key}/items/preview-translation`,
          data: { locale: locales.content, edited: values },
        });
        proposal = response.data;
      } catch {
        // Preserve the resume's canonical language when a translation is unavailable.
        if (locales.content !== locales.canonical) {
          toast.show({ title: t("sections.rewrite.useOriginalLanguage"), intent: "warn" });
          return;
        }
        await onSave(item);
        toast.show({ title: t("sections.rewrite.skipped"), intent: "warn" });
        return;
      }
      const decisions = decisionsFromProposal(proposal.keys, proposal.current, proposal.proposal);
      if (decisions.length === 0) {
        await onSave(item);
        return;
      }
      setReview({ item, proposal, decisions });
    } finally {
      setBusy(false);
    }
  });

  const finishReview = async (keep: boolean): Promise<void> => {
    if (!review) return;
    setBusy(true);
    try {
      const data: Record<string, string | string[]> = {};
      for (const decision of review.decisions) {
        if (decision.accepted && !keep) data[decision.key] = decision.text;
      }
      if (locales.content === locales.canonical) {
        await onSave(review.item, {
          locale: review.proposal.locale as Locale,
          data,
          origin: keep || Object.keys(data).length === 0 ? "diverged" : "manual",
        });
      } else {
        const source: Record<string, string | string[]> = {};
        for (const key of review.proposal.keys) {
          const value = review.item.content?.[key];
          if (
            typeof value === "string" ||
            (Array.isArray(value) && value.every((part) => typeof part === "string"))
          ) {
            source[key] = value;
          }
        }
        await onSave(
          { ...review.item, content: { ...review.item.content, ...data } },
          { locale: locales.content, data: source, origin: "manual" },
        );
      }
      setReview(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ScrollView
        style={ed.flex}
        contentContainerStyle={ed.editorModalScroll}
        keyboardShouldPersistTaps="handled"
      >
        <SectionForm
          control={form.control}
          fields={fields}
          readOnlyKeys={derivedKeys}
          onCompanyPick={hasCompany ? handleCompanyPick : undefined}
          onCoursePick={isEducation ? handleCoursePick : undefined}
          onRolePick={hasCompany ? handleRolePick : undefined}
        />
      </ScrollView>
      <View style={ed.editorModalFooter}>
        <View />
        <PrimaryAction
          label={t("common.save")}
          onPress={() => void save()}
          disabled={hasErrors || isPending || busy}
        />
      </View>
      {review ? (
        <RewriteReviewModal
          visible
          localeLabel={review.proposal.locale === "en" ? "English" : "Português"}
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
                : null,
            )
          }
          onApply={() => void finishReview(false)}
          onKeep={() => void finishReview(true)}
          busy={busy}
          t={t}
        />
      ) : null}
    </>
  );
}

export function AddSectionFlowModal({
  visible,
  resumeId,
  locales,
  onClose,
  catalog,
  initialPick,
  onCreate,
  isPending,
  t,
}: {
  visible: boolean;
  resumeId: string | undefined;
  locales: SectionLocales;
  onClose: () => void;
  catalog: MergedSection[];
  /**
   * Skip the catalog step: the caller already knows which section is being
   * added to (a card's own "Adicionar experiência"). Mount the modal keyed by
   * this so the seed applies — it is only read on mount.
   */
  initialPick?: MergedSection | undefined;
  /** Persist a new item for the picked type; resolves once committed. */
  onCreate: (
    section: MergedSection,
    item: SectionItem,
    translation?: {
      locale: Locale;
      data: Record<string, string | string[]>;
      origin: "manual" | "diverged";
    },
  ) => Promise<string>;
  isPending: boolean;
  t: (key: string) => string;
}): ReactElement {
  const ed = useEd();
  const authTokens = useEditorialPalette();
  const [picked, setPicked] = useState<MergedSection | null>(initialPick ?? null);

  const close = (): void => {
    setPicked(initialPick ?? null);
    onClose();
  };

  const save = async (
    item: SectionItem,
    translation?: {
      locale: Locale;
      data: Record<string, string | string[]>;
      origin: "manual" | "diverged";
    },
  ): Promise<string> => {
    if (!picked) throw new Error("No section selected");
    const id = await onCreate(picked, item, translation);
    setPicked(initialPick ?? null);
    return id;
  };

  return (
    <OverlayModal visible={visible} onRequestClose={close}>
      <KeyboardAvoidingView
        style={ed.editorModalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Tap outside the card to dismiss */}
        <Pressable
          style={ed.editorModalBackdrop}
          accessibilityRole="button"
          accessibilityLabel={t("common.cancel")}
          onPress={close}
        />
        <View style={ed.editorModalCard}>
          <View style={ed.editorModalHeader}>
            <YStack flex={1}>
              <ModalHeader
                title={
                  picked ? sectionModalTitle(picked.key, picked.title) : t("sections.addToResume")
                }
                compactOnMobile
                closeLabel={t("common.cancel")}
                onClose={close}
                leadingAction={
                  picked && !initialPick ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t("common.back")}
                      hitSlop={12}
                      onPress={() => setPicked(null)}
                    >
                      <ChevronLeft size={22} color={authTokens.muted} />
                    </Pressable>
                  ) : null
                }
              />
            </YStack>
          </View>

          {picked ? (
            picked.key === "links_v1" ? (
              <AddLinkForm
                key={picked.key}
                isPending={isPending}
                onSave={async (item) => {
                  await save(item);
                }}
                t={t}
              />
            ) : (
              <AddItemForm
                key={picked.key}
                section={picked}
                resumeId={resumeId}
                locales={locales}
                isPending={isPending}
                onSave={save}
                t={t}
              />
            )
          ) : (
            <SectionCatalogList
              options={catalog.map((section) => ({
                id: section.key,
                title: section.title,
                description: section.atCapacity ? t("sections.atCapacity") : section.description,
                count: section.items.length,
                disabled: section.atCapacity,
              }))}
              onPick={(key) => {
                const section = catalog.find((entry) => entry.key === key);
                if (section) setPicked(section);
              }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </OverlayModal>
  );
}
