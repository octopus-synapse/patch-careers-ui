/**
 * `<SectionAddPicker>` — the review hub's "Adicionar seção" sheet. Lists the
 * optional sections the backend exposes via `availableExtras` (filtered to
 * those not yet activated) and reports the chosen extra id back so the hub
 * can activate it (`POST /v1/onboarding/session/extras`) and open its
 * editor inline.
 *
 * Thin wrapper over the shared `<ListPicker>` — preserves this feature's
 * `SectionAddOption` API while the list UI lives in `@patch-careers/ui`.
 */

import { ListPicker, Text } from "@patch-careers/ui";
import type { ReactElement } from "react";

export interface SectionAddOption {
  id: string;
  label: string;
  icon?: string | undefined;
}

export interface SectionAddPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: SectionAddOption[];
  onPick: (id: string) => void;
  title?: string;
  emptyLabel?: string;
}

export function SectionAddPicker({
  open,
  onOpenChange,
  options,
  onPick,
  title,
  emptyLabel,
}: SectionAddPickerProps): ReactElement {
  return (
    <ListPicker
      open={open}
      onOpenChange={onOpenChange}
      options={options.map((o) => ({
        id: o.id,
        label: o.label,
        ...(o.icon ? { icon: <Text>{o.icon}</Text> } : {}),
      }))}
      onPick={onPick}
      title={title ?? "Adicionar seção"}
      emptyLabel={emptyLabel ?? "Você já adicionou todas as seções disponíveis."}
      closeLabel="Fechar"
    />
  );
}
