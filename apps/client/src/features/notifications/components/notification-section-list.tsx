/**
 * Grouped inbox list — a SectionList over `groupByDate` (Hoje / Esta semana /
 * Antes) with small-caps editorial section headers, hairline row separators and
 * bottom padding that clears the floating tab bar (0 where there is none —
 * the stacked `/notifications` screen sits outside the tab navigator).
 */

import { Divider, Text } from "@patch-careers/ui";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { type ReactElement, useContext } from "react";
import { SectionList, View } from "react-native";
import { useNavBarInset } from "@/hooks/use-nav-bar-inset";
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
  // Read the context rather than `useBottomTabBarHeight()`, which THROWS when
  // there is no tab bar above it: this list also renders on `/notifications`,
  // a root Stack screen that is a sibling of the tab navigator, not a child.
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const navInset = useNavBarInset();
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
      contentContainerStyle={{ paddingTop: navInset, paddingBottom: tabBarHeight + 16 }}
    />
  );
}
