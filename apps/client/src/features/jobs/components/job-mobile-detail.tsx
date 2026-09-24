import { Sheet, Text, useEditorialPalette, useToast, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, PillButton, PrimaryAction } from "@patch-careers/ui/editorial";
import * as WebBrowser from "expo-web-browser";
import { Bookmark, ChevronLeft, FileText, Mail } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MatchBreakdown } from "@/features/match";
import { useAppRouter } from "@/navigation/use-app-router";
import { useI18n } from "@/providers/i18n-provider";
import { useJobOpportunity } from "../hooks/use-job-opportunity";
import { useJobsWorkspace } from "../hooks/use-jobs-workspace";
import { useReportApplied } from "../hooks/use-report-applied";
import { useToggleSaveJob } from "../hooks/use-save-job";
import type { PreparationDocument } from "../lib/discovery";
import { jobMetaLine, toTitleCase } from "../lib/helpers";
import { DidYouApplySheet } from "./did-you-apply-sheet";
import { JobComposer } from "./job-composer";
import { JobLogo } from "./job-logo";

export function JobMobileDetail({ id }: { id: string }) {
  const palette = useEditorialPalette();
  const insets = useSafeAreaInsets();
  const { t, locale } = useI18n();
  const router = useAppRouter();
  const toast = useToast();
  const workspace = useJobsWorkspace();
  const detail = useJobOpportunity(id, workspace.entries, workspace.isLoading);
  const job = detail.job;
  const entry = workspace.entries.find((item) => item.job.externalId === job?.externalId);
  const save = useToggleSaveJob();
  const report = useReportApplied();
  const viewed = useRef(false);
  const [flow, setFlow] = useState<{
    kind: "resume" | "letter";
    document?: PreparationDocument;
    key: number;
  } | null>(null);
  const [didApply, setDidApply] = useState(false);

  useEffect(() => {
    if (!job || workspace.isLoading || viewed.current) return;
    viewed.current = true;
    void workspace
      .update(job, (previous) => ({ ...previous, job, viewedAt: new Date().toISOString() }))
      .catch(() => toast.show({ title: t("jobs.desktop.saveError"), intent: "danger" }));
  }, [job, workspace.isLoading, workspace.update, toast, t]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/jobs"));
  const prepare = (kind: "resume" | "letter", document?: PreparationDocument) => {
    const selected = document ?? entry?.documents.findLast((item) => item.kind === kind);
    setFlow({ kind, ...(selected ? { document: selected } : {}), key: Date.now() });
  };
  const openApplication = async () => {
    if (!job?.applyUrl) return;
    await WebBrowser.openBrowserAsync(job.applyUrl);
    setDidApply(true);
  };
  const answer = async (yes: boolean) => {
    if (!job) return;
    try {
      if (job.source !== "imported") await report.report(job, yes);
      if (yes)
        await workspace.update(job, (previous) => ({
          ...previous,
          stage: previous.stage === "interview" ? "interview" : "sent",
        }));
      setDidApply(false);
    } catch {
      toast.show({ title: t("jobs.desktop.saveError"), intent: "danger" });
    }
  };

  if (detail.isLoading)
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor={palette.bg}>
        <ActivityIndicator color={palette.accent} />
      </YStack>
    );

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: palette.bg }}>
      <XStack height={48} paddingHorizontal={14} alignItems="center" justifyContent="space-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("jobs.detail.back")}
          onPress={goBack}
          hitSlop={8}
        >
          <ChevronLeft size={25} color={palette.ink} />
        </Pressable>
        {job && job.source !== "imported" ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(job.isSaved ? "jobs.save.remove" : "jobs.save.add")}
            disabled={save.pendingId === job.externalId}
            onPress={() => save.toggle(job)}
            hitSlop={8}
          >
            <Bookmark size={22} color={palette.ink} fill={job.isSaved ? palette.ink : "none"} />
          </Pressable>
        ) : null}
      </XStack>
      {!job ? (
        <YStack flex={1} alignItems="center" justifyContent="center" padding={30} gap={16}>
          <Text
            fontFamily={editorialFonts.serif}
            fontSize={26}
            color={palette.ink}
            textAlign="center"
          >
            {t("jobs.detail.notFound.title")}
          </Text>
          <Text color={palette.muted} textAlign="center">
            {t("jobs.detail.notFound.description")}
          </Text>
          <PillButton
            label={t("jobs.detail.notFound.cta")}
            onPress={() => router.replace("/jobs")}
          />
        </YStack>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 190 }}
          >
            <XStack alignItems="center" gap={12} marginBottom={18}>
              <JobLogo job={job} hero />
              <YStack flex={1} gap={4}>
                <Text fontSize={15} fontWeight="600" color={palette.ink}>
                  {job.company}
                </Text>
                <Text fontSize={12} color={palette.muted}>
                  {jobMetaLine(job, locale)}
                </Text>
              </YStack>
            </XStack>
            <Text
              accessibilityRole="header"
              fontFamily={editorialFonts.serif}
              fontSize={32}
              lineHeight={40}
              letterSpacing={-0.7}
              color={palette.ink}
            >
              {toTitleCase(job.title)}
            </Text>
            <YStack height={1} backgroundColor={palette.hairlineStrong} marginVertical={26} />
            <Text fontSize={14} fontWeight="600" color={palette.ink} marginBottom={14}>
              {t("jobs.desktop.about")}
            </Text>
            <Text fontSize={15} lineHeight={27} color={palette.body} selectable>
              {job.description ?? t("jobs.detail.noDescription")}
            </Text>
            <YStack marginTop={28} padding={20} borderRadius={16} backgroundColor={palette.panel}>
              <MatchBreakdown
                job={{
                  id: job.id,
                  title: job.title,
                  company: job.company,
                  description: job.description,
                }}
              />
            </YStack>
            {entry?.documents.length ? (
              <YStack marginTop={22} gap={10}>
                <Text fontSize={12} fontWeight="600" color={palette.ink}>
                  {t("jobs.desktop.documents")}
                </Text>
                {entry.documents.map((document) => (
                  <PillButton
                    key={`${document.versionId}-${document.kind}`}
                    variant="ghost"
                    label={t(`jobs.desktop.${document.kind}`)}
                    onPress={() => prepare(document.kind, document)}
                  />
                ))}
              </YStack>
            ) : null}
          </ScrollView>
          <YStack
            position="absolute"
            left={0}
            right={0}
            bottom={0}
            paddingHorizontal={20}
            paddingTop={12}
            paddingBottom={insets.bottom + 12}
            gap={10}
            backgroundColor={palette.bg}
            borderTopWidth={1}
            borderTopColor={palette.hairline}
          >
            <XStack gap={8}>
              <YStack flex={1}>
                <PillButton
                  label={t("jobs.desktop.resume")}
                  onPress={() => prepare("resume")}
                  renderIcon={({ color }) => <FileText size={15} color={color} />}
                />
              </YStack>
              <YStack flex={1}>
                <PillButton
                  label={t("jobs.desktop.letter")}
                  onPress={() => prepare("letter")}
                  renderIcon={({ color }) => <Mail size={15} color={color} />}
                />
              </YStack>
            </XStack>
            <PrimaryAction
              label={t("jobs.detail.apply")}
              disabled={!job.applyUrl}
              onPress={() => void openApplication()}
            />
          </YStack>
        </>
      )}
      <Sheet
        open={Boolean(flow)}
        onOpenChange={(open) => !open && setFlow(null)}
        {...(flow ? { title: t(`jobs.desktop.${flow.kind}`) } : {})}
        closeLabel={t("jobs.desktop.closePreparation")}
        fillHeight
      >
        {flow && job ? (
          <ScrollView keyboardShouldPersistTaps="handled">
            <JobComposer
              key={flow.key}
              initialJob={job}
              initialKind={flow.kind}
              initialDocument={flow.document}
              inModal
              compact
            />
          </ScrollView>
        ) : null}
      </Sheet>
      <DidYouApplySheet
        open={didApply}
        onOpenChange={setDidApply}
        onAnswer={(yes) => void answer(yes)}
        pending={report.pending || workspace.pending}
      />
    </View>
  );
}
