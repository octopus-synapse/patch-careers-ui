import {
  getV1OnboardingSessionQueryKey,
  getV1UsersUsernameCheck,
  useGetV1OnboardingSession,
  usePostV1OnboardingSessionComplete,
  usePostV1OnboardingSessionExtras,
  usePostV1OnboardingSessionGoto,
  usePostV1OnboardingSessionNext,
  usePostV1OnboardingSessionPrevious,
} from "@patch-careers/api-client";
import { bootstrap } from "@patch-careers/auth";
import type { Locale } from "@patch-careers/i18n";
import { palette } from "@patch-careers/tokens";
import { Button, Modal, Pill, SegmentedControl, Text, XStack, YStack } from "@patch-careers/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Check, Minus, Plus, Trash2 } from "lucide-react-native";
import { type ReactElement, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { getCompletedOnboardingRoute } from "../../navigation/authRedirect";
import { useI18n } from "../../providers/I18nProvider";
import { LocationAutocomplete } from "./components/LocationAutocomplete";
import { PhoneInput } from "./components/PhoneInput";
import { SectionAddPicker } from "./components/SectionAddPicker";
import {
  buildNextPayload,
  buildReviewSections,
  buildSkipPayload,
  canContinueStep,
  getSavedDataForStep,
  getSavedItemsForStep,
  isOptionalStep,
  isResumeStyleStep,
  isReviewStep,
  isSectionStep,
  isWelcomeStep,
  itemSummary,
  parseResumeStyles,
  validateStepFields,
  visibleFields,
} from "./helpers";
import {
  clearSessionSnapshot,
  clearStepDraft,
  readSessionSnapshot,
  readStepDraft,
  saveSessionSnapshot,
  saveStepDraft,
} from "./storage";
import type {
  FormData,
  OnboardingField,
  OnboardingSession,
  OnboardingStep,
  ResumeStyleOption,
  SectionItem,
} from "./types";

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const response = (error as { response?: unknown }).response;
  if (!response || typeof response !== "object") return undefined;
  const status = (response as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

export function OnboardingWizard(): ReactElement {
  const { locale, t, setLocale } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionKey = useMemo(() => getV1OnboardingSessionQueryKey({ locale }), [locale]);
  const [fallbackSession, setFallbackSession] = useState<OnboardingSession | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [items, setItems] = useState<SectionItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completeError, setCompleteError] = useState("");
  const refreshedAuthRef = useRef(false);
  const resyncedStepRef = useRef(false);

  const sessionQuery = useGetV1OnboardingSession({ locale });
  const session = sessionQuery.data ?? fallbackSession ?? undefined;
  const currentStep = session?.steps.find((step) => step.id === session.currentStep);
  const hasStepMismatch = Boolean(session && !currentStep && session.steps?.length);

  const retryLoad = async () => {
    // Prefer server truth over any possibly-corrupt local snapshot.
    setFallbackSession(null);
    await clearSessionSnapshot();
    resyncedStepRef.current = false;
    refreshedAuthRef.current = false;
    await sessionQuery.refetch();
  };

  const persistSession = async (nextSession: OnboardingSession) => {
    queryClient.setQueryData(sessionKey, nextSession);
    setFallbackSession(nextSession);
    await saveSessionSnapshot(nextSession);
  };

  const nextStep = usePostV1OnboardingSessionNext({
    mutation: {
      onSuccess: (data) => {
        void persistSession(data);
      },
    },
  });
  const previousStep = usePostV1OnboardingSessionPrevious({
    mutation: {
      onSuccess: (data) => {
        void persistSession(data);
      },
    },
  });
  const gotoStep = usePostV1OnboardingSessionGoto({
    mutation: {
      onSuccess: (data) => {
        void persistSession(data);
      },
    },
  });
  const extras = usePostV1OnboardingSessionExtras({
    mutation: {
      onSuccess: (data) => {
        void persistSession(data);
      },
    },
  });
  const complete = usePostV1OnboardingSessionComplete({
    mutation: {
      async onSuccess() {
        await clearSessionSnapshot();
        await bootstrap().catch(() => undefined);
        router.replace(getCompletedOnboardingRoute());
      },
      onError(error) {
        setCompleteError(error.response?.data?.message ?? t("onboarding.completeFailed"));
      },
    },
  });

  const isPending =
    nextStep.isPending ||
    previousStep.isPending ||
    gotoStep.isPending ||
    extras.isPending ||
    complete.isPending;

  useEffect(() => {
    void readSessionSnapshot().then((snapshot) => {
      if (!sessionQuery.data && snapshot) setFallbackSession(snapshot);
    });
  }, [sessionQuery.data]);

  useEffect(() => {
    // Token/session can expire mid-onboarding; try a silent refresh once.
    const status = getErrorStatus(sessionQuery.error);
    if (status !== 401 || refreshedAuthRef.current) return;
    refreshedAuthRef.current = true;
    void bootstrap()
      .catch(() => undefined)
      .then(() => sessionQuery.refetch())
      .catch(() => undefined);
  }, [sessionQuery.error, sessionQuery.refetch]);

  useEffect(() => {
    if (sessionQuery.data) void saveSessionSnapshot(sessionQuery.data);
  }, [sessionQuery.data]);

  useEffect(() => {
    // Defensive: if API returns a currentStep that isn't in steps (can happen after
    // locale/extras changes), move to a valid step so the wizard can recover.
    if (!session || !hasStepMismatch || isPending || resyncedStepRef.current) return;
    const safeStepId =
      (session.nextStep && session.steps.some((step) => step.id === session.nextStep)
        ? session.nextStep
        : session.steps[0]?.id) ?? null;
    if (!safeStepId) return;
    resyncedStepRef.current = true;
    gotoStep.mutate({ data: { stepId: safeStepId }, params: { locale } });
  }, [gotoStep, hasStepMismatch, isPending, locale, session]);

  useEffect(() => {
    if (!session || !currentStep) return;
    setErrors({});
    const savedData = getSavedDataForStep(session, currentStep);
    const savedItems = getSavedItemsForStep(session, currentStep);
    setFormData(savedData);
    setItems(savedItems);
    void readStepDraft(currentStep.id).then((draft) => {
      if (!draft || session.currentStep !== currentStep.id) return;
      if (Object.keys(draft.data).length > 0) setFormData((prev) => ({ ...prev, ...draft.data }));
      if (draft.items.length > 0) setItems(draft.items);
    });
  }, [currentStep, session]);

  useEffect(() => {
    if (!currentStep || isReviewStep(currentStep) || isWelcomeStep(currentStep)) return;
    void saveStepDraft(currentStep.id, formData, items);
  }, [currentStep, formData, items]);

  async function handleAddSection(extraId: string) {
    if (isPending) return;
    const nextExtras = Array.from(new Set([...(session?.activatedExtras ?? []), extraId]));
    await extras.mutateAsync({ data: { extras: nextExtras }, params: { locale } });
    await gotoStep.mutateAsync({ data: { stepId: extraId }, params: { locale } });
  }

  async function handleNext() {
    if (!currentStep || isPending) return;
    const nextErrors = validateStepFields(currentStep, formData);
    setErrors(nextErrors);
    if (!canContinueStep(currentStep, formData, items)) return;

    await nextStep.mutateAsync({
      data: buildNextPayload(currentStep, formData, items),
      params: { locale },
    });
    await clearStepDraft(currentStep.id);
  }

  async function handleSkip() {
    if (!currentStep || isPending) return;
    await nextStep.mutateAsync({
      data: buildSkipPayload(),
      params: { locale },
    });
    await clearStepDraft(currentStep.id);
  }

  async function handleBack() {
    if (isPending) return;
    await previousStep.mutateAsync({ params: { locale } });
  }

  async function handleGoto(stepId: string) {
    if (isPending) return;
    await gotoStep.mutateAsync({ data: { stepId }, params: { locale } });
  }

  function handleComplete() {
    if (session?.missingRequired?.length) {
      setCompleteError(t("onboarding.missingRequired"));
      return;
    }
    complete.mutate();
  }

  if (sessionQuery.isLoading && !fallbackSession) {
    return <CenteredState label={t("common.loading")} />;
  }

  if (!session || !currentStep) {
    return (
      <CenteredState
        label={
          hasStepMismatch || sessionQuery.isFetching
            ? t("common.loading")
            : t("onboarding.loadFailed")
        }
        actionLabel={t("common.retry")}
        onAction={() => void retryLoad()}
      />
    );
  }

  const showComplete = isReviewStep(currentStep) || !session.nextStep;
  const showSkip = isOptionalStep(currentStep) && !showComplete && !isWelcomeStep(currentStep);
  const canContinue = canContinueStep(currentStep, formData, items);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <ProgressHeader session={session} step={currentStep} />

        <View style={styles.card}>
          <Text
            preset="caption"
            color={palette.gray[500]}
            textTransform="uppercase"
            letterSpacing={1.6}
          >
            {t("onboarding.title")}
          </Text>
          <Text preset="h2" color={palette.gray[900]} marginTop={12}>
            {currentStep.label}
          </Text>
          {currentStep.description ? (
            <Text preset="caption" color={palette.gray[500]} marginTop={6}>
              {currentStep.description}
            </Text>
          ) : null}

          <View style={styles.stepBody}>
            {isWelcomeStep(currentStep) ? (
              <LanguageStep locale={locale} onSelect={setLocale} t={t} />
            ) : isReviewStep(currentStep) ? (
              <ReviewSummary
                session={session}
                steps={session.steps}
                onEdit={(stepId) => void handleGoto(stepId)}
                onAddSection={(extraId) => void handleAddSection(extraId)}
                addPending={extras.isPending || gotoStep.isPending}
                t={t}
              />
            ) : isResumeStyleStep(currentStep) ? (
              <ResumeStylePicker
                step={currentStep}
                selectedId={formData.resumeStyleId ?? session.resumeStyleId ?? ""}
                onSelect={(resumeStyleId) => {
                  setFormData({ resumeStyleId });
                  setErrors({});
                }}
              />
            ) : currentStep.sectionTypeKey === "work_experience_v1" ? (
              <WorkExperienceStep step={currentStep} items={items} onChange={setItems} t={t} />
            ) : isSectionStep(currentStep) ? (
              <MultiItemStep step={currentStep} items={items} onChange={setItems} t={t} />
            ) : (
              <StepForm step={currentStep} data={formData} errors={errors} onChange={setFormData} />
            )}
          </View>

          {showSkip ? (
            <Button
              variant="ghost"
              intent="neutral"
              size="sm"
              onPress={() => void handleSkip()}
              disabled={isPending}
            >
              {currentStep.noDataLabel ?? t("onboarding.skip")}
            </Button>
          ) : null}

          <XStack marginTop={28} alignItems="center" justifyContent="space-between" gap={12}>
            {session.previousStep ? (
              <Button
                variant="ghost"
                intent="neutral"
                size="md"
                onPress={() => void handleBack()}
                disabled={isPending}
              >
                {t("onboarding.back")}
              </Button>
            ) : (
              <View />
            )}
            {showComplete ? (
              <YStack alignItems="flex-end" gap={6}>
                <Button
                  intent="accent"
                  size="lg"
                  loading={complete.isPending}
                  disabled={isPending || Boolean(session.missingRequired?.length)}
                  onPress={handleComplete}
                  testID="onboarding.complete"
                >
                  {t("onboarding.complete")}
                </Button>
                {completeError ? (
                  <Text preset="caption" color={palette.red[600]}>
                    {completeError}
                  </Text>
                ) : null}
              </YStack>
            ) : (
              <Button
                intent="accent"
                size="lg"
                loading={nextStep.isPending}
                disabled={isPending || !canContinue}
                onPress={() => void handleNext()}
                testID="onboarding.next"
              >
                {t("onboarding.next")}
              </Button>
            )}
          </XStack>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CenteredState({
  actionLabel,
  label,
  onAction,
}: {
  actionLabel?: string;
  label: string;
  onAction?: () => void;
}): ReactElement {
  return (
    <SafeAreaView style={styles.centered}>
      <ActivityIndicator color={palette.blue[600]} />
      <Text preset="body" color={palette.gray[600]} textAlign="center">
        {label}
      </Text>
      {actionLabel && onAction ? (
        <Button variant="ghost" intent="neutral" onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </SafeAreaView>
  );
}

function ProgressHeader({ session, step }: { session: OnboardingSession; step: OnboardingStep }) {
  const score = session.strength?.score ?? session.progress;
  const message = session.strength?.message ?? `${session.progress}%`;
  const stepIndex = Math.max(
    0,
    session.steps.findIndex((item) => item.id === step.id),
  );
  return (
    <View style={styles.progressHeader}>
      <XStack justifyContent="space-between" alignItems="center">
        <Text preset="caption" color={palette.gray[500]}>
          {stepIndex + 1}/{session.steps.length}
        </Text>
        <Text preset="caption" color={palette.gray[500]}>
          {message}
        </Text>
      </XStack>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, score))}%` }]} />
      </View>
    </View>
  );
}

function StepForm({
  data,
  errors,
  onChange,
  step,
}: {
  data: FormData;
  errors: Record<string, string>;
  onChange: (data: FormData) => void;
  step: OnboardingStep;
}): ReactElement {
  // Selecting a location surfaces its country, used to default the phone
  // country when both live in the same step (personal-info).
  const [phoneCountryIso, setPhoneCountryIso] = useState<string | undefined>(undefined);
  return (
    <YStack gap={18}>
      {visibleFields(step).map((field) => {
        const fieldError = errors[field.key];
        const errorProps = fieldError ? { error: fieldError } : {};
        if (field.key === "location") {
          return (
            <LocationAutocomplete
              key={field.key}
              label={field.label}
              value={data[field.key] ?? ""}
              onChange={(label, meta) => {
                onChange({ ...data, location: label });
                if (meta?.countryCode) setPhoneCountryIso(meta.countryCode);
              }}
              {...errorProps}
            />
          );
        }
        if (field.key === "phone") {
          return (
            <PhoneInput
              key={field.key}
              label={field.label}
              value={data[field.key] ?? ""}
              onChange={(value) => onChange({ ...data, phone: value })}
              {...(phoneCountryIso ? { defaultCountryIso: phoneCountryIso } : {})}
              {...errorProps}
            />
          );
        }
        return (
          <FieldRenderer
            key={field.key}
            field={field}
            value={data[field.key] ?? ""}
            {...errorProps}
            onChange={(value) => {
              // Suggest the headline from the job title until the user
              // edits it themselves (both live on professional-profile).
              if (field.key === "jobTitle" && !data.headline?.trim()) {
                onChange({ ...data, jobTitle: value, headline: value });
              } else {
                onChange({ ...data, [field.key]: value });
              }
            }}
          />
        );
      })}
    </YStack>
  );
}

function LanguageStep({
  locale,
  onSelect,
  t,
}: {
  locale: Locale;
  onSelect: (locale: Locale) => void;
  t: (key: string) => string;
}): ReactElement {
  return (
    <YStack gap={12}>
      <Text preset="body" color={palette.gray[600]}>
        {t("onboarding.language.prompt")}
      </Text>
      <SegmentedControl<Locale>
        items={[
          { value: "en", label: "English" },
          { value: "pt-BR", label: "Português" },
        ]}
        value={locale}
        onChange={onSelect}
        accessibilityLabel={t("onboarding.language.prompt")}
      />
    </YStack>
  );
}

function FieldRenderer({
  error,
  field,
  onChange,
  value,
}: {
  error?: string;
  field: OnboardingField;
  onChange: (value: string) => void;
  value: string;
}): ReactElement {
  const [focused, setFocused] = useState(false);
  const [usernameState, setUsernameState] = useState<
    "idle" | "checking" | "available" | "unavailable"
  >("idle");
  const examples = field.examples ?? [];
  const placeholder = focused ? "" : (examples[0] ?? field.label);
  const multiline = field.type === "textarea" || field.widget === "textarea";
  const hasOptions = field.type === "select" || Boolean(field.options?.length);

  useEffect(() => {
    if (field.key !== "username") return;
    const username = value.trim();
    if (username.length < 3) {
      setUsernameState("idle");
      return;
    }
    setUsernameState("checking");
    const timer = setTimeout(() => {
      void getV1UsersUsernameCheck({ username })
        .then((result) => setUsernameState(result.available ? "available" : "unavailable"))
        .catch(() => setUsernameState("idle"));
    }, 450);
    return () => clearTimeout(timer);
  }, [field.key, value]);

  return (
    <View>
      <XStack alignItems="center" gap={4}>
        <Text preset="caption" color={palette.gray[600]} fontWeight="700">
          {field.label}
        </Text>
        {field.required ? (
          <Text preset="caption" color={palette.red[600]}>
            *
          </Text>
        ) : null}
      </XStack>

      {hasOptions ? (
        <View style={styles.optionWrap}>
          {(field.options ?? []).map((option) => {
            const selected = option === value;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onChange(option)}
                style={[styles.optionPill, selected && styles.optionPillSelected]}
              >
                <Text preset="caption" color={selected ? palette.gray[50] : palette.gray[700]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={palette.gray[400]}
          multiline={multiline}
          keyboardType={
            field.type === "email" ? "email-address" : field.type === "url" ? "url" : "default"
          }
          autoCapitalize={
            field.key === "username" || field.type === "email" || field.type === "url"
              ? "none"
              : "sentences"
          }
          autoCorrect={field.type !== "url" && field.type !== "email" && field.key !== "username"}
          style={[styles.input, multiline && styles.textarea, error && styles.inputError]}
        />
      )}

      {field.key === "username" && usernameState !== "idle" ? (
        <Text
          preset="caption"
          color={
            usernameState === "available"
              ? palette.green[600]
              : usernameState === "unavailable"
                ? palette.red[600]
                : palette.gray[500]
          }
          marginTop={6}
        >
          {usernameState === "checking"
            ? "Verificando..."
            : usernameState === "available"
              ? "Username disponível"
              : "Username indisponível"}
        </Text>
      ) : null}
      {error ? (
        <Text preset="caption" color={palette.red[600]} marginTop={6}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

type ExperienceStatus =
  | "employed"
  | "unemployed"
  | "student"
  | "freelancer"
  | "entrepreneur"
  | "retired";

const EXPERIENCE_STATUSES: ReadonlyArray<{ value: ExperienceStatus; labelKey: string }> = [
  { value: "employed", labelKey: "onboarding.experience.statusEmployed" },
  { value: "unemployed", labelKey: "onboarding.experience.statusUnemployed" },
  { value: "student", labelKey: "onboarding.experience.statusStudent" },
  { value: "freelancer", labelKey: "onboarding.experience.statusFreelancer" },
  { value: "entrepreneur", labelKey: "onboarding.experience.statusEntrepreneur" },
  { value: "retired", labelKey: "onboarding.experience.statusRetired" },
];

/**
 * Work experience step — a quick occupation-status selector (NOT persisted,
 * it only frames the guidance) on top of the standard multi-item editor.
 * The "current job" is simply the first entry with an empty end date.
 */
function WorkExperienceStep({
  items,
  onChange,
  step,
  t,
}: {
  items: SectionItem[];
  onChange: (items: SectionItem[]) => void;
  step: OnboardingStep;
  t: (key: string) => string;
}): ReactElement {
  const [status, setStatus] = useState<ExperienceStatus>("employed");
  const pastOnly = status === "unemployed" || status === "retired";
  return (
    <YStack gap={14}>
      <Text preset="caption" color={palette.gray[600]} fontWeight="700">
        {t("onboarding.experience.statusPrompt")}
      </Text>
      <XStack flexWrap="wrap" gap={8}>
        {EXPERIENCE_STATUSES.map((option) => (
          <Pill
            key={option.value}
            intent="accent"
            selected={status === option.value}
            onPress={() => setStatus(option.value)}
          >
            {t(option.labelKey)}
          </Pill>
        ))}
      </XStack>
      <Text preset="caption" color={palette.gray[500]}>
        {pastOnly ? t("onboarding.experience.hintPast") : t("onboarding.experience.hintCurrent")}
      </Text>
      <MultiItemStep step={step} items={items} onChange={onChange} t={t} />
    </YStack>
  );
}

function MultiItemStep({
  items,
  onChange,
  step,
  t,
}: {
  items: SectionItem[];
  onChange: (items: SectionItem[]) => void;
  step: OnboardingStep;
  t: (key: string) => string;
}): ReactElement {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [modalData, setModalData] = useState<FormData>({});
  const [modalErrors, setModalErrors] = useState<Record<string, string>>({});
  const open = editingIndex !== null;

  function openNew() {
    setEditingIndex(items.length);
    setModalData({});
    setModalErrors({});
  }

  function openExisting(index: number) {
    const content = items[index]?.content ?? {};
    setEditingIndex(index);
    setModalData(
      Object.fromEntries(Object.entries(content).map(([key, value]) => [key, String(value ?? "")])),
    );
    setModalErrors({});
  }

  function saveItem() {
    const nextErrors = validateStepFields(step, modalData);
    setModalErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || editingIndex === null) return;
    const next = items.slice();
    next[editingIndex] = { content: { ...modalData } };
    onChange(next);
    setEditingIndex(null);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <View>
      {items.length === 0 ? (
        <Text preset="body" color={palette.gray[500]}>
          {step.placeholder ?? t("onboarding.noData")}
        </Text>
      ) : (
        <YStack gap={10}>
          {items.map((item, index) => (
            <Pressable
              key={item.id ?? `${index}-${itemSummary(item)}`}
              onPress={() => openExisting(index)}
              style={styles.itemRow}
            >
              <Text preset="body" color={palette.gray[800]} flex={1}>
                {itemSummary(item)}
              </Text>
              <Pressable accessibilityRole="button" onPress={() => removeItem(index)} hitSlop={8}>
                <Trash2 size={16} color={palette.red[600]} />
              </Pressable>
            </Pressable>
          ))}
        </YStack>
      )}

      <Button variant="ghost" intent="neutral" size="sm" onPress={openNew} marginTop={14}>
        <XStack gap={8} alignItems="center">
          <Plus size={14} color={palette.gray[700]} />
          <Text preset="caption" color={palette.gray[700]}>
            {step.addLabel ?? t("onboarding.addItem")}
          </Text>
        </XStack>
      </Button>

      <Modal
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setEditingIndex(null);
        }}
        title={step.addLabel ?? t("onboarding.addItem")}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <StepForm step={step} data={modalData} errors={modalErrors} onChange={setModalData} />
          <XStack marginTop={18} justifyContent="flex-end">
            <Button intent="accent" onPress={saveItem}>
              {t("common.save")}
            </Button>
          </XStack>
        </ScrollView>
      </Modal>
    </View>
  );
}

function ResumeStylePicker({
  onSelect,
  selectedId,
  step,
}: {
  onSelect: (id: string) => void;
  selectedId: string;
  step: OnboardingStep;
}): ReactElement {
  const stylesList = parseResumeStyles(step);
  if (stylesList.length === 0) {
    return (
      <StepForm
        step={step}
        data={selectedId ? { resumeStyleId: selectedId } : {}}
        errors={{}}
        onChange={(data) => onSelect(data.resumeStyleId ?? "")}
      />
    );
  }
  return (
    <YStack gap={12}>
      {stylesList.map((style) => (
        <ResumeStyleCard
          key={style.id}
          option={style}
          selected={style.id === selectedId}
          onPress={() => onSelect(style.id)}
        />
      ))}
    </YStack>
  );
}

function ResumeStyleCard({
  onPress,
  option,
  selected,
}: {
  onPress: () => void;
  option: ResumeStyleOption;
  selected: boolean;
}): ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.styleCard, selected && styles.styleCardSelected]}
    >
      {option.thumbnailUrl ? (
        <Image source={{ uri: option.thumbnailUrl }} style={styles.styleImage} />
      ) : null}
      <YStack flex={1} gap={4}>
        <XStack alignItems="center" gap={8}>
          <Text preset="body" color={palette.gray[900]} fontWeight="700">
            {option.name}
          </Text>
          {selected ? <Check size={14} color={palette.gray[900]} /> : null}
        </XStack>
        {option.description ? (
          <Text preset="caption" color={palette.gray[500]}>
            {option.description}
          </Text>
        ) : null}
        {option.atsScore ? (
          <Text preset="caption" color={palette.green[700]}>
            ATS {option.atsScore}/100
          </Text>
        ) : null}
      </YStack>
    </Pressable>
  );
}

function ReviewSummary({
  addPending,
  onAddSection,
  onEdit,
  session,
  steps,
  t,
}: {
  addPending: boolean;
  onAddSection: (extraId: string) => void;
  onEdit: (stepId: string) => void;
  session: OnboardingSession;
  steps: OnboardingStep[];
  t: (key: string) => string;
}): ReactElement {
  const sections = buildReviewSections(session, steps);
  const [pickerOpen, setPickerOpen] = useState(false);
  const activated = new Set(session.activatedExtras ?? []);
  const options = (session.availableExtras ?? [])
    .filter((extra) => !activated.has(extra.id))
    .map((extra) => ({
      id: extra.id,
      label: extra.label,
      icon: extra.icon,
    }));
  return (
    <YStack gap={12}>
      {sections.map((section) => (
        <Pressable
          key={section.stepId}
          style={styles.reviewCard}
          onPress={() => onEdit(section.stepId)}
        >
          <XStack alignItems="center" gap={8} marginBottom={10}>
            {section.skipped ? (
              <Minus size={13} color={palette.gray[500]} />
            ) : (
              <Check size={13} color={palette.green[600]} />
            )}
            <Text
              preset="caption"
              color={palette.gray[500]}
              textTransform="uppercase"
              letterSpacing={1.4}
            >
              {section.label}
            </Text>
          </XStack>
          {section.skipped ? (
            <Text preset="caption" color={palette.gray[500]}>
              Pulado
            </Text>
          ) : section.styleName ? (
            <XStack gap={12} alignItems="center">
              {section.stylePreviewUrl ? (
                <Image source={{ uri: section.stylePreviewUrl }} style={styles.reviewImage} />
              ) : null}
              <Text preset="body" color={palette.gray[800]}>
                {section.styleName}
              </Text>
            </XStack>
          ) : (
            <YStack gap={8}>
              {section.entries.map((entry) => (
                <XStack
                  key={`${entry.label}:${entry.value}`}
                  justifyContent="space-between"
                  gap={12}
                >
                  {entry.label ? (
                    <Text preset="caption" color={palette.gray[500]} flex={1}>
                      {entry.label}
                    </Text>
                  ) : null}
                  <Text
                    preset="caption"
                    color={palette.gray[800]}
                    flex={2}
                    textAlign={entry.long ? "left" : "right"}
                  >
                    {entry.value}
                  </Text>
                </XStack>
              ))}
            </YStack>
          )}
        </Pressable>
      ))}

      {options.length > 0 ? (
        <Button
          variant="outlined"
          intent="accent"
          size="md"
          onPress={() => setPickerOpen(true)}
          disabled={addPending}
          loading={addPending}
        >
          <XStack gap={8} alignItems="center">
            <Plus size={14} color={palette.blue[600]} />
            <Text preset="caption" color={palette.blue[600]}>
              {t("onboarding.addSection")}
            </Text>
          </XStack>
        </Button>
      ) : null}

      <SectionAddPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        options={options}
        onPick={(id) => {
          setPickerOpen(false);
          onAddSection(id);
        }}
        title={t("onboarding.addSection")}
      />
    </YStack>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.gray[50],
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
    backgroundColor: palette.gray[50],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingBottom: 40,
  },
  progressHeader: {
    marginBottom: 18,
  },
  progressTrack: {
    height: 6,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: palette.gray[200],
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: palette.blue[600],
  },
  card: {
    borderWidth: 1,
    borderColor: palette.gray[200],
    backgroundColor: "white",
    borderRadius: 24,
    padding: 20,
  },
  stepBody: {
    marginTop: 24,
  },
  input: {
    minHeight: 46,
    borderBottomWidth: 1,
    borderBottomColor: palette.gray[300],
    color: palette.gray[900],
    fontSize: 15,
    paddingVertical: 10,
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  inputError: {
    borderBottomColor: palette.red[600],
  },
  optionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  optionPill: {
    borderWidth: 1,
    borderColor: palette.gray[200],
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "white",
  },
  optionPillSelected: {
    borderColor: palette.gray[900],
    backgroundColor: palette.gray[900],
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.gray[200],
    paddingVertical: 14,
  },
  styleCard: {
    flexDirection: "row",
    gap: 14,
    borderWidth: 1,
    borderColor: palette.gray[200],
    borderRadius: 18,
    backgroundColor: "white",
    padding: 14,
  },
  styleCardSelected: {
    borderColor: palette.gray[900],
  },
  styleImage: {
    width: 64,
    height: 84,
    borderRadius: 8,
    backgroundColor: palette.gray[100],
  },
  reviewCard: {
    borderWidth: 1,
    borderColor: palette.gray[200],
    borderRadius: 18,
    backgroundColor: "white",
    padding: 16,
  },
  reviewImage: {
    width: 52,
    height: 68,
    borderRadius: 6,
    backgroundColor: palette.gray[100],
  },
});
