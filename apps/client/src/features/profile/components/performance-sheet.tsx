/**
 * <PerformanceSheet> — the Desempenho hub presented as a card sheet from the
 * profile's score hero (it absorbed the old "Desempenho" sub-tab). Card
 * presentation on native AND web (the proven pattern for tall sheet content),
 * with its own scroll.
 */
import { Sheet } from "@patch-careers/ui";
import type { ReactElement } from "react";
import { ScrollView } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { PerformanceTab } from "./performance-tab";

export function PerformanceSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): ReactElement {
  const { t } = useI18n();
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("profile.performance.title")}
      presentation="card"
      fillHeight
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <PerformanceTab onDismiss={() => onOpenChange(false)} />
      </ScrollView>
    </Sheet>
  );
}
