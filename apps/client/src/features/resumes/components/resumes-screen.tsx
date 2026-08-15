/**
 * Currículos tab screen — the resume list promoted from a Profile sub-tab to
 * its own bottom-bar tab (under the global AppHeader). Serif page title +
 * the existing list body (master first, slots, wizard); pull-to-refresh
 * re-pulls the resume list the same way the Profile tab does.
 */
import { getV1ResumesQueryKey } from "@patch-careers/api-client";
import { useEditorialPalette } from "@patch-careers/ui/editorial";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQueryClient } from "@tanstack/react-query";
import { type ReactElement, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { MarketPulseCard, type RecommendedJob } from "@/features/match";
import { useI18n } from "@/providers/i18n-provider";
import { useRz } from "../lib/styles";
import { ResumeListTab } from "./resume-list-tab";

export function ResumesScreen({
  onOpenJob,
}: {
  /** Deep-link a market-pulse row to the job detail — wired by the route
   * shim, since seeding the jobs cache is the app layer's glue. */
  onOpenJob: (job: RecommendedJob) => void;
}): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const rz = useRz();
  // Bar floats over content; pad the scroll so the last items clear it.
  const tabBarHeight = useBottomTabBarHeight();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: getV1ResumesQueryKey() });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={rz.screenRoot}>
      <ScrollView
        contentContainerStyle={[rz.screenScroll, { paddingBottom: tabBarHeight + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={palette.muted}
          />
        }
      >
        <Text accessibilityRole="header" style={rz.screenTitle}>
          {t("tabs.resumes")}
        </Text>
        <MarketPulseCard onOpenJob={onOpenJob} />
        <ResumeListTab />
      </ScrollView>
    </View>
  );
}
