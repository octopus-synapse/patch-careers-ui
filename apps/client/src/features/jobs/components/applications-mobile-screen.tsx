import { Sheet, Text, useEditorialPalette, useToast, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, PillButton } from "@patch-careers/ui/editorial";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useLocalSearchParams } from "expo-router";
import { MoreHorizontal } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView } from "react-native";
import { AppLink } from "@/navigation/app-link";
import { useAppRouter } from "@/navigation/use-app-router";
import { useI18n } from "@/providers/i18n-provider";
import { type ApplicationBoardRow, useApplicationsBoard } from "../hooks/use-applications-board";
import { useJobsWorkspace } from "../hooks/use-jobs-workspace";
import { PREPARATION_STAGES, type PreparationStage } from "../lib/discovery";
import { JobLogo } from "./job-logo";

const isStage = (value: unknown): value is PreparationStage =>
  typeof value === "string" && PREPARATION_STAGES.includes(value as PreparationStage);

export function ApplicationsMobileScreen() {
  const palette = useEditorialPalette();
  const { t } = useI18n();
  const router = useAppRouter();
  const params = useLocalSearchParams<{ stage?: string }>();
  const stage = isStage(params.stage) ? params.stage : "draft";
  const workspace = useJobsWorkspace();
  const board = useApplicationsBoard(workspace.entries, workspace.isLoading);
  const toast = useToast();
  const bottomInset = useBottomTabBarHeight();
  const [moving, setMoving] = useState<ApplicationBoardRow | null>(null);
  const rows = board.rows.filter((row) => row.stage === stage);

  const move = async (next: PreparationStage) => {
    if (!moving?.job || workspace.pending) return;
    const job = moving.job;
    setMoving(null);
    try {
      await workspace.update(job, (entry) => ({ ...entry, job, stage: next }));
      router.setParams({ stage: next });
    } catch {
      toast.show({ title: t("jobs.desktop.saveError"), intent: "danger" });
    }
  };

  return (
    <YStack testID="applications-mobile" flex={1} backgroundColor={palette.bg}>
      <YStack paddingHorizontal={20} paddingTop={22} gap={18}>
        <Text
          accessibilityRole="header"
          fontFamily={editorialFonts.serif}
          fontSize={34}
          lineHeight={42}
          letterSpacing={-0.8}
          color={palette.ink}
        >
          {t("jobs.scope.applications")}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {PREPARATION_STAGES.map((value) => (
            <PillButton
              key={value}
              variant={stage === value ? "solid" : "ghost"}
              label={`${t(`jobs.desktop.stage.${value}`)} ${board.rows.filter((row) => row.stage === value).length}`}
              onPress={() => router.setParams({ stage: value })}
            />
          ))}
        </ScrollView>
      </YStack>
      {board.isLoading ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <ActivityIndicator color={palette.accent} />
        </YStack>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(row) => row.key}
          contentContainerStyle={{ padding: 20, paddingBottom: bottomInset + 28, gap: 12 }}
          renderItem={({ item }) => (
            <Pressable onLongPress={() => item.job && setMoving(item)} delayLongPress={400}>
              <YStack
                borderRadius={16}
                borderWidth={1}
                borderColor={palette.hairline}
                backgroundColor={palette.panel}
                padding={18}
                gap={13}
              >
                <XStack alignItems="center" gap={10}>
                  <JobLogo job={item.job ?? { company: item.company }} />
                  <Text fontSize={11} color={palette.muted} flex={1}>
                    {item.company}
                  </Text>
                  {item.job && !item.closed ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t("jobs.desktop.changeStage", { title: item.title })}
                      onPress={() => setMoving(item)}
                      hitSlop={8}
                    >
                      <MoreHorizontal size={20} color={palette.ink} />
                    </Pressable>
                  ) : null}
                </XStack>
                {item.id ? (
                  <AppLink href={{ pathname: "/job/[id]", params: { id: item.id } }}>
                    <Text fontSize={16} lineHeight={23} fontWeight="600" color={palette.ink}>
                      {item.title}
                    </Text>
                  </AppLink>
                ) : (
                  <Text fontSize={16} lineHeight={23} fontWeight="600" color={palette.ink}>
                    {item.title}
                  </Text>
                )}
                {item.documentCount ? (
                  <Text fontSize={11} color={palette.muted}>
                    {t("jobs.desktop.documentCount", { count: item.documentCount })}
                  </Text>
                ) : null}
              </YStack>
            </Pressable>
          )}
          ListEmptyComponent={
            <YStack paddingVertical={64} alignItems="center">
              <Text color={palette.muted}>{t("jobs.desktop.emptyStage")}</Text>
            </YStack>
          }
        />
      )}
      <Sheet
        open={Boolean(moving)}
        onOpenChange={(open) => !open && setMoving(null)}
        {...(moving ? { title: t("jobs.desktop.changeStage", { title: moving.title }) } : {})}
        closeLabel={t("common.cancel")}
      >
        <YStack gap={10} paddingBottom={12}>
          {PREPARATION_STAGES.map((value) => (
            <PillButton
              key={value}
              variant={moving?.stage === value ? "solid" : "ghost"}
              label={t(`jobs.desktop.stage.${value}`)}
              disabled={moving?.stage === value || workspace.pending}
              onPress={() => void move(value)}
            />
          ))}
        </YStack>
      </Sheet>
    </YStack>
  );
}
