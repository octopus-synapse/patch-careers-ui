/**
 * `<ScoreExplainSheet>` — the reusable "como calculamos" sheet shown behind
 * an info affordance next to any score (quality / match / style). Explains
 * what the score measures and how its parts combine. Pure + presentational:
 * all copy arrives already-localised from the caller (this package stays
 * i18n-free); it just lays out an optional headline ring + a list of
 * explained sections + an optional footnote.
 */

import type { ReactNode } from "react";
import { TStack } from "../internal/tamagui-shim";
import { Divider } from "../primitives/divider";
import { Text } from "../primitives/text";
import { ScoreRing } from "./score-ring";
import { Sheet } from "./sheet";

export type ScoreExplainSection = {
  label: string;
  body: string;
  /** Optional trailing value (e.g. a sub-score or weight "60%"). */
  trailing?: ReactNode;
};

export type ScoreExplainSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  closeLabel?: string;
  /** When provided, renders a headline ring at the top. */
  score?: number;
  grade?: boolean;
  sections: ScoreExplainSection[];
  footnote?: string;
};

export function ScoreExplainSheet({
  open,
  onOpenChange,
  title,
  closeLabel,
  score,
  grade = false,
  sections,
  footnote,
}: ScoreExplainSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      presentation="card"
      {...(closeLabel ? { closeLabel } : {})}
    >
      <TStack gap={18}>
        {score != null ? (
          <TStack alignItems="center" paddingVertical={4}>
            <ScoreRing score={score} size={84} strokeWidth={6} grade={grade} animate={false} />
          </TStack>
        ) : null}

        <TStack gap={16}>
          {sections.map((s) => (
            <TStack key={s.label} gap={4}>
              <TStack
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                gap={8}
              >
                <Text preset="label">{s.label}</Text>
                {s.trailing != null ? <Text preset="label">{s.trailing}</Text> : null}
              </TStack>
              <Text preset="body">{s.body}</Text>
            </TStack>
          ))}
        </TStack>

        {footnote ? (
          <>
            <Divider />
            <Text preset="caption">{footnote}</Text>
          </>
        ) : null}
      </TStack>
    </Sheet>
  );
}
