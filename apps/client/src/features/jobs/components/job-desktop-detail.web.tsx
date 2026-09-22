import { useAppRouter } from "@/navigation/use-app-router";
import { editorialPalette } from "@patch-careers/tokens";
import { Sheet, Text, useEditorialPalette, useToast, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, PillButton } from "@patch-careers/ui/editorial";

import { Bookmark, ChevronLeft, ExternalLink, FileText, Mail } from "lucide-react-native";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView } from "react-native";
import { MatchBreakdown } from "@/features/match";
import { useNavBarInset } from "@/hooks/use-nav-bar-inset";
import { useI18n } from "@/providers/i18n-provider";
import { useJobOpportunity } from "../hooks/use-job-opportunity";
import { useJobsWorkspace } from "../hooks/use-jobs-workspace";
import { useReportApplied } from "../hooks/use-report-applied";
import { useToggleSaveJob } from "../hooks/use-save-job";
import { type PreparationDocument, safeJobUrl } from "../lib/discovery";
import { jobMetaLine, toTitleCase } from "../lib/helpers";
import { DidYouApplySheet } from "./did-you-apply-sheet";
import { JobComposer } from "./job-composer.web";
import { JobLogo } from "./job-logo.web";
import { JobsEmpty } from "./job-shelf.web";

export function JobDesktopDetail({ id }: { id: string }) {
  const palette = useEditorialPalette();
  const { t, locale } = useI18n();
  const inset = useNavBarInset();
  const router = useAppRouter();
  const toast = useToast();
  const workspace = useJobsWorkspace();
  const detail = useJobOpportunity(id, workspace.entries, workspace.isLoading);
  const job = detail.job;
  const applicationUrl = job ? safeJobUrl(job.applyUrl) : null;
  const save = useToggleSaveJob();
  const report = useReportApplied();
  const entry = workspace.entries.find((item) => item.job.externalId === job?.externalId);
  const [flow, setFlow] = useState<{
    kind: "resume" | "letter";
    document?: PreparationDocument | undefined;
    key: number;
  } | null>(null);
  const [didApply, setDidApply] = useState(false);
  const [returnPending, setReturnPending] = useState(false);
  const viewed = useRef(false);
  useEffect(() => {
    if (!job || workspace.isLoading || viewed.current) return;
    viewed.current = true;
    void workspace
      .update(job, (previous) => ({ ...previous, job, viewedAt: new Date().toISOString() }))
      .catch(() => toast.show({ title: t("jobs.desktop.saveError"), intent: "danger" }));
  }, [job, workspace.isLoading, workspace.update, toast, t]);
  useEffect(() => {
    if (!returnPending) return;
    const onReturn = () => {
      setReturnPending(false);
      setDidApply(true);
    };
    window.addEventListener("focus", onReturn, { once: true });
    return () => window.removeEventListener("focus", onReturn);
  }, [returnPending]);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/jobs"));
  const openApplication = (url: string) => {
    setReturnPending(true);
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const prepare = (kind: "resume" | "letter", document?: PreparationDocument) => {
    setFlow({
      kind,
      document: document ?? entry?.documents.findLast((item) => item.kind === kind),
      key: Date.now(),
    });
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
  return (
    <ScrollView
      testID="job-desktop-detail"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: inset + 30,
        paddingBottom: 70,
        backgroundColor: palette.bg,
        flexGrow: 1,
      }}
    >
      <YStack width="100%" maxWidth={1180} paddingHorizontal={40} alignSelf="center" gap={34}>
        <PillButton
          variant="ghost"
          label={t("jobs.desktop.backJobs")}
          onPress={goBack}
          renderIcon={({ color }) => <ChevronLeft size={15} color={color} />}
        />
        <YStack flex={1} minWidth={0}>
          {detail.isLoading ? (
            <ActivityIndicator accessibilityLabel={t("jobs.loading")} color={palette.accent} />
          ) : !job ? (
            <JobsEmpty
              title={t("jobs.detail.notFound.title")}
              description={t("jobs.detail.notFound.description")}
              action={
                <PillButton
                  label={t("jobs.detail.notFound.cta")}
                  onPress={() => router.replace("/jobs")}
                />
              }
            />
          ) : (
            <>
              <YStack
                gap={24}
                paddingBottom={40}
                borderBottomWidth={1}
                borderBottomColor={palette.hairlineStrong}
              >
                <XStack alignItems="center" gap={14}>
                  <JobLogo job={job} hero />
                  <YStack minWidth={0} gap={2}>
                    <Text fontSize={16} lineHeight={22} fontWeight="600" color={palette.ink}>
                      {job.company}
                    </Text>
                    {job.source !== "imported" ? (
                      <Text fontSize={13} lineHeight={19} color={palette.muted}>
                        {jobMetaLine(job, locale)}
                      </Text>
                    ) : null}
                  </YStack>
                </XStack>
                <YStack maxWidth={900} gap={14}>
                  <Text
                    accessibilityRole="header"
                    fontFamily={editorialFonts.serif}
                    fontWeight="600"
                    fontSize={48}
                    lineHeight={56}
                    letterSpacing={-1.4}
                    color={palette.ink}
                  >
                    {toTitleCase(job.title)}
                  </Text>
                </YStack>
              </YStack>
              <XStack
                gap={10}
                alignItems="center"
                flexWrap="wrap"
                paddingTop={24}
                paddingBottom={4}
              >
                {applicationUrl ? (
                  <PillButton
                    variant="accent"
                    minHeight={46}
                    borderRadius={12}
                    label={t("jobs.desktop.original")}
                    onPress={() => openApplication(applicationUrl)}
                    renderIcon={({ color }) => <ExternalLink size={16} color={color} />}
                  />
                ) : null}
                {job.source !== "imported" ? (
                  <DesktopSecondaryAction
                    minHeight={46}
                    label={t(job.isSaved ? "jobs.save.remove" : "jobs.save.add")}
                    disabled={save.pendingId === job.externalId}
                    onPress={() => save.toggle(job)}
                    renderIcon={({ color }) => (
                      <Bookmark size={16} color={color} fill={job.isSaved ? color : "none"} />
                    )}
                  />
                ) : null}
              </XStack>
              <XStack gap={64} alignItems="flex-start" paddingTop={40}>
                <YStack flex={1} minWidth={0} maxWidth={720} gap={22}>
                  <Text
                    accessibilityRole="header"
                    fontSize={14}
                    lineHeight={20}
                    fontWeight="600"
                    color={palette.ink}
                    letterSpacing={0.2}
                  >
                    {t("jobs.desktop.about")}
                  </Text>
                  <Text fontSize={16} lineHeight={30} color={palette.body} selectable>
                    {job.description ?? t("jobs.detail.noDescription")}
                  </Text>
                </YStack>
                <YStack width={360} flexShrink={0} gap={18}>
                  <YStack
                    width="100%"
                    padding={24}
                    gap={20}
                    borderWidth={1}
                    borderColor={palette.hairlineStrong}
                    borderRadius={16}
                    backgroundColor={palette.panel}
                  >
                    <MatchBreakdown
                      job={{
                        id: job.id,
                        title: job.title,
                        company: job.company,
                        description: job.description,
                      }}
                    />
                  </YStack>
                  <YStack
                    width="100%"
                    padding={24}
                    gap={16}
                    borderWidth={1}
                    borderColor={palette.hairline}
                    borderRadius={16}
                    backgroundColor={palette.surface}
                  >
                    <Text
                      fontFamily={editorialFonts.sans}
                      fontSize={10}
                      lineHeight={16}
                      fontWeight="600"
                      letterSpacing={1.8}
                      textTransform="uppercase"
                      color={palette.muted}
                    >
                      {t("jobs.desktop.prepare")}
                    </Text>
                    <YStack width="100%" gap={10}>
                      <DesktopSecondaryAction
                        appearance="dark"
                        fullWidth
                        minHeight={42}
                        label={t("jobs.desktop.resume")}
                        onPress={() => prepare("resume")}
                        renderIcon={({ color }) => <FileText size={15} color={color} />}
                      />
                      <DesktopSecondaryAction
                        appearance="dark"
                        fullWidth
                        minHeight={42}
                        label={t("jobs.desktop.letter")}
                        onPress={() => prepare("letter")}
                        renderIcon={({ color }) => <Mail size={15} color={color} />}
                      />
                    </YStack>
                  </YStack>
                  {entry?.documents.length ? (
                    <YStack
                      gap={12}
                      padding={20}
                      borderWidth={1}
                      borderColor={palette.hairline}
                      borderRadius={16}
                      backgroundColor={palette.surface}
                    >
                      <Text
                        fontFamily={editorialFonts.sans}
                        fontSize={10}
                        fontWeight="600"
                        letterSpacing={1.8}
                        textTransform="uppercase"
                        color={palette.muted}
                      >
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
                </YStack>
              </XStack>
            </>
          )}
        </YStack>
      </YStack>
      <Sheet
        open={Boolean(flow)}
        onOpenChange={(open) => {
          if (!open) setFlow(null);
        }}
        {...(flow ? { title: t(`jobs.desktop.${flow.kind}`) } : {})}
        closeLabel={t("jobs.desktop.closePreparation")}
        webMaxWidth={680}
        webMaxHeight={620}
        fillHeight
      >
        {flow && job ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            <JobComposer
              key={flow.key}
              initialJob={job}
              initialKind={flow.kind}
              initialDocument={flow.document}
              inModal
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
    </ScrollView>
  );
}

function DesktopSecondaryAction({
  label,
  onPress,
  renderIcon,
  disabled = false,
  fullWidth = false,
  minHeight = 42,
  appearance = "neutral",
}: {
  label: string;
  onPress: () => void;
  renderIcon: (args: { color: string }) => ReactElement;
  disabled?: boolean;
  fullWidth?: boolean;
  minHeight?: number;
  appearance?: "neutral" | "dark";
}): ReactElement {
  const palette = useEditorialPalette();
  const dark = appearance === "dark";
  const foreground = dark ? editorialPalette.onPrimary : palette.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        alignSelf: fullWidth ? "stretch" : "flex-start",
        opacity: disabled ? 0.45 : pressed ? 0.72 : 1,
      })}
    >
      <XStack
        minHeight={minHeight}
        paddingHorizontal={16}
        gap={8}
        alignItems="center"
        justifyContent="center"
        borderWidth={1}
        borderColor={dark ? editorialPalette.ink : palette.hairlineStrong}
        borderRadius={8}
        backgroundColor={dark ? editorialPalette.ink : palette.surface}
        hoverStyle={{ backgroundColor: dark ? editorialPalette.body : palette.panel }}
      >
        {renderIcon({ color: foreground })}
        <Text
          fontFamily={editorialFonts.sans}
          fontSize={13.5}
          lineHeight={20}
          fontWeight="600"
          color={foreground}
          textAlign="center"
        >
          {label}
        </Text>
      </XStack>
    </Pressable>
  );
}
