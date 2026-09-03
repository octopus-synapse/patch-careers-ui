/**
 * The other side of a hand edit (backend ADR-003, decision 11).
 *
 * The person edited an item in one language. Before it is saved, this shows
 * what the OTHER language's copy would become — one row per translatable
 * field, the machine's rewrite diffed against what the copy says today — and
 * lets them accept, refuse, or rewrite each change. Refusing keeps that copy
 * as it is and marks it "kept on purpose" so the worker never overwrites it.
 *
 * Pure presentation: the caller owns the proposal, the decision state and
 * what happens on apply.
 */

import { PrimaryAction, useEditorialPalette } from "@patch-careers/ui/editorial";
import { X } from "lucide-react-native";
import type { ReactElement } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useEd } from "../lib/styles";
import { diffWords, fieldText } from "../lib/text-diff";
import type { SectionField } from "../types";
import { GhostButton, OverlayModal } from "./primitives";

export type FieldDecision = {
  /** Field key in the item content. */
  key: string;
  /** What the other-language copy says today. */
  current: string;
  /** The machine's proposal after the edit. */
  proposal: string;
  /** What will be written: the proposal, or the person's own rewrite of it. */
  text: string;
  accepted: boolean;
};

export function RewriteReviewModal({
  visible,
  localeLabel,
  fields,
  decisions,
  onChangeDecision,
  onApply,
  onKeep,
  busy,
  t,
}: {
  visible: boolean;
  /** Human name of the language the proposal is for ("Português"). */
  localeLabel: string;
  fields: SectionField[];
  decisions: FieldDecision[];
  onChangeDecision: (key: string, patch: Partial<FieldDecision>) => void;
  /** Apply the accepted (possibly edited) changes; refused fields keep their current text. */
  onApply: () => void;
  /** Keep the other copy exactly as it is. */
  onKeep: () => void;
  busy: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}): ReactElement {
  const ed = useEd();
  const palette = useEditorialPalette();
  const labelFor = (key: string): string => fields.find((f) => f.key === key)?.label ?? key;

  return (
    <OverlayModal visible={visible} onRequestClose={onKeep}>
      <View style={ed.editorModalOverlay}>
        <Pressable
          style={ed.editorModalBackdrop}
          accessibilityRole="button"
          accessibilityLabel={t("sections.rewrite.keep")}
          onPress={onKeep}
        />
        <View style={ed.editorModalCard}>
          <View style={ed.editorModalHeader}>
            <Text style={ed.editorModalTitle}>
              {t("sections.rewrite.title", { locale: localeLabel })}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("sections.rewrite.keep")}
              hitSlop={12}
              onPress={onKeep}
            >
              <X size={22} color={palette.muted} />
            </Pressable>
          </View>
          <ScrollView style={ed.flex} contentContainerStyle={ed.editorModalScroll}>
            <Text style={ed.detailDescription}>{t("sections.rewrite.intro")}</Text>
            {decisions.map((decision) => (
              <View key={decision.key} style={ed.rewriteField}>
                <View style={ed.rewriteFieldHead}>
                  <Text style={ed.detailOrg}>{labelFor(decision.key)}</Text>
                  <Pressable
                    accessibilityRole="switch"
                    aria-checked={decision.accepted}
                    onPress={() => onChangeDecision(decision.key, { accepted: !decision.accepted })}
                    style={[ed.rewriteToggle, decision.accepted && ed.rewriteToggleOn]}
                  >
                    <Text
                      style={[ed.rewriteToggleLabel, decision.accepted && ed.rewriteToggleLabelOn]}
                    >
                      {decision.accepted
                        ? t("sections.rewrite.accept")
                        : t("sections.rewrite.refuse")}
                    </Text>
                  </Pressable>
                </View>
                <Text style={ed.rewriteDiff}>
                  {diffWords(decision.current, decision.proposal).map((segment, index) => (
                    <Text
                      // biome-ignore lint/suspicious/noArrayIndexKey: segments have no identity beyond position
                      key={index}
                      style={
                        segment.kind === "added"
                          ? ed.rewriteAdded
                          : segment.kind === "removed"
                            ? ed.rewriteRemoved
                            : undefined
                      }
                    >
                      {segment.text}
                    </Text>
                  ))}
                </Text>
                {decision.accepted ? (
                  <TextInput
                    style={ed.rewriteInput}
                    multiline
                    value={decision.text}
                    onChangeText={(text) => onChangeDecision(decision.key, { text })}
                    accessibilityLabel={t("sections.rewrite.editA11y", {
                      field: labelFor(decision.key),
                    })}
                  />
                ) : null}
              </View>
            ))}
          </ScrollView>
          <View style={ed.editorModalFooter}>
            <GhostButton label={t("sections.rewrite.keep")} onPress={onKeep} disabled={busy} />
            <PrimaryAction label={t("sections.rewrite.apply")} onPress={onApply} disabled={busy} />
          </View>
        </View>
      </View>
    </OverlayModal>
  );
}

/** Build the initial decisions from a proposal: every changed field, accepted, text = proposal. */
export function decisionsFromProposal(
  keys: readonly string[],
  current: Record<string, unknown>,
  proposal: Record<string, unknown>,
): FieldDecision[] {
  return keys
    .map((key) => ({ key, current: fieldText(current[key]), proposal: fieldText(proposal[key]) }))
    .filter((d) => d.proposal.length > 0 && d.current !== d.proposal)
    .map((d) => ({ ...d, text: d.proposal, accepted: true }));
}
