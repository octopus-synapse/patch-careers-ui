import { FetcherError } from "@patch-careers/api-client";
import { Input, Text, useEditorialPalette, useToast, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, PillButton } from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import { ArrowRight, ChevronLeft, FileText, Link as LinkIcon, Mail } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Pressable } from "react-native";
import { copyToClipboard } from "@/lib/clipboard";
import { useI18n } from "@/providers/i18n-provider";
import { documentsFromPreparation, useJobPreparation } from "../hooks/use-job-preparation";
import { type ComposerDraft, useJobsWorkspace } from "../hooks/use-jobs-workspace";
import { type Opportunity, type PreparationDocument, safeJobUrl } from "../lib/discovery";
import { JobLogo } from "./job-logo.web";

type Step = "input" | "choice" | "resume" | "letter" | "generating" | "preview";

export function JobComposer({
  initialJob,
  initialKind,
  initialDocument,
  inModal = false,
}: {
  initialJob?: Opportunity;
  initialKind?: "resume" | "letter";
  initialDocument?: PreparationDocument | undefined;
  inModal?: boolean;
}) {
  const palette = useEditorialPalette();
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const workspace = useJobsWorkspace();
  const preparation = useJobPreparation();
  const form = useForm({
    defaultValues: { input: "", context: "", document: initialDocument?.text ?? "" },
  });
  const [job, setJob] = useState(initialJob ?? null);
  const [step, setStep] = useState<Step>(
    initialDocument
      ? "preview"
      : initialKind === "letter"
        ? "letter"
        : initialKind === "resume"
          ? "resume"
          : initialJob
            ? "choice"
            : "input",
  );
  const [documents, setDocuments] = useState<PreparationDocument[]>(
    initialDocument ? [initialDocument] : [],
  );
  const [kind, setKind] = useState<"resume" | "letter">(
    initialDocument?.kind ?? initialKind ?? "resume",
  );
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const operation = useRef(0);
  const initialResumeStarted = useRef(false);
  useEffect(
    () => () => {
      operation.current++;
    },
    [],
  );
  const current = documents.find((document) => document.kind === kind);
  const input = form.watch("input");
  const context = form.watch("context");
  const busy = preparation.importJob.isPending || preparation.generate.isPending;
  const hydrated = useRef(false);
  const lastDraft = useRef("");
  const importedInput = useRef("");
  useEffect(() => {
    if (initialJob || workspace.isLoading || workspace.isError || hydrated.current) return;
    hydrated.current = true;
    const draft = workspace.draft;
    if (!draft || form.getValues("input")) return;
    const restored = workspace.entries.find((entry) => entry.job.id === draft.jobId);
    form.setValue("input", draft.input);
    form.setValue("context", draft.context);
    if (restored) {
      setJob(restored.job);
      importedInput.current = draft.input.trim();
      setDocuments(restored.documents);
      setStep(draft.step);
    }
    lastDraft.current = JSON.stringify(draft);
  }, [
    initialJob,
    workspace.isLoading,
    workspace.isError,
    workspace.draft,
    workspace.entries,
    form,
  ]);
  const saveDraft = workspace.saveDraft;
  useEffect(() => {
    if (initialJob || !hydrated.current) return;
    const draft: ComposerDraft = {
      input,
      context,
      jobId: job?.id ?? null,
      step: step === "input" || step === "letter" ? step : "choice",
    };
    const serialized = JSON.stringify(draft);
    if (serialized === lastDraft.current) return;
    const timer = setTimeout(() => {
      void saveDraft(draft)
        .then(() => {
          lastDraft.current = serialized;
        })
        .catch(() => {
          setError(t("jobs.desktop.saveError"));
        });
    }, 700);
    return () => clearTimeout(timer);
  }, [initialJob, input, context, job?.id, step, saveDraft, t]);

  const showError = (reason: unknown) => {
    if (reason instanceof FetcherError) {
      setError(
        t(
          reason.status === 402
            ? "jobs.desktop.quota"
            : reason.status === 429
              ? "jobs.desktop.rateLimit"
              : reason.status === 403
                ? "jobs.desktop.preparationLocked"
                : "jobs.applyFlow.tailorError",
        ),
      );
    } else setError(reason instanceof Error ? reason.message : t("jobs.applyFlow.tailorError"));
  };
  const importInput = form.handleSubmit(async ({ input: value }) => {
    if (busy) return;
    const request = ++operation.current;
    setError("");
    try {
      if (job && importedInput.current === value.trim()) {
        setStep("choice");
        return;
      }
      const imported = await preparation.importJob.mutateAsync(value);
      await workspace.update(imported, (entry) => ({
        ...entry,
        job: imported,
        stage: entry.stage ?? "draft",
      }));
      if (request !== operation.current) return;
      setJob(imported);
      importedInput.current = value.trim();
      setDocuments([]);
      setStep("choice");
    } catch (reason) {
      if (request === operation.current) showError(reason);
    }
  });
  const selectKind = (next: "resume" | "letter") => {
    setKind(next);
    setError("");
    const existing =
      documents.find((document) => document.kind === next) ??
      workspace.entries
        .find((entry) => entry.job.externalId === job?.externalId)
        ?.documents.findLast((document) => document.kind === next);
    if (existing) {
      setDocuments((items) => [...items.filter((item) => item.kind !== next), existing]);
      form.setValue("document", existing.text);
      setStep("preview");
    } else if (next === "letter") setStep("letter");
    else void generateDocuments("resume");
  };
  const generateDocuments = async (next: "resume" | "letter") => {
    if (!job || busy) return;
    const request = ++operation.current;
    setError("");
    setKind(next);
    setStep("generating");
    try {
      const result = await preparation.generate.mutateAsync({
        job,
        context: next === "letter" ? context : "",
      });
      const generated = documentsFromPreparation(result, preparation.master.resumeId ?? "");
      // Keep the server-created version discoverable even if the user navigates away.
      await workspace.update(job, (entry) => ({
        ...entry,
        job,
        stage: entry.stage ?? "draft",
        documents: [
          ...entry.documents.filter((document) => document.versionId !== result.versionId),
          ...generated,
        ].slice(-20),
      }));
      if (request !== operation.current) return;
      setDocuments(generated);
      const selected = generated.find((document) => document.kind === next);
      if (!selected) {
        setError(t("jobs.desktop.noLetter"));
        setStep(next === "resume" && initialKind === "resume" ? "resume" : "choice");
        return;
      }
      form.setValue("document", selected.text);
      setStep("preview");
    } catch (reason) {
      if (request === operation.current) {
        showError(reason);
        setStep(next === "letter" ? "letter" : initialKind === "resume" ? "resume" : "choice");
      }
    }
  };
  const generateDocumentsRef = useRef(generateDocuments);
  generateDocumentsRef.current = generateDocuments;
  useEffect(() => {
    if (
      initialKind !== "resume" ||
      initialDocument ||
      !initialJob ||
      preparation.master.isLoading ||
      !preparation.master.resumeId ||
      initialResumeStarted.current
    )
      return;
    initialResumeStarted.current = true;
    void generateDocumentsRef.current("resume");
  }, [
    initialKind,
    initialDocument,
    initialJob,
    preparation.master.isLoading,
    preparation.master.resumeId,
  ]);
  const saveDocument = async () => {
    if (!job || !current) return;
    const saved = {
      ...current,
      text: current.kind === "letter" ? form.getValues("document") : current.text,
    };
    try {
      await workspace.update(job, (entry) => ({
        ...entry,
        job,
        stage: entry.stage === null || entry.stage === "draft" ? "ready" : entry.stage,
        documents: [
          ...entry.documents.filter(
            (document) => document.kind !== saved.kind || document.versionId !== saved.versionId,
          ),
          saved,
        ].slice(-20),
      }));
      setDocuments((items) => items.map((document) => (document.kind === kind ? saved : document)));
      setEditing(false);
      toast.show({ title: t("jobs.desktop.documentSaved"), intent: "success" });
    } catch {
      setError(t("jobs.desktop.saveError"));
    }
  };
  const download = async () => {
    if (!current) return;
    try {
      if (current.kind === "resume") {
        const result = await preparation.exportPdf.mutateAsync(current);
        const url = safeJobUrl(result.downloadUrl);
        if (!url) throw new Error("invalid export URL");
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.click();
      } else {
        const url = URL.createObjectURL(
          new Blob([form.getValues("document")], { type: "text/plain;charset=utf-8" }),
        );
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "cover-letter.txt";
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch {
      setError(t("jobs.applyFlow.downloadError"));
    }
  };
  const back = () => {
    operation.current++;
    setError("");
    setEditing(false);
    setStep(step === "choice" && !initialJob ? "input" : "choice");
  };
  return (
    <YStack
      testID="job-composer"
      marginBottom={inModal ? 0 : 31}
      padding={inModal || step === "input" ? 0 : 28}
      paddingTop={inModal ? 0 : step === "input" ? 24 : 28}
      paddingBottom={inModal ? 12 : 32}
      borderRadius={inModal ? 0 : 24}
      borderWidth={inModal ? 0 : 1}
      borderColor={palette.hairline}
      backgroundColor={inModal ? "transparent" : step === "input" ? palette.surface : palette.panel}
      gap={22}
    >
      {step === "preview" ||
      (step === "choice" && !initialJob) ||
      (step === "letter" && !initialKind) ? (
        <PillButton
          variant="ghost"
          label={t("common.back")}
          onPress={back}
          renderIcon={({ color }) => <ChevronLeft size={14} color={color} />}
        />
      ) : null}
      {step === "input" ? (
        <YStack width="100%" maxWidth={820} alignSelf="center" gap={26} paddingHorizontal={18}>
          <YStack alignItems="center" gap={12}>
            <Text
              accessibilityRole="header"
              fontFamily={editorialFonts.serif}
              fontWeight="400"
              fontSize={36}
              lineHeight={45}
              letterSpacing={-0.8}
              color={palette.ink}
            >
              {t("jobs.desktop.composerTitle")}
            </Text>
            <Text
              fontSize={13}
              lineHeight={23}
              textAlign="center"
              maxWidth={470}
              color={palette.muted}
            >
              {t("jobs.desktop.composerHelp")}
            </Text>
          </YStack>
          <XStack gap={12} alignItems="flex-start">
            <YStack flex={1} position="relative">
              <Controller
                control={form.control}
                name="input"
                render={({ field }) => (
                  <Input
                    testID="job-input"
                    accessibilityLabel={t("jobs.desktop.inputLabel")}
                    placeholder={t("jobs.desktop.inputPlaceholder")}
                    multiline
                    autoSize
                    minHeight={54}
                    maxHeight={208}
                    value={field.value}
                    onChangeText={field.onChange}
                    maxLength={12000}
                    paddingLeft={45}
                    paddingRight={16}
                    paddingVertical={15}
                    borderRadius={12}
                    backgroundColor={palette.panel}
                    borderColor={palette.hairlineStrong}
                    fontSize={13}
                    lineHeight={22}
                    color={palette.ink}
                    error={error || undefined}
                  />
                )}
              />
              <YStack position="absolute" top={18} left={17} pointerEvents="none">
                <LinkIcon size={17} color={palette.muted} />
              </YStack>
            </YStack>
            <PillButton
              label={t(busy ? "jobs.desktop.importing" : "common.continue")}
              minHeight={54}
              borderRadius={12}
              disabled={!input.trim() || busy}
              onPress={importInput}
              iconPosition="end"
              renderIcon={({ color }) => <ArrowRight size={15} color={color} />}
            />
          </XStack>
        </YStack>
      ) : null}
      {step === "choice" && job ? (
        <XStack gap={36} alignItems="center">
          <YStack flex={1} gap={15}>
            <ComposerJob job={job} />
            <Text fontSize={12} color={palette.muted}>
              {t("jobs.desktop.choose")}
            </Text>
          </YStack>
          <XStack flex={1.5} gap={14}>
            {(["resume", "letter"] as const).map((option) => (
              <YStack key={option} flex={1}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t(`jobs.desktop.${option}`)}
                  disabled={busy || !preparation.master.resumeId}
                  onPress={() => selectKind(option)}
                >
                  <YStack
                    minHeight={144}
                    padding={22}
                    gap={10}
                    borderRadius={14}
                    backgroundColor={palette.surface}
                    borderWidth={1}
                    borderColor={palette.hairline}
                    hoverStyle={{ borderColor: palette.accent }}
                    opacity={!preparation.master.resumeId ? 0.5 : 1}
                  >
                    {option === "resume" ? (
                      <FileText size={21} color={palette.accent} />
                    ) : (
                      <Mail size={21} color={palette.accent} />
                    )}
                    <Text fontSize={13} lineHeight={20} fontWeight="600" color={palette.ink}>
                      {t(`jobs.desktop.${option}`)}
                    </Text>
                    <Text fontSize={11} lineHeight={18} color={palette.muted}>
                      {t(`jobs.desktop.${option}Help`)}
                    </Text>
                  </YStack>
                </Pressable>
              </YStack>
            ))}
          </XStack>
        </XStack>
      ) : null}
      {step === "resume" && job ? (
        <YStack maxWidth={560} width="100%" alignSelf="center" gap={18}>
          <ComposerJob job={job} />
          <Text fontFamily={editorialFonts.serif} fontSize={28} color={palette.ink}>
            {t("jobs.desktop.resume")}
          </Text>
          <Text fontSize={13} lineHeight={22} color={palette.muted}>
            {t("jobs.desktop.resumeHelp")}
          </Text>
          <PillButton
            label={t("common.retry")}
            disabled={busy || !preparation.master.resumeId}
            onPress={() => void generateDocuments("resume")}
          />
        </YStack>
      ) : null}
      {step !== "input" && !preparation.master.isLoading && !preparation.master.resumeId ? (
        <YStack gap={8}>
          <Text color={palette.muted} fontSize={13}>
            {t("jobs.desktop.noMaster")}
          </Text>
          <PillButton
            label={t("jobs.desktop.openProfile")}
            onPress={() => router.push("/profile")}
          />
        </YStack>
      ) : null}
      {step === "letter" && job ? (
        <YStack maxWidth={760} width="100%" alignSelf="center" gap={16}>
          <ComposerJob job={job} />
          <Text fontFamily={editorialFonts.serif} fontSize={28} color={palette.ink}>
            {t("jobs.desktop.letterTitle")}
          </Text>
          <Text fontSize={12} lineHeight={21} color={palette.muted}>
            {t("jobs.desktop.letterContextHelp")}
          </Text>
          <Controller
            control={form.control}
            name="context"
            render={({ field }) => (
              <Input
                multiline
                minHeight={180}
                maxLength={3000}
                value={field.value}
                onChangeText={field.onChange}
                accessibilityLabel={t("jobs.desktop.letterContext")}
                placeholder={t("jobs.desktop.letterPlaceholder")}
                backgroundColor={palette.surface}
                color={palette.ink}
                borderColor={palette.hairlineStrong}
                padding={16}
                fontSize={13}
                lineHeight={23}
              />
            )}
          />
          <Text fontSize={11} color={palette.muted}>
            {t("jobs.desktop.contextRemaining", {
              count: Math.max(0, 200 - context.trim().length),
            })}
          </Text>
          <PillButton
            label={t("jobs.desktop.createLetter")}
            disabled={context.trim().length < 200 || busy || !preparation.master.resumeId}
            onPress={() => void generateDocuments("letter")}
          />
        </YStack>
      ) : null}
      {step === "generating" ? (
        <YStack padding={40} alignItems="center" gap={20} accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" color={palette.accent} />
          <Text fontFamily={editorialFonts.serif} fontSize={28} color={palette.ink}>
            {t(
              kind === "resume" ? "jobs.desktop.generatingResume" : "jobs.desktop.generatingLetter",
            )}
          </Text>
          <Text fontSize={12} color={palette.muted}>
            {t("jobs.desktop.generatingHelp")}
          </Text>
        </YStack>
      ) : null}
      {step === "preview" && current ? (
        <YStack gap={16}>
          <Text
            accessibilityRole="header"
            fontFamily={editorialFonts.serif}
            fontSize={26}
            color={palette.ink}
          >
            {t(current.kind === "resume" ? "jobs.desktop.resumeReview" : "jobs.desktop.letter")}
          </Text>
          <YStack backgroundColor={palette.surface} borderRadius={12} padding={24}>
            {editing && current.kind === "letter" ? (
              <Controller
                control={form.control}
                name="document"
                render={({ field }) => (
                  <Input
                    accessibilityLabel={t("jobs.desktop.documentText")}
                    multiline
                    minHeight={340}
                    maxLength={100000}
                    value={field.value}
                    onChangeText={field.onChange}
                    backgroundColor={palette.panel}
                    color={palette.ink}
                    fontSize={13}
                    lineHeight={24}
                    padding={30}
                  />
                )}
              />
            ) : (
              <Text fontSize={13} lineHeight={25} color={palette.ink} selectable>
                {form.watch("document") || t("jobs.applyFlow.reviewEmpty")}
              </Text>
            )}
          </YStack>
          <XStack gap={10} flexWrap="wrap">
            {current.kind === "letter" ? (
              <PillButton
                variant="ghost"
                label={t(editing ? "jobs.desktop.finishEditing" : "jobs.desktop.edit")}
                onPress={() => setEditing(!editing)}
              />
            ) : null}
            <PillButton
              variant="ghost"
              label={t("jobs.desktop.copy")}
              onPress={() => {
                void copyToClipboard(form.getValues("document")).then((copied) =>
                  toast.show({
                    title: t(
                      copied
                        ? "jobs.applyFlow.coverLetterCopied"
                        : "jobs.applyFlow.coverLetterCopyError",
                    ),
                    intent: copied ? "success" : "danger",
                  }),
                );
              }}
            />
            <PillButton
              variant="ghost"
              label={t(
                current.kind === "resume"
                  ? "jobs.applyFlow.download"
                  : "jobs.desktop.downloadLetter",
              )}
              disabled={preparation.exportPdf.isPending}
              onPress={() => void download()}
            />
            <PillButton
              label={t("jobs.desktop.saveDocument")}
              disabled={workspace.pending}
              onPress={() => void saveDocument()}
            />
          </XStack>
          <Text fontSize={11} lineHeight={18} color={palette.muted}>
            {t(
              current.kind === "resume"
                ? "jobs.desktop.resumeReviewHelp"
                : "jobs.desktop.letterReviewHelp",
            )}
          </Text>
        </YStack>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" fontSize={12} lineHeight={20} color={palette.danger}>
          {error}
        </Text>
      ) : null}
    </YStack>
  );
}

function ComposerJob({ job }: { job: Opportunity }) {
  const palette = useEditorialPalette();
  return (
    <XStack alignItems="center" gap={12}>
      <JobLogo job={job} large />
      <YStack flex={1} gap={4}>
        <Text fontSize={14} lineHeight={21} fontWeight="600" color={palette.ink}>
          {job.title}
        </Text>
        <Text fontSize={11} color={palette.muted}>
          {job.company}
        </Text>
      </YStack>
    </XStack>
  );
}
