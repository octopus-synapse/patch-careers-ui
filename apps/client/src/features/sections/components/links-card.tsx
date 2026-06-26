/**
 * Renders the links_v1 section's items as rows: a brand glyph / logo.dev mark
 * (by LinkKind), the link's label, and the bare URL as meta. Same tap-to-edit /
 * swipe-to-delete gesture as every other section item.
 */
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { View } from "react-native";
import { domainToTitle, prettyLink } from "../lib/link-title";
import { type LinkKind, LinkLeading } from "../lib/link-visual";
import type { MergedSection } from "../lib/section-visibility";
import { useEd } from "../lib/styles";
import type { SectionItem } from "../types";
import { SwipeableItemRow } from "./swipeable-item-row";

type LinkContent = { kind?: string; url?: string; label?: string; domain?: string | null };

function linkLabel(content: LinkContent): string {
  const url = content.url ?? "";
  return content.label?.trim() || domainToTitle(content.domain) || prettyLink(url) || url;
}

export function LinksCard({
  section,
  onEditItem,
  onDeleteItem,
  deleteLabel,
}: {
  section: MergedSection;
  onEditItem: (item: SectionItem, index: number) => void;
  onDeleteItem: (item: SectionItem, index: number) => void;
  deleteLabel: string;
}): ReactElement | null {
  const ed = useEd();
  const palette = useEditorialPalette();
  if (section.items.length === 0) return null;
  return (
    <View style={ed.list}>
      {section.items.map((item, index) => {
        const content = (item.content ?? {}) as LinkContent;
        const kind = (content.kind ?? "CUSTOM") as LinkKind;
        return (
          <SwipeableItemRow
            key={item.id ?? `${index}-${content.url ?? ""}`}
            item={item}
            onEdit={() => onEditItem(item, index)}
            onDelete={() => onDeleteItem(item, index)}
            deleteLabel={deleteLabel}
            leading={<LinkLeading kind={kind} domain={content.domain} color={palette.muted} />}
            primaryOverride={linkLabel(content)}
            metaOverride={content.url ? prettyLink(content.url) : undefined}
          />
        );
      })}
    </View>
  );
}
