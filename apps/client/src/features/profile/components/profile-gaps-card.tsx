/**
 * <ProfileGapsCard> — "Falta no seu perfil": the section types with no items
 * yet, as a short list you can add to from the rail.
 *
 * The order is the backend's `recommendedPosition` — skills and certifications
 * weigh more in an ATS read than a hackathon, and that judgement belongs on the
 * server that scores the resume, not here.
 *
 * It has to be sorted explicitly: `GET .../sections/types` returns the catalog
 * ALPHABETICALLY BY KEY, so taking the first four as they arrive led with
 * Conquistas · Prêmios · Bug Bounties · Certificações (positions 16, 7, 12, 5)
 * while calling them the ones worth doing next.
 *
 * Four rows, because the point is "do the next one", not "here is the whole
 * catalogue"; the rest are one click away.
 *
 * `atCapacity` is honoured even here. A non-repeatable section with its single
 * item deleted is empty AND addable, but one already at its cap must not offer
 * a "+" that opens a form the save would reject.
 */

import { YStack } from "@patch-careers/ui";
import { PillButton } from "@patch-careers/ui/editorial";
import { ArrowRight, Plus } from "lucide-react-native";
import { type ComponentProps, type ReactElement, useState } from "react";
import { Text, View } from "react-native";
import {
  AddSectionFlowModal,
  type MergedSection,
  type SectionLocales,
  useResumeSections,
  useSectionItemMutations,
} from "@/features/sections";
import { useI18n } from "@/providers/i18n-provider";
import { usePf } from "../lib/styles";

/** How many gaps the card names before deferring to the full catalog. */
const VISIBLE_GAPS = 4;

function GapRow({
  section,
  isFirst,
  onAdd,
}: {
  section: MergedSection;
  isFirst: boolean;
  onAdd: () => void;
}): ReactElement {
  const { t } = useI18n();
  const pf = usePf();
  const disabled = section.atCapacity;

  return (
    <View style={[pf.gapsItem, isFirst && pf.gapsItemFirst]}>
      <Text style={pf.gapsItemLabel}>{section.title}</Text>
      <PillButton
        label={t("profile.gaps.addA11y", { label: section.title })}
        onPress={onAdd}
        disabled={disabled}
        variant="ghost"
        iconOnly
        renderIcon={({ color, size }) => <Plus size={size} color={color} strokeWidth={2.4} />}
      />
    </View>
  );
}

export function ProfileGapsCard({
  resumeId,
  locales,
}: {
  resumeId: string | undefined;
  /**
   * The rows name sections in the app's language (chrome), whatever version
   * of the content the rail is showing — ADR-0011. Before this the card took
   * the content locale and came out bilingual next to its own `t()` title.
   */
  locales: SectionLocales;
}): ReactElement | null {
  const { t } = useI18n();
  const pf = usePf();
  const { catalog } = useResumeSections(resumeId, locales);
  const { createFor, isPending } = useSectionItemMutations(resumeId);
  const [addOpen, setAddOpen] = useState(false);
  const [picked, setPicked] = useState<MergedSection | null>(null);

  const gaps = catalog
    .filter((section) => section.items.length === 0)
    // A section without a declared position sorts last rather than first.
    .sort(
      (a, b) =>
        (a.recommendedPosition ?? Number.MAX_SAFE_INTEGER) -
        (b.recommendedPosition ?? Number.MAX_SAFE_INTEGER),
    );
  if (gaps.length === 0) return null;

  const create: ComponentProps<typeof AddSectionFlowModal>["onCreate"] = async (
    section,
    item,
    translation,
  ) => {
    const id = await createFor(section.key, item, translation);
    setAddOpen(false);
    setPicked(null);
    return id;
  };

  const openFor = (section: MergedSection | null): void => {
    setPicked(section);
    setAddOpen(true);
  };

  return (
    <View style={pf.railCard}>
      <Text style={pf.railCardTitle} accessibilityRole="header">
        {t("profile.gaps.title")}
      </Text>

      <View style={pf.gapsList}>
        {gaps.slice(0, VISIBLE_GAPS).map((section, index) => (
          <GapRow
            key={section.key}
            section={section}
            isFirst={index === 0}
            onAdd={() => openFor(section)}
          />
        ))}
      </View>

      {gaps.length > VISIBLE_GAPS ? (
        <YStack marginTop={16}>
          <PillButton
            label={t("profile.gaps.seeAll", { count: gaps.length })}
            onPress={() => openFor(null)}
            variant="ghost"
            fullWidth
            iconPosition="end"
            renderIcon={({ color, size }) => (
              <ArrowRight size={size} color={color} strokeWidth={2.2} />
            )}
          />
        </YStack>
      ) : null}

      {/* Keyed by the pick so the modal's `initialPick` seed (read on mount)
          applies when the user goes straight into one section's form. */}
      <AddSectionFlowModal
        resumeId={resumeId}
        locales={locales}
        key={picked?.key ?? "catalog"}
        visible={addOpen}
        onClose={() => {
          setAddOpen(false);
          setPicked(null);
        }}
        catalog={catalog}
        initialPick={picked ?? undefined}
        onCreate={create}
        isPending={isPending}
        t={t}
      />
    </View>
  );
}
