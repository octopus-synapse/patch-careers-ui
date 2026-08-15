/**
 * <FitQuestionnaireScreen> — the 25-question Fit Profile flow, one question
 * per screen (Editorial Calm). An intro, then a question at a time with a
 * progress masthead + a Likert/binary control, then a submit that commits all
 * 25 answers and unlocks the Match Score. Reached from the match blur/lock
 * gate and (optionally) a post-onboarding nudge.
 *
 * DEV-only test-fill controls (same double gate as onboarding's
 * `TestFillBar`): "test" answers the current question with a random valid
 * value and advances; "test all" answers everything left and submits —
 * available from the intro too, so a dev never taps through 25 screens.
 */
import { PrimaryAction, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useRouter } from "expo-router";
import { type ReactElement, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, Text, View } from "react-native";
import { isDevTestFillEnabled } from "@/config/dev-flags";
import { useI18n } from "@/providers/i18n-provider";
import { useFitQuestions, useSubmitFitAnswers } from "../hooks/queries";
import { useFit } from "../lib/styles";
import type { FitAnswerDraft, FitScaleType } from "../types";
import { FitTestFillBar } from "./fit-test-fill-bar";
import { LikertScale } from "./likert-scale";

/** A random valid raw answer per scale: binary → 0|1, Likert → 1..5. */
function randomRaw(scaleType: FitScaleType): number {
  return scaleType === "binary" ? (Math.random() < 0.5 ? 0 : 1) : 1 + Math.floor(Math.random() * 5);
}

export function FitQuestionnaireScreen(): ReactElement {
  const { t, locale } = useI18n();
  const s = useFit();
  const palette = useEditorialPalette();
  const router = useRouter();

  const questionsQuery = useFitQuestions();
  const submit = useSubmitFitAnswers();

  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<FitAnswerDraft>({});
  const [submitted, setSubmitted] = useState(false);

  const data = questionsQuery.data;
  const questions = data?.questions ?? [];
  const total = questions.length;

  const close = () => {
    if (router.canGoBack()) router.back();
  };

  // DEV-only: answer everything still unanswered with random valid values
  // and submit in one go. Callable from the intro and from any question.
  const testFillAll = () => {
    if (!data || submit.isPending) return;
    const filled: FitAnswerDraft = { ...answers };
    for (const q of questions) {
      if (filled[q.id] === undefined) filled[q.id] = randomRaw(q.scaleType);
    }
    setAnswers(filled);
    setStarted(true);
    setIndex(total - 1);
    const payload = questions.map((q) => ({ questionId: q.id, rawValue: filled[q.id] ?? 0 }));
    submit.mutate(
      { data: { questionSetId: data.questionSetId, answers: payload } },
      { onSuccess: () => setSubmitted(true) },
    );
  };

  // Loading
  if (questionsQuery.isPending) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centered}>
          <ActivityIndicator color={palette.ink} />
        </View>
      </SafeAreaView>
    );
  }

  // Load error / empty set
  if (questionsQuery.isError || total === 0) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centered}>
          <Text style={s.centeredTitle}>{t("fit.error.loadTitle")}</Text>
          <Text style={s.centeredHint}>{t("fit.error.loadHint")}</Text>
          <PrimaryAction
            label={t("fit.error.retry")}
            onPress={() => void questionsQuery.refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Done
  if (submitted) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centered}>
          <Text style={s.centeredTitle}>{t("fit.done.title")}</Text>
          <Text style={s.centeredHint}>{t("fit.done.subtitle")}</Text>
          <PrimaryAction label={t("fit.done.cta")} onPress={close} />
        </View>
      </SafeAreaView>
    );
  }

  // Intro
  if (!started) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.container}>
          {isDevTestFillEnabled() ? (
            <FitTestFillBar onFillAll={testFillAll} disabled={submit.isPending} />
          ) : null}
          <View style={s.introWrap}>
            <Text style={s.introTitle}>{t("fit.intro.title")}</Text>
            <Text style={s.introSubtitle}>{t("fit.intro.subtitle")}</Text>
            <Text style={s.introDuration}>{t("fit.intro.duration")}</Text>
          </View>
          <View style={s.footer}>
            <Pressable accessibilityRole="button" onPress={close} style={s.backButton}>
              <Text style={s.backLabel}>{t("fit.intro.notNow")}</Text>
            </Pressable>
            <View style={s.primarySlot}>
              <PrimaryAction label={t("fit.intro.start")} onPress={() => setStarted(true)} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const question = questions[index];
  if (!question) return <SafeAreaView style={s.safe} />;

  const isLast = index === total - 1;
  const currentValue = answers[question.id];
  const answered = currentValue !== undefined;
  const questionText = locale === "en" ? question.textEn : question.textPtBr;
  const pct = ((index + 1) / total) * 100;

  const onAnswer = (raw: number) => {
    setAnswers((prev) => ({ ...prev, [question.id]: raw }));
  };

  // DEV-only: answer the current question randomly; advance unless it's the
  // last one (then the enabled submit is one tap away).
  const testFillCurrent = () => {
    setAnswers((prev) => ({ ...prev, [question.id]: randomRaw(question.scaleType) }));
    if (!isLast) setIndex(index + 1);
  };

  const goBack = () => {
    if (index > 0) setIndex(index - 1);
    else setStarted(false);
  };

  const onPrimary = () => {
    if (!isLast) {
      setIndex(index + 1);
      return;
    }
    if (!data) return;
    if (questions.some((q) => answers[q.id] === undefined)) return;
    const payload = questions.map((q) => ({ questionId: q.id, rawValue: answers[q.id] ?? 0 }));
    submit.mutate(
      { data: { questionSetId: data.questionSetId, answers: payload } },
      { onSuccess: () => setSubmitted(true) },
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.track}>
          <View style={[s.fill, { width: `${pct}%` }]} />
        </View>
        <View style={s.progressMeta}>
          <Text style={s.progressText}>
            {t("fit.question.progress", { current: index + 1, total })}
          </Text>
        </View>

        {isDevTestFillEnabled() ? (
          <FitTestFillBar
            onFillCurrent={testFillCurrent}
            onFillAll={testFillAll}
            disabled={submit.isPending}
          />
        ) : null}

        <View style={s.body}>
          <Text style={s.questionText}>{questionText}</Text>
          <LikertScale
            scaleType={question.scaleType}
            value={currentValue}
            onChange={onAnswer}
            labels={{
              min: t("fit.likert.min"),
              max: t("fit.likert.max"),
              no: t("fit.binary.no"),
              yes: t("fit.binary.yes"),
            }}
          />
          {submit.isError ? <Text style={s.centeredHint}>{t("fit.error.submit")}</Text> : null}
        </View>

        <View style={s.footer}>
          <Pressable accessibilityRole="button" onPress={goBack} style={s.backButton}>
            <Text style={s.backLabel}>{t("fit.actions.back")}</Text>
          </Pressable>
          <View style={s.primarySlot}>
            <PrimaryAction
              label={isLast ? t("fit.actions.submit") : t("fit.actions.next")}
              onPress={onPrimary}
              disabled={!answered || submit.isPending}
              loading={isLast && submit.isPending}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
