import { Text, useEditorialPalette, useToast, YStack } from "@patch-careers/ui";
import { editorialFonts } from "@patch-careers/ui/editorial";
import Head from "expo-router/head";
import { ScrollView } from "react-native";
import { useIsDesktopWeb } from "@/hooks/use-desktop-web";
import { useNavBarInset } from "@/hooks/use-nav-bar-inset";
import { useI18n } from "@/providers/i18n-provider";
import { useJobsWorkspace } from "../hooks/use-jobs-workspace";
import { ApplicationsBoard } from "./applications-board.web";
import { JobsScreen } from "./jobs-screen";

export function ApplicationsHomeScreen() {
  const isDesktopWeb = useIsDesktopWeb();
  return isDesktopWeb ? <DesktopApplications /> : <JobsScreen initialScope="applications" />;
}

function DesktopApplications() {
  const palette = useEditorialPalette();
  const inset = useNavBarInset();
  const toast = useToast();
  const { t } = useI18n();
  const workspace = useJobsWorkspace();

  return (
    <>
      <Head>
        <title>{t("jobs.scope.applications")} | Patch Careers</title>
      </Head>
      <ScrollView
        testID="applications-desktop"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: inset + 35,
          paddingBottom: 56,
          backgroundColor: palette.bg,
          flexGrow: 1,
        }}
      >
        <YStack width="100%" maxWidth={1280} paddingHorizontal={40} alignSelf="center" gap={27}>
          <Text
            accessibilityRole="header"
            fontFamily={editorialFonts.serif}
            fontWeight="400"
            fontSize={42}
            lineHeight={50}
            letterSpacing={-1.2}
            color={palette.ink}
          >
            {t("jobs.scope.applications")}
          </Text>
          <ApplicationsBoard
            entries={workspace.entries}
            workspaceLoading={workspace.isLoading}
            onChange={async (job, stage) => {
              try {
                await workspace.update(job, (entry) => ({ ...entry, job, stage }));
              } catch {
                toast.show({ title: t("jobs.desktop.saveError"), intent: "danger" });
              }
            }}
          />
        </YStack>
      </ScrollView>
    </>
  );
}
