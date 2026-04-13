<script lang="ts">
	import {
		createAdminOnboardingListSteps,
		createAdminOnboardingGetConfig,
		adminOnboardingUpdateStep,
		adminOnboardingDeleteStep,
		getAdminOnboardingListStepsQueryKey,
	} from 'api-client';
	import { browser } from '$app/environment';
	import { colorSchema } from '$lib/color-schema.svelte';
	import { locale } from '$lib/locale.svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { ChevronUp, ChevronDown, Trash2, ToggleLeft, ToggleRight } from 'lucide-svelte';
	import DataTable from '$lib/components/admin/data-table.svelte';
	import StatCard from '$lib/components/admin/stat-card.svelte';
	import ConfirmModal from '$lib/components/admin/confirm-modal.svelte';

	const cs = $derived(colorSchema.mode);
	const t = $derived(locale.t);
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');
	const queryClient = useQueryClient();

	const stepsQuery = createAdminOnboardingListSteps(() => ({
		query: { enabled: browser }
	}));
	const configQuery = createAdminOnboardingGetConfig(() => ({
		query: { enabled: browser }
	}));

	const steps = $derived(
		(((stepsQuery.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.steps as Record<string, unknown>[] ?? []
	);
	const sortedSteps = $derived(
		[...steps].sort((a, b) => ((a.order as number) ?? 0) - ((b.order as number) ?? 0))
	);

	let deleteKey = $state<string | null>(null);
	let deleteLoading = $state(false);

	async function handleToggleActive(step: Record<string, unknown>) {
		await adminOnboardingUpdateStep(step.key as string, {
			body: JSON.stringify({ isActive: !step.isActive }),
			headers: { 'Content-Type': 'application/json' },
		});
		queryClient.invalidateQueries({ queryKey: getAdminOnboardingListStepsQueryKey() });
	}

	async function handleReorder(step: Record<string, unknown>, direction: 'up' | 'down') {
		const currentOrder = (step.order as number) ?? 0;
		const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
		await adminOnboardingUpdateStep(step.key as string, {
			body: JSON.stringify({ order: newOrder }),
			headers: { 'Content-Type': 'application/json' },
		});
		queryClient.invalidateQueries({ queryKey: getAdminOnboardingListStepsQueryKey() });
	}

	async function handleDelete() {
		if (!deleteKey) return;
		deleteLoading = true;
		try {
			await adminOnboardingDeleteStep(deleteKey);
			queryClient.invalidateQueries({ queryKey: getAdminOnboardingListStepsQueryKey() });
		} finally {
			deleteLoading = false;
			deleteKey = null;
		}
	}

	const columns = [
		{ key: 'key', label: t?.('admin.onboarding.stepKey') ?? 'Key' },
		{ key: 'component', label: 'Component' },
		{ key: 'order', label: t?.('admin.onboarding.order') ?? 'Order', width: '80px' },
		{ key: 'isActive', label: t?.('admin.onboarding.isActive') ?? 'Active', width: '80px' },
		{ key: 'actions', label: '', width: '120px' },
	];
</script>

<svelte:head>
	<title>{t?.('admin.onboarding.title') ?? 'Onboarding'}</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-xl font-semibold tracking-tight {text}">
		{t?.('admin.onboarding.title') ?? 'Onboarding Monitoring'}
	</h1>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<StatCard
			label={t?.('admin.onboarding.steps') ?? 'Total Steps'}
			value={steps.length}
			colorSchema={cs}
		/>
		<StatCard
			label={t?.('admin.onboarding.isActive') ?? 'Active Steps'}
			value={steps.filter(s => s.isActive).length}
			colorSchema={cs}
		/>
		<StatCard
			label="Inactive Steps"
			value={steps.filter(s => !s.isActive).length}
			colorSchema={cs}
		/>
	</div>

	<div>
		<h2 class="mb-4 text-sm font-semibold uppercase tracking-widest {muted}">
			{t?.('admin.onboarding.steps') ?? 'Steps Configuration'}
		</h2>

		<DataTable
			{columns}
			data={sortedSteps}
			loading={stepsQuery.isLoading}
			emptyMessage={t?.('admin.onboarding.noSteps') ?? 'No steps configured'}
			colorSchema={cs}
		>
			{#snippet cell({ row, key })}
				{#if key === 'isActive'}
					<button onclick={() => handleToggleActive(row)} class="transition-colors">
						{#if row.isActive}
							<ToggleRight size={20} class="text-emerald-500" />
						{:else}
							<ToggleLeft size={20} class={muted} />
						{/if}
					</button>
				{:else if key === 'actions'}
					<div class="flex items-center gap-1">
						<button
							onclick={(e) => { e.stopPropagation(); handleReorder(row, 'up'); }}
							class="rounded p-1 transition-colors {cs === 'dark' ? 'hover:bg-neutral-700' : 'hover:bg-gray-100'} {muted}"
							title="Move up"
						>
							<ChevronUp size={14} />
						</button>
						<button
							onclick={(e) => { e.stopPropagation(); handleReorder(row, 'down'); }}
							class="rounded p-1 transition-colors {cs === 'dark' ? 'hover:bg-neutral-700' : 'hover:bg-gray-100'} {muted}"
							title="Move down"
						>
							<ChevronDown size={14} />
						</button>
						<button
							onclick={(e) => { e.stopPropagation(); deleteKey = row.key as string; }}
							class="rounded p-1 text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
							title="Delete"
						>
							<Trash2 size={14} />
						</button>
					</div>
				{:else}
					{row[key] ?? '—'}
				{/if}
			{/snippet}
		</DataTable>
	</div>
</div>

<ConfirmModal
	open={deleteKey !== null}
	title={t?.('admin.onboarding.deleteStep') ?? 'Delete Step'}
	message={t?.('admin.onboarding.confirmDeleteStep') ?? 'Are you sure you want to delete this step?'}
	loading={deleteLoading}
	colorSchema={cs}
	onconfirm={handleDelete}
	oncancel={() => deleteKey = null}
/>
