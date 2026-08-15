/**
 * <ApplyFlow> — the job detail's apply journey, in one card sheet:
 *
 *   choice    → master as-is (with its current compatibility) or tailored
 *   tailoring → the AI call, narrated as a step log while it runs
 *   review    → every change the AI made (title / summary / bullets with
 *               the injected keywords) + the compatibility before → after
 *   ready     → the chosen CV, PDF download FIRST (external forms ask for
 *               the file), then the hand-off to the publisher's site
 *
 * The tailor targets the master resume and passes the external listing id
 * (`jobId`) so the backend links the version and returns the estimated
 * compatibility lift. Opening the site is delegated up — the job detail
 * owns the in-app browser + the "did you apply?" prompt, now enriched with
 * which CV backed the application.
 */
import {
  getV1ResumesQueryKey,
  getV1ResumesResumeIdTailoredVersionsQueryKey,
  type PostV1ResumesResumeIdTailor200,
  useGetV1ExportResumePdf,
  useGetV1MatchResumeIdJobId,
  usePostV1ResumesResumeIdTailor,
} from "@patch-careers/api-client";
import { Sheet, Text, useToast, XStack, YStack } from "@patch-careers/ui";
import {
  editorialFonts as fonts,
  PrimaryAction,
  useEditorialPalette,
} from "@patch-careers/ui/editorial";
import { useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { Check, Download, FileText, Sparkles } from "lucide-react-native";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView } from "react-native";
import { useFitStatus } from "@/features/fit";
import { useDefaultMatchResume } from "@/features/match";
import { useI18n } from "@/providers/i18n-provider";
import type { AppliedCv } from "../hooks/use-report-applied";
import type { ExternalJob } from "../types";

/** Which CV the user is applying with — threaded into the did-apply report. */
export type ApplyCv = AppliedCv;

type Step = "choice" | "tailoring" | "review" | "ready";

// The tailor request is a single call; the narration advances on a timer and
// the flow only leaves the step once BOTH the narration and the request are
// done, so fast responses still read as deliberate work.
const NARRATION_STEP_MS = 900;

export function ApplyFlow({
  job,
  open,
  onOpenChange,
  onOpenJobSite,
}: {
  job: ExternalJob;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenJobSite: (cv: ApplyCv) => void;
}): ReactElement {
  const { t } = useI18n();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>("choice");
  const [result, setResult] = useState<PostV1ResumesResumeIdTailor200 | null>(null);
  const [cv, setCv] = useState<ApplyCv | null>(null);

  const { resumeId, quality } = useDefaultMatchResume();
  // Mirrors the backend tailor gates (fit profile answered + min quality);
  // null quality = unknown → allow, server decides.
  const fit = useFitStatus();
  const fitGated = fit.data?.status !== "responded";
  const tailorLocked = quality !== null && quality < 50;

  // Current compatibility — shares the cache with the MatchBreakdown below
  // this sheet; unavailable (fit gate, no resume) degrades the copy only.
  const match = useGetV1MatchResumeIdJobId(resumeId ?? "", job.id, {
    query: { enabled: open && Boolean(resumeId) },
  });
  const matchBefore = match.data?.overallScore ?? null;

  const tailor = usePostV1ResumesResumeIdTailor();

  // Reset on every fresh open so a second apply starts from the choice.
  useEffect(() => {
    if (open) {
      setStep("choice");
      setResult(null);
      setCv(null);
    }
  }, [open]);

  const startTailor = (): void => {
    if (!resumeId || tailorLocked || fitGated || tailor.isPending) return;
    setStep("tailoring");
    tailor.mutate(
      { resumeId, data: { jobId: job.id } },
      {
        onSuccess: (data) => {
          setResult(data);
          setCv({
            resumeId,
            tailoredVersionId: data.versionId,
            matchScore: data.match?.after ?? matchBefore,
          });
          // The new variant shows up under the master in Currículos.
          void queryClient.invalidateQueries({
            queryKey: getV1ResumesResumeIdTailoredVersionsQueryKey(resumeId),
          });
          void queryClient.invalidateQueries({ queryKey: getV1ResumesQueryKey() });
        },
        onError: () => {
          toast.show({ title: t("jobs.applyFlow.tailorError"), intent: "danger" });
          setStep("choice");
        },
      },
    );
  };

  const chooseMaster = (): void => {
    if (!resumeId) return;
    setCv({ resumeId, tailoredVersionId: null, matchScore: matchBefore });
    setStep("ready");
  };

  const title =
    step === "review"
      ? t("jobs.applyFlow.reviewTitle")
      : step === "ready"
        ? t("jobs.applyFlow.readyTitle")
        : t("jobs.applyFlow.title");

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      presentation="card"
      fillHeight={step === "review" || step === "ready"}
    >
      {step === "choice" ? (
        <ChoiceStep
          job={job}
          matchBefore={matchBefore}
          tailorLocked={tailorLocked}
          fitGated={fitGated}
          canTailor={Boolean(resumeId)}
          onTailor={startTailor}
          onMaster={chooseMaster}
        />
      ) : step === "tailoring" ? (
        <TailoringStep
          company={job.company}
          pending={tailor.isPending}
          result={result}
          onAdvance={() => setStep("review")}
        />
      ) : step === "review" && result ? (
        <ReviewStep
          result={result}
          onContinue={() => setStep("ready")}
          onUseMaster={chooseMaster}
        />
      ) : step === "ready" && cv ? (
        <ReadyStep
          job={job}
          cv={cv}
          tailoredLabel={result?.label ?? null}
          onOpenJobSite={() => onOpenJobSite(cv)}
        />
      ) : null}
    </Sheet>
  );
}

/* ─── step 1: choice ──────────────────────────────────────────────────── */

function ChoiceStep({
  job,
  matchBefore,
  tailorLocked,
  fitGated,
  canTailor,
  onTailor,
  onMaster,
}: {
  job: ExternalJob;
  matchBefore: number | null;
  tailorLocked: boolean;
  fitGated: boolean;
  canTailor: boolean;
  onTailor: () => void;
  onMaster: () => void;
}): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const masterMeta =
    matchBefore === null
      ? t("jobs.applyFlow.chooseMasterMetaNoScore")
      : t("jobs.applyFlow.chooseMasterMeta", { score: String(matchBefore) });

  return (
    <YStack gap={12} paddingBottom={6}>
      <Text fontFamily={fonts.sans} fontSize={12.5} color={palette.muted}>
        {job.title} · {job.company}
      </Text>

      <OptionCard
        icon={<Sparkles size={16} color={palette.ink} strokeWidth={1.75} />}
        title={t("jobs.applyFlow.chooseTailor")}
        body={t("jobs.applyFlow.chooseTailorBody")}
        meta={t("jobs.applyFlow.chooseTailorMeta")}
        disabled={!canTailor || tailorLocked || fitGated}
        onPress={onTailor}
      />
      {fitGated ? (
        <Text fontFamily={fonts.sans} fontSize={12} lineHeight={17} color={palette.muted}>
          {t("jobs.applyFlow.chooseTailorFitGate")}
        </Text>
      ) : tailorLocked ? (
        <Text fontFamily={fonts.sans} fontSize={12} lineHeight={17} color={palette.muted}>
          {t("jobs.applyFlow.chooseTailorLocked")}
        </Text>
      ) : null}

      <OptionCard
        icon={<FileText size={16} color={palette.body} strokeWidth={1.75} />}
        title={t("jobs.applyFlow.chooseMaster")}
        body={t("jobs.applyFlow.chooseMasterBody")}
        meta={masterMeta}
        disabled={!canTailor}
        onPress={onMaster}
      />

      <Text
        fontFamily={fonts.sans}
        fontSize={11.5}
        color={palette.muted}
        textAlign="center"
        marginTop={4}
      >
        {t("jobs.applyFlow.chooseNote")}
      </Text>
    </YStack>
  );
}

function OptionCard({
  icon,
  title,
  body,
  meta,
  disabled,
  onPress,
}: {
  icon: ReactElement;
  title: string;
  body: string;
  meta: string;
  disabled: boolean;
  onPress: () => void;
}): ReactElement {
  const palette = useEditorialPalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
    >
      {({ pressed }: { pressed: boolean }) => (
        <YStack
          borderWidth={1}
          borderColor={palette.hairlineStrong}
          backgroundColor={palette.panel}
          borderRadius={16}
          padding={16}
          gap={8}
          opacity={disabled ? 0.5 : pressed ? 0.8 : 1}
        >
          <XStack alignItems="center" gap={8}>
            {icon}
            <Text fontFamily={fonts.sans} fontSize={15} fontWeight="600" color={palette.ink}>
              {title}
            </Text>
          </XStack>
          <Text fontFamily={fonts.sans} fontSize={12.5} lineHeight={18} color={palette.muted}>
            {body}
          </Text>
          <Text fontFamily={fonts.mono} fontSize={11.5} color={palette.ink}>
            {meta}
          </Text>
        </YStack>
      )}
    </Pressable>
  );
}

/* ─── step 2: tailoring narration ─────────────────────────────────────── */

function TailoringStep({
  company,
  pending,
  result,
  onAdvance,
}: {
  company: string;
  pending: boolean;
  result: PostV1ResumesResumeIdTailor200 | null;
  onAdvance: () => void;
}): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const steps = [
    t("jobs.applyFlow.tailoringStep1"),
    t("jobs.applyFlow.tailoringStep2"),
    t("jobs.applyFlow.tailoringStep3"),
    t("jobs.applyFlow.tailoringStep4"),
  ];
  const [done, setDone] = useState(0);
  const advanced = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setDone((current) => {
        // Hold the last step until the request resolves.
        const cap = pending ? steps.length - 1 : steps.length;
        return Math.min(current + 1, cap);
      });
    }, NARRATION_STEP_MS);
    return () => clearInterval(timer);
  }, [pending, steps.length]);

  // Advance once BOTH the narration and the request are done — whichever
  // finishes last triggers it.
  useEffect(() => {
    if (!pending && result && done >= steps.length && !advanced.current) {
      advanced.current = true;
      onAdvance();
    }
  }, [pending, result, done, steps.length, onAdvance]);

  return (
    <YStack gap={16} paddingVertical={8} paddingBottom={16}>
      <Text
        fontFamily={fonts.sans}
        fontSize={10}
        fontWeight="600"
        letterSpacing={1.8}
        textTransform="uppercase"
        color={palette.muted}
      >
        {t("jobs.applyFlow.tailoringTitle", { company })}
      </Text>
      <YStack gap={12}>
        {steps.map((label, index) => {
          const isDone = index < done;
          const isActive = index === done;
          return (
            <XStack
              key={label}
              alignItems="center"
              gap={10}
              opacity={isDone || isActive ? 1 : 0.35}
            >
              <YStack
                width={18}
                height={18}
                borderRadius={9}
                alignItems="center"
                justifyContent="center"
                backgroundColor={isDone ? palette.success : "transparent"}
                borderWidth={isDone ? 0 : 1.5}
                borderColor={palette.hairlineStrong}
              >
                {isDone ? (
                  <Check size={11} color={palette.onPrimary} strokeWidth={3} />
                ) : isActive ? (
                  <ActivityIndicator size="small" color={palette.muted} />
                ) : null}
              </YStack>
              <Text fontFamily={fonts.sans} fontSize={13.5} color={palette.body}>
                {label}
              </Text>
            </XStack>
          );
        })}
      </YStack>
      <Text fontFamily={fonts.sans} fontSize={11.5} lineHeight={16} color={palette.muted}>
        {t("jobs.applyFlow.tailoringNote")}
      </Text>
    </YStack>
  );
}

/* ─── step 3: review ──────────────────────────────────────────────────── */

function ReviewStep({
  result,
  onContinue,
  onUseMaster,
}: {
  result: PostV1ResumesResumeIdTailor200;
  onContinue: () => void;
  onUseMaster: () => void;
}): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const rewrittenBullets = result.bullets.filter((b) => b.tailored && b.tailored !== b.original);
  const hasChanges =
    Boolean(result.jobTitle) || Boolean(result.summary) || rewrittenBullets.length > 0;

  return (
    <YStack flex={1} gap={14} minHeight={0}>
      {result.match ? (
        <YStack gap={2}>
          <Text fontFamily={fonts.mono} fontSize={16} fontWeight="600" color={palette.ink}>
            {t("jobs.applyFlow.reviewDelta", {
              before: String(result.match.before),
              after: String(result.match.after),
            })}
          </Text>
          <Text fontFamily={fonts.sans} fontSize={11.5} color={palette.muted}>
            {t("jobs.applyFlow.reviewDeltaNote")}
          </Text>
        </YStack>
      ) : null}

      <ScrollView
        // @style-allow inline: RN ScrollView fill (not a Tamagui component)
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap={10}>
          {!hasChanges ? (
            <Text fontFamily={fonts.sans} fontSize={13.5} lineHeight={19} color={palette.muted}>
              {t("jobs.applyFlow.reviewEmpty")}
            </Text>
          ) : (
            <>
              {result.jobTitle ? (
                <ChangeCard tag={t("jobs.applyFlow.changeTitle")} after={result.jobTitle} />
              ) : null}
              {result.summary ? (
                <ChangeCard tag={t("jobs.applyFlow.changeSummary")} after={result.summary} />
              ) : null}
              {rewrittenBullets.map((bullet) => (
                <ChangeCard
                  key={bullet.id}
                  tag={t("jobs.applyFlow.changeBullet")}
                  before={bullet.original || null}
                  after={bullet.tailored}
                  keywords={bullet.highlights}
                />
              ))}
            </>
          )}
        </YStack>
      </ScrollView>

      <YStack gap={10} paddingTop={4}>
        <PrimaryAction label={t("jobs.applyFlow.reviewContinue")} onPress={onContinue} />
        <Pressable accessibilityRole="button" onPress={onUseMaster} hitSlop={8}>
          <Text
            fontFamily={fonts.sans}
            fontSize={12.5}
            color={palette.muted}
            textAlign="center"
            textDecorationLine="underline"
          >
            {t("jobs.applyFlow.reviewUseMaster")}
          </Text>
        </Pressable>
      </YStack>
    </YStack>
  );
}

function ChangeCard({
  tag,
  before,
  after,
  keywords,
}: {
  tag: string;
  before?: string | null;
  after: string;
  keywords?: string[];
}): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  return (
    <YStack
      borderWidth={1}
      borderColor={palette.hairline}
      backgroundColor={palette.panel}
      borderRadius={14}
      padding={14}
      gap={6}
    >
      <Text
        fontFamily={fonts.sans}
        fontSize={10}
        fontWeight="600"
        letterSpacing={1.8}
        textTransform="uppercase"
        color={palette.muted}
      >
        {tag}
      </Text>
      {before ? (
        <Text
          fontFamily={fonts.sans}
          fontSize={12.5}
          lineHeight={18}
          color={palette.subtle}
          textDecorationLine="line-through"
        >
          {before}
        </Text>
      ) : null}
      <Text fontFamily={fonts.sans} fontSize={13.5} lineHeight={19} color={palette.ink}>
        {after}
      </Text>
      {keywords && keywords.length > 0 ? (
        <Text fontFamily={fonts.sans} fontSize={11.5} color={palette.accent}>
          {t("jobs.applyFlow.changeKeywords", { keywords: keywords.join(", ") })}
        </Text>
      ) : null}
    </YStack>
  );
}

/* ─── step 4: ready ───────────────────────────────────────────────────── */

function ReadyStep({
  job,
  cv,
  tailoredLabel,
  onOpenJobSite,
}: {
  job: ExternalJob;
  cv: ApplyCv;
  tailoredLabel: string | null;
  onOpenJobSite: () => void;
}): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const toast = useToast();
  const tailored = cv.tailoredVersionId !== null;

  const pdf = useGetV1ExportResumePdf(
    {
      resumeId: cv.resumeId,
      ...(cv.tailoredVersionId ? { versionId: cv.tailoredVersionId } : {}),
    },
    { query: { enabled: false } },
  );

  const onDownload = async (): Promise<void> => {
    const res = await pdf.refetch();
    if (res.data?.downloadUrl) {
      await WebBrowser.openBrowserAsync(res.data.downloadUrl);
    } else {
      toast.show({ title: t("jobs.applyFlow.downloadError"), intent: "danger" });
    }
  };

  return (
    <YStack flex={1} gap={16} minHeight={0}>
      {/* The chosen CV */}
      <YStack
        borderWidth={1}
        borderColor={palette.hairline}
        backgroundColor={palette.panel}
        borderRadius={16}
        padding={16}
        gap={8}
      >
        <Text fontFamily={fonts.serif} fontSize={17} color={palette.ink}>
          {tailored && tailoredLabel ? tailoredLabel : t("jobs.applyFlow.readyMasterName")}
        </Text>
        <XStack alignItems="center" gap={10} flexWrap="wrap">
          {cv.matchScore !== null ? (
            <Text fontFamily={fonts.mono} fontSize={12.5} color={palette.ink}>
              {t("jobs.applyFlow.readyCompat", { score: String(cv.matchScore) })}
            </Text>
          ) : null}
          {tailored ? (
            <Text fontFamily={fonts.sans} fontSize={12} fontWeight="600" color={palette.success}>
              ✓ {t("jobs.applyFlow.readySaved")}
            </Text>
          ) : null}
        </XStack>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("jobs.applyFlow.download")}
          accessibilityState={{ busy: pdf.isFetching }}
          disabled={pdf.isFetching}
          onPress={() => void onDownload()}
        >
          {({ pressed }: { pressed: boolean }) => (
            <XStack
              borderWidth={1}
              borderColor={palette.hairlineStrong}
              borderRadius={999}
              minHeight={46}
              alignItems="center"
              justifyContent="center"
              gap={8}
              opacity={pdf.isFetching ? 0.6 : pressed ? 0.8 : 1}
            >
              {pdf.isFetching ? (
                <ActivityIndicator size="small" color={palette.ink} />
              ) : (
                <Download size={16} color={palette.ink} strokeWidth={1.75} />
              )}
              <Text fontFamily={fonts.sans} fontSize={14} fontWeight="600" color={palette.ink}>
                {t("jobs.applyFlow.download")}
              </Text>
            </XStack>
          )}
        </Pressable>
      </YStack>

      {/* Why download-first: the external form asks for the file. */}
      <YStack gap={10}>
        <NumberedStep index={1} text={t("jobs.applyFlow.step1")} />
        <NumberedStep index={2} text={t("jobs.applyFlow.step2")} />
      </YStack>

      <YStack gap={8} marginTop="auto">
        <PrimaryAction label={t("jobs.applyFlow.openSite")} onPress={onOpenJobSite} />
        <Text fontFamily={fonts.sans} fontSize={11.5} color={palette.subtle} textAlign="center">
          {job.publisher
            ? t("jobs.detail.opensPublisherSiteNamed", { publisher: job.publisher })
            : t("jobs.detail.opensPublisherSite")}
        </Text>
      </YStack>
    </YStack>
  );
}

function NumberedStep({ index, text }: { index: number; text: string }): ReactElement {
  const palette = useEditorialPalette();
  return (
    <XStack gap={10} alignItems="flex-start">
      <YStack
        width={20}
        height={20}
        borderRadius={10}
        borderWidth={1}
        borderColor={palette.hairlineStrong}
        alignItems="center"
        justifyContent="center"
      >
        <Text fontFamily={fonts.mono} fontSize={10.5} fontWeight="600" color={palette.ink}>
          {index}
        </Text>
      </YStack>
      <Text fontFamily={fonts.sans} fontSize={13} lineHeight={19} color={palette.body} flex={1}>
        {text}
      </Text>
    </XStack>
  );
}
