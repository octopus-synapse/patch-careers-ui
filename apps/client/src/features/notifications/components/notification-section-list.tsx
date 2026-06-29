/**
 * Grouped inbox list — a SectionList over `groupByDate` (Hoje / Esta semana /
 * Antes) with small-caps editorial section headers, hairline row separators and
 * bottom padding that clears the floating tab bar.
 */

import { Divider, Text } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import type { ReactElement } from "react";
import { SectionList, View } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { groupByDate } from "../lib/date-groups";
import type { NotificationItem } from "../types";
import { NotificationRow } from "./notification-row";

function RowSeparator(): ReactElement {
  const palette = useEditorialPalette();
  return <Divider color={palette.hairline} marginLeft={76} />;
}

export function NotificationSectionList({
  items,
  now,
  onPressItem,
}: {
  items: readonly NotificationItem[];
  now: number;
  onPressItem: (item: NotificationItem) => void;
}): ReactElement {
  const palette = useEditorialPalette();
  const tabBarHeight = useBottomTabBarHeight();
  const { t } = useI18n();
  const sections = groupByDate(items, now);

  return (
    <SectionList<NotificationItem, { titleKey: string }>
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <NotificationRow item={item} now={now} onPress={onPressItem} />}
      renderSectionHeader={({ section }) => (
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 8,
            backgroundColor: palette.bg,
          }}
        >
          <Text
            preset="caption"
            fontSize={11}
            letterSpacing={1}
            textTransform="uppercase"
            color={palette.subtle}
          >
            {t(section.titleKey)}
          </Text>
        </View>
      )}
      ItemSeparatorComponent={RowSeparator}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}
    />
  );
}
