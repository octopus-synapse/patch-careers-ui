<script lang="ts">
	import {
		createAuthSession,
		createOnboardingGetSession,
		createOnboardingNextStep,
		createOnboardingPreviousStep,
		createOnboardingGotoStep,
		createOnboardingCompleteFromSession,
		createOnboardingSaveStepData,
		getOnboardingGetSessionQueryKey,
		getAuthSessionQueryKey
	} from 'api-client';
	import { Button } from 'ui';
	import { goto } from '$app/navigation';
	import { Loader2, ArrowRight, ArrowLeft, Check } from 'lucide-svelte';
	import { colorSchema } from '$lib/color-schema.svelte';
	import { locale } from '$lib/locale.svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import Sidebar from '$lib/components/onboarding/sidebar.svelte';
	import StepperMobile from '$lib/components/onboarding/stepper-mobile.svelte';
	import StepForm from '$lib/components/onboarding/step-form.svelte';
	import StepMultiItems from '$lib/components/onboarding/step-multi-items.svelte';
	import StepTheme from '$lib/components/onboarding/step-theme.svelte';
	import StepReview from '$lib/components/onboarding/step-review.svelte';
	import PreviewPanel from '$lib/components/onboarding/preview-panel.svelte';

	const cs = $derived(colorSchema.mode);
	const t = $derived(locale.t);
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');

	const auth = createAuthSession(() => ({ query: { retry: false } }));
	const authenticated = $derived(auth.data?.data?.data?.authenticated ?? false);

	$effect(() => {
		if (!auth.isLoading && !authenticated) {
			goto('/login');
		}
	});

	const session = createOnboardingGetSession(
		() => ({ locale: locale.current }),
		() => ({ query: { enabled: authenticated } })
	);

	const queryClient = useQueryClient();
	const queryKey = $derived(getOnboardingGetSessionQueryKey({ locale: locale.current }));

	function invalidateSession() {
		queryClient.invalidateQueries({ queryKey });
	}

	const onboardingData = $derived(session.data?.data?.data);
	const steps = $derived(onboardingData?.steps ?? []);
	const currentStepId = $derived(onboardingData?.currentStep ?? '');
	const currentStep = $derived(steps.find((s) => s.id === currentStepId));
	const completedSteps = $derived(onboardingData?.completedSteps ?? []);
	const progress = $derived(onboardingData?.progress ?? 0);
	const strength = $derived((onboardingData as Record<string, unknown> | undefined)?.strength as { score: number; message: string; level: string } | undefined);
	const missingRequired = $derived(((onboardingData as Record<string, unknown> | undefined)?.missingRequired as string[]) ?? []);
	const isLastStep = $derived(!onboardingData?.nextStep);

	let stepData = $state<Record<string, string>>({});
	let multiItems = $state<Array<{ id?: string; content?: Record<string, unknown> }>>([]);

	$effect(() => {
		if (currentStep) {
			stepData = {};
			multiItems = [];

			if (currentStep.multipleItems && onboardingData?.sections) {
				const section = onboardingData.sections.find(
					(s) => s.sectionTypeKey === currentStep.sectionTypeKey
				);
				if (section?.items) {
					multiItems = [...section.items];
				}
			} else {
				const saved = getSavedDataForStep(currentStepId);
				if (saved) stepData = saved;
			}
		}
	});

	function getSavedDataForStep(stepId: string): Record<string, string> | null {
		if (!onboardingData) return null;
		const step = steps.find((s) => s.id === stepId);
		if (!step?.fields) return null;

		const result: Record<string, string> = {};
		for (const field of step.fields) {
			const val = (onboardingData as Record<string, unknown>)[field.key]
				?? (onboardingData.personalInfo as Record<string, unknown> | undefined)?.[field.key]
				?? (onboardingData.professionalProfile as Record<string, unknown> | undefined)?.[field.key]
				?? (onboardingData.templateSelection as Record<string, unknown> | undefined)?.[field.key];
			if (val != null) result[field.key] = String(val);
		}
		return Object.keys(result).length > 0 ? result : null;
	}

	const nextStep = createOnboardingNextStep(() => ({
		mutation: { onSuccess: invalidateSession }
	}));

	const prevStep = createOnboardingPreviousStep(() => ({
		mutation: { onSuccess: invalidateSession }
	}));

	const gotoStep = createOnboardingGotoStep(() => ({
		mutation: { onSuccess: invalidateSession }
	}));

	const complete = createOnboardingCompleteFromSession(() => ({
		mutation: {
			onSuccess() {
				queryClient.invalidateQueries({ queryKey: getAuthSessionQueryKey() });
				goto('/dashboard');
			}
		}
	}));

	const saveStep = createOnboardingSaveStepData();
	let saveStatus = $state<'idle' | 'saving' | 'saved'>('idle');
	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	let lastSavedJson = '';

	$effect(() => {
		const dataJson = JSON.stringify(stepData);
		if (dataJson === lastSavedJson || dataJson === '{}') return;
		if (!currentStepId || currentStep?.component === 'review' || currentStep?.component === 'welcome') return;

		saveStatus = 'idle';
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			if (currentStep?.multipleItems) return;
			saveStatus = 'saving';
			saveStep.mutate(
				{ data: stepData, params: { locale: locale.current } },
				{
					onSuccess() {
						lastSavedJson = dataJson;
						saveStatus = 'saved';
						setTimeout(() => { if (saveStatus === 'saved') saveStatus = 'idle'; }, 2000);
					},
					onError() { saveStatus = 'idle'; }
				}
			);
		}, 2000);

		return () => { if (saveTimer) clearTimeout(saveTimer); };
	});

	const isSectionStep = $derived(currentStepId.startsWith('section:'));

	function handleNext() {
		const body = currentStep?.multipleItems
			? { items: multiItems }
			: stepData;
		nextStep.mutate({ data: body, params: { locale: locale.current } });
	}

	function handleSkip() {
		nextStep.mutate({ data: { noData: true }, params: { locale: locale.current } });
	}

	function handleBack() {
		prevStep.mutate({ params: { locale: locale.current } });
	}

	function handleGoto(stepId: string) {
		gotoStep.mutate({ data: { stepId }, params: { locale: locale.current } });
	}

	function handleComplete() {
		complete.mutate({});
	}

	const isPending = $derived(
		nextStep.isPending || prevStep.isPending || complete.isPending
	);
</script>

<svelte:head>
	<title>{t?.('onboarding.pageTitle') ?? ''}</title>
</svelte:head>

{#if auth.isLoading || session.isLoading}
	<div class="flex min-h-screen items-center justify-center pt-14">
		<Loader2 size={24} class="animate-spin {muted}" />
	</div>
{:else if t && onboardingData && currentStep}
	<div class="font-sans antialiased transition-colors duration-300">
		<main class="mx-auto max-w-6xl px-6" style="padding-top: max(5rem, calc((100vh - 36rem) / 2));">
			<!-- Mobile stepper -->
			<div class="md:hidden">
				<StepperMobile
					{steps}
					currentStep={currentStepId}
					{completedSteps}
					{progress}
					{strength}
					colorSchema={cs}
				/>
			</div>

			<div class="flex gap-10">
				<!-- Desktop sidebar — always at same position -->
				<div class="hidden md:block flex-shrink-0">
					<Sidebar
						{steps}
						currentStep={currentStepId}
						{completedSteps}
						{progress}
						{strength}
						{missingRequired}
						colorSchema={cs}
						{t}
						ongoto={handleGoto}
					/>
				</div>

				<!-- Content — fixed start position, scrolls independently -->
				<div class="min-w-0 flex-1 max-w-lg pb-12">
					<div class="mb-8 flex items-center justify-between">
						<span class="text-[10px] font-semibold uppercase tracking-widest {muted}">
							{t('onboarding.title')}
						</span>
						{#if saveStatus === 'saving'}
							<Loader2 size={10} class="animate-spin {muted}" />
						{:else if saveStatus === 'saved'}
							<Check size={10} class="text-green-500" />
						{/if}
					</div>
					<div class="mb-8 text-center">
						<h2 class="text-sm font-bold {text}">{currentStep.label}</h2>
						{#if currentStep.description}
							<p class="mt-1 text-[10px] {muted}">{currentStep.description}</p>
						{/if}
					</div>

					{#if currentStep.component === 'review'}
						<StepReview
							session={onboardingData}
							{steps}
							{completedSteps}
							colorSchema={cs}
							ongoto={handleGoto}
						/>
					{:else if currentStep.component === 'template' && currentStep.data?.length}
						<StepTheme
							themes={currentStep.data}
							selectedThemeId={stepData.templateId ?? ''}
							colorSchema={cs}
							onselect={(id) => (stepData = { ...stepData, templateId: id, colorScheme: 'light' })}
						/>
					{:else if currentStep.multipleItems}
						<StepMultiItems
							fields={currentStep.fields ?? []}
							items={multiItems}
							colorSchema={cs}
							{t}
							onupdate={(items) => (multiItems = items)}
						/>
					{:else}
						<StepForm
							fields={currentStep.fields ?? []}
							data={stepData}
							colorSchema={cs}
							onupdate={(d) => (stepData = d)}
						/>
					{/if}

					{#if isSectionStep}
						<button
							onclick={handleSkip}
							disabled={isPending}
							class="mt-6 text-[10px] font-semibold uppercase tracking-widest transition-opacity hover:opacity-60 disabled:opacity-30 {muted}"
						>
							{t('onboarding.skip')}
						</button>
					{/if}

					<div class="mt-10 flex items-center justify-between">
						{#if onboardingData.previousStep}
							<button
								onclick={handleBack}
								disabled={isPending}
								class="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-60 disabled:opacity-30 {muted}"
							>
								<ArrowLeft size={14} />
								{t('onboarding.back')}
							</button>
						{:else}
							<div></div>
						{/if}

						{#if isLastStep}
							<Button
								onclick={handleComplete}
								disabled={isPending || missingRequired.length > 0}
								variant="solid"
								colorSchema={cs}
								class="max-w-[200px]"
							>
								{#if complete.isPending}
									<Loader2 size={14} class="mx-auto animate-spin" />
								{:else}
									{t('onboarding.complete')}
								{/if}
							</Button>
						{:else}
							<Button
								onclick={handleNext}
								disabled={isPending}
								variant="solid"
								colorSchema={cs}
								class="max-w-[200px]"
							>
								{#if nextStep.isPending}
									<Loader2 size={14} class="mx-auto animate-spin" />
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
			<!-- Desktop preview -->
			<div class="hidden xl:block flex-shrink-0">
				<PreviewPanel token={auth.data?.data?.data?.accessToken} colorSchema={cs} />
			</div>
		</div>
		</main>
	</div>
{/if}
