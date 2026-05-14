<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createGetV1OnboardingSession,
  createPostV1OnboardingSessionComplete,
  createPostV1OnboardingSessionGoto,
  createPostV1OnboardingSessionNext,
  createPostV1OnboardingSessionPrevious,
  createPostV1OnboardingSessionSave,
  sessionQueryKey,
  getV1OnboardingSessionQueryKey,
} from 'api-client';
import type { GetV1OnboardingSession200 } from 'api-client';
import { ArrowLeft, ArrowRight, Check } from 'lucide-svelte';
import { Button, Loader } from 'ui';
import { beforeNavigate, goto } from '$app/navigation';
import PreviewPanel from './preview-panel.svelte';
import OnboardingProgress from './onboarding-progress.svelte';
import OnboardingSidebar from './onboarding-sidebar.svelte';
import StepForm from './step-form.svelte';
import StepMultiItems from './step-multi-items.svelte';
import StepReview from './step-review.svelte';
import StepTheme from './step-theme.svelte';
import StepWelcome from './step-welcome.svelte';
import StepperMobile from './stepper-mobile.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

// Component only mounts after the parent gates on auth.isLoading +
// auth.isAuthenticated, so the session query can be constructed
// once with `enabled: true`. The previous `enabled: () => authenticated`
// form was captured into a non-reactive readable() store by the
// TanStack svelte-query v5 wrapper, leaving the query disabled
// after auth resolved — the bug that left <main> blank.
const session = createGetV1OnboardingSession({ locale: locale.current });

const queryClient = useQueryClient();
const queryKey = $derived(getV1OnboardingSessionQueryKey({ locale: locale.current }));

function invalidateSession() {
  queryClient.invalidateQueries({ queryKey });
}

type Step = GetV1OnboardingSession200['steps'][number] & {
  data?: Array<{
    id: string;
    name: string;
    category: string;
    tags: string[];
    thumbnailUrl?: string | null;
  }>;
};
type SectionItem = NonNullable<NonNullable<GetV1OnboardingSession200['sections']>[number]['items']>[number];

const onboardingData = $derived($session.data);
const steps = $derived<Step[] | undefined>(onboardingData?.steps);
const currentStepId = $derived(onboardingData?.currentStep ?? '');
const currentStep = $derived(steps?.find((s) => s.id === currentStepId));
const progress = $derived(onboardingData?.progress ?? 0);
const strength = $derived(onboardingData?.strength);
const missingRequired = $derived(onboardingData?.missingRequired);
const isLastStep = $derived(!onboardingData?.nextStep || currentStep?.component === 'review');

let stepData = $state<Record<string, string>>({});
let multiItems = $state<SectionItem[]>([]);

$effect(() => {
  if (currentStep) {
    stepData = {};
    multiItems = [];

    if (currentStep.multipleItems && onboardingData?.sections) {
      const section = onboardingData.sections.find(
        (s) => s.sectionTypeKey === currentStep.sectionTypeKey,
      );
      if (section?.items) {
        multiItems = [...section.items];
      }
    } else if (currentStepId) {
      const saved = getSavedDataForStep(currentStepId);
      if (saved) stepData = saved;
    }
  }
});

function getSavedDataForStep(stepId: string): Record<string, string> | null {
  if (!onboardingData || !steps) return null;
  const step = steps.find((s) => s.id === stepId);
  if (!step?.fields) return null;

  const merged: Record<string, string | number | boolean | null | undefined> = {
    ...onboardingData.personalInfo,
    ...onboardingData.professionalProfile,
    ...onboardingData.templateSelection,
    username: onboardingData.username,
  };
  const result: Record<string, string> = {};
  for (const field of step.fields) {
    const val = merged[field.key];
    if (val != null) result[field.key] = String(val);
  }
  return Object.keys(result).length > 0 ? result : null;
}

const nextStep = createPostV1OnboardingSessionNext({
  mutation: { onSuccess: invalidateSession },
});

const prevStep = createPostV1OnboardingSessionPrevious({
  mutation: { onSuccess: invalidateSession },
});

const gotoStep = createPostV1OnboardingSessionGoto({
  mutation: { onSuccess: invalidateSession },
});

let completeError = $state('');

const complete = createPostV1OnboardingSessionComplete({
  mutation: {
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey() });
      goto('/onboarding/done');
    },
    onError(err) {
      completeError = err instanceof Error ? err.message : t('onboarding.stepper.completeError');
    },
  },
});

const saveStep = createPostV1OnboardingSessionSave();
let saveStatus = $state<'idle' | 'saving' | 'saved'>('idle');
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let lastSavedJson = '';
let pendingSaveJson = '';

function flushSave() {
  if (!saveTimer) return;
  clearTimeout(saveTimer);
  saveTimer = null;
  const dataJson = pendingSaveJson;
  if (!dataJson || dataJson === lastSavedJson || dataJson === '{}') return;
  if (!currentStepId || currentStep?.component === 'review' || currentStep?.component === 'welcome')
    return;
  if (currentStep?.multipleItems) return;
  saveStatus = 'saving';
  $saveStep.mutate(
    { data: JSON.parse(dataJson), params: { locale: locale.current } },
    {
      onSuccess() {
        lastSavedJson = dataJson;
        saveStatus = 'saved';
        setTimeout(() => {
          if (saveStatus === 'saved') saveStatus = 'idle';
        }, 2000);
      },
      onError() {
        saveStatus = 'idle';
      },
    },
  );
}

$effect(() => {
  const dataJson = JSON.stringify(stepData);
  if (dataJson === lastSavedJson || dataJson === '{}') return;
  if (!currentStepId || currentStep?.component === 'review' || currentStep?.component === 'welcome')
    return;

  saveStatus = 'idle';
  pendingSaveJson = dataJson;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    if (currentStep?.multipleItems) return;
    saveStatus = 'saving';
    $saveStep.mutate(
      { data: stepData, params: { locale: locale.current } },
      {
        onSuccess() {
          lastSavedJson = dataJson;
          saveStatus = 'saved';
          setTimeout(() => {
            if (saveStatus === 'saved') saveStatus = 'idle';
          }, 2000);
        },
        onError() {
          saveStatus = 'idle';
        },
      },
    );
  }, 2000);

  return () => {
    if (saveTimer) clearTimeout(saveTimer);
  };
});

beforeNavigate(() => {
  flushSave();
});

const isSectionStep = $derived(currentStepId.startsWith('section:'));
const isOptionalStep = $derived(
  isSectionStep || !(currentStep?.fields?.some((f) => f.required) ?? false),
);

let navigating = $state(false);

function handleNext() {
  if (navigating || $nextStep.isPending || $prevStep.isPending || $gotoStep.isPending) return;
  navigating = true;
  const body = currentStep?.multipleItems ? { items: multiItems } : stepData;
  $nextStep.mutate(
    { data: body, params: { locale: locale.current } },
    {
      onSettled: () => {
        navigating = false;
      },
    },
  );
}

function handleSkip() {
  if (navigating || $nextStep.isPending) return;
  navigating = true;
  $nextStep.mutate(
    { data: { noData: true }, params: { locale: locale.current } },
    {
      onSettled: () => {
        navigating = false;
      },
    },
  );
}

function handleBack() {
  if (navigating || $prevStep.isPending) return;
  navigating = true;
  $prevStep.mutate(
    { params: { locale: locale.current } },
    {
      onSettled: () => {
        navigating = false;
      },
    },
  );
}

function handleGoto(stepId: string) {
  if (navigating || $gotoStep.isPending) return;
  navigating = true;
  $gotoStep.mutate(
    { data: { stepId }, params: { locale: locale.current } },
    {
      onSettled: () => {
        navigating = false;
      },
    },
  );
}

function handleComplete() {
  $complete.mutate();
}

const isWelcome = $derived(currentStep?.component === 'welcome');

const isPending = $derived(
  navigating || $nextStep.isPending || $prevStep.isPending || $complete.isPending,
);
</script>

{#if $session.isLoading}
	<div class="flex min-h-screen items-center justify-center pt-14">
		<Loader size={24} />
	</div>
{:else if t && onboardingData && currentStep && steps}
	{@const completedSteps = onboardingData.completedSteps}
	<div class="font-sans antialiased transition-colors duration-300">
		<main class="mx-auto max-w-6xl px-3 sm:px-6" style="padding-top: max(5rem, calc((100vh - 36rem) / 2));">
			{#if isWelcome}
				<StepWelcome step={currentStep} onNext={handleNext} />
			{:else}
				<div class="md:hidden">
					<StepperMobile
						{steps}
						currentStep={currentStepId}
						{completedSteps}
						{progress}
						{strength}
					/>
				</div>

				<div class="flex gap-4 sm:gap-6 md:gap-10">
					<div class="hidden md:block flex-shrink-0">
						<OnboardingSidebar
							{steps}
							currentStep={currentStepId}
							{completedSteps}
							{progress}
							{strength}
							{missingRequired}
							{t}
							ongoto={handleGoto}
						/>
					</div>

					<div class="min-w-0 flex-1 max-w-lg pb-8 sm:pb-12">
						{#if steps.length > 0}
							{@const idx = Math.max(1, steps.findIndex((s) => s.id === currentStepId) + 1)}
							<OnboardingProgress current={idx} total={steps.length} />
						{/if}
						<div class="mb-8 flex items-center justify-between">
							<span class="text-xs font-medium text-gray-500 dark:text-neutral-500">
								{t('onboarding.title')}
							</span>
							{#if saveStatus === 'saving'}
								<Loader size={10} />
							{:else if saveStatus === 'saved'}
								<Check size={10} class="text-green-500" />
							{/if}
						</div>
						<div class="mb-8 text-center">
							<h2 class="text-sm font-bold text-gray-800 dark:text-neutral-200">{currentStep.label}</h2>
							{#if currentStep.description}
								<p class="mt-1 text-[10px] text-gray-500 dark:text-neutral-500">{currentStep.description}</p>
							{/if}
						</div>

						{#if currentStep.component === 'review'}
							<StepReview
								session={onboardingData as Record<string, unknown>}
								{steps}
								{completedSteps}
								ongoto={handleGoto}
							/>
						{:else if currentStep.component === 'template' && currentStep.data}
							{@const stepThemes = currentStep.data}
							<StepTheme
								themes={stepThemes}
								selectedThemeId={stepData.templateId ?? ''}
								onselect={(id) => (stepData = { ...stepData, templateId: id, colorScheme: 'light' })}
							/>
						{:else if (currentStep.multipleItems || currentStep.component === 'generic-section') && currentStep.fields}
							<StepMultiItems
								fields={currentStep.fields}
								items={multiItems}
								{t}
								onupdate={(items) => (multiItems = items)}
							/>
						{:else if currentStep.fields}
							<StepForm
								fields={currentStep.fields}
								data={stepData}
								onupdate={(d) => (stepData = d)}
							/>
						{/if}

						{#if isOptionalStep && !isLastStep && currentStep?.component !== 'welcome'}
							<Button
								variant="ghost"
								size="xs"
								onclick={handleSkip}
								disabled={isPending}
							>
								{t('onboarding.skip')}
							</Button>
						{/if}

						<div class="mt-10 flex items-center justify-between">
							{#if onboardingData.previousStep}
								<Button
									variant="ghost"
									size="sm"
									onclick={handleBack}
									disabled={isPending}
								>
									<ArrowLeft size={14} />
									{t('onboarding.back')}
								</Button>
							{:else}
								<div></div>
							{/if}

							{#if isLastStep}
								<div class="flex flex-col items-end gap-1">
									<Button
										onclick={handleComplete}
										disabled={isPending || !!missingRequired?.length}
										variant="solid"
										class="max-w-[200px]"
									>
										{#if $complete.isPending}
											<Loader size={14} class="mx-auto" />
										{:else}
											{t('onboarding.complete')}
										{/if}
									</Button>
									{#if completeError}
										<span class="text-[11px] text-red-500">{completeError}</span>
									{/if}
								</div>
							{:else}
								<Button
									onclick={handleNext}
									disabled={isPending}
									variant="solid"
									class="max-w-[200px]"
								>
									{#if $nextStep.isPending}
										<Loader size={14} class="mx-auto" />
									{:else}
										<span class="flex items-center justify-center gap-2">
											{t('onboarding.next')}
											<ArrowRight size={14} />
										</span>
									{/if}
								</Button>
							{/if}
						</div>
					</div>
					<div class="hidden xl:block flex-shrink-0">
						<PreviewPanel token="session" />
					</div>
				</div>
			{/if}
		</main>
	</div>
{/if}
