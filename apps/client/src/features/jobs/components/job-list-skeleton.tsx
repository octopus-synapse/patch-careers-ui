/**
 * Loading placeholder shaped like the job cards (kicker · title · meta),
 * so the list doesn't jump when real rows land.
 */

import { Skeleton, YStack } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { View } from "react-native";
import { useI18n } from "@/providers/i18n-provider";

const ROW_KEYS = ["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"] as const;

export function JobListSkeleton(): ReactElement {
  const editorialPalette = useEditorialPalette();
  const { t } = useI18n();
  return (
    <View accessibilityLabel={t("jobs.loading")}>
      {ROW_KEYS.map((key) => (
        <View key={key}>
          <YStack gap={10} paddingHorizontal={20} paddingVertical={24}>
            <Skeleton width={96} height={11} />
            <Skeleton width="82%" height={19} />
            <Skeleton width="58%" height={12} />
          </YStack>
          <View style={{ height: 1, marginLeft: 20, backgroundColor: editorialPalette.hairline }} />
        </View>
      ))}
    </View>
  );
}
