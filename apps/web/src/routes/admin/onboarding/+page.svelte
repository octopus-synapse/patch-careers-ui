<script lang="ts">
	import {
		createAdminOnboardingListSteps,
		createAdminOnboardingGetConfig,
		adminOnboardingCreateStep,
		adminOnboardingUpdateStep,
		adminOnboardingDeleteStep,
		adminOnboardingUpdateConfig,
		getAdminOnboardingListStepsQueryKey,
		getAdminOnboardingGetConfigQueryKey,
	} from 'api-client';
	import { browser } from '$app/environment';
	import { colorSchema } from '$lib/color-schema.svelte';
	import { locale } from '$lib/locale.svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { ChevronUp, ChevronDown, Trash2, ToggleLeft, ToggleRight, Plus, Pencil, Settings } from 'lucide-svelte';
	import { Button, Input, Tooltip } from 'ui';
	import DataTable from '$lib/components/admin/data-table.svelte';
	import StatCard from '$lib/components/admin/stat-card.svelte';
	import ConfirmModal from '$lib/components/admin/confirm-modal.svelte';
	import FormModal from '$lib/components/admin/form-modal.svelte';

	const cs = $derived(colorSchema.mode);
	const t = $derived(locale.t);
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');
	const cardBg = $derived(cs === 'dark' ? 'bg-neutral-800/50' : 'bg-white');
	const cardBorder = $derived(cs === 'dark' ? 'border-neutral-700/50' : 'border-gray-200');
	const labelClass = $derived(`text-[10px] font-bold uppercase tracking-widest ${muted}`);
	const queryClient = useQueryClient();

	const stepsQuery = createAdminOnboardingListSteps(() => ({ query: { enabled: browser } }));
	const configQuery = createAdminOnboardingGetConfig(() => ({ query: { enabled: browser } }));

	const steps = $derived(
		(((stepsQuery.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.steps as Record<string, unknown>[] ?? []
	);
	const sortedSteps = $derived([...steps].sort((a, b) => ((a.order as number) ?? 0) - ((b.order as number) ?? 0)));
	const config = $derived(
		(((configQuery.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.config as Record<string, unknown> | undefined
	);
	const strengthLevels = $derived((config?.strengthLevels as Record<string, unknown>[]) ?? []);

	function jsonBody(data: Record<string, unknown>): RequestInit {
		return { body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } };
	}

	// --- Delete ---
	let deleteKey = $state<string | null>(null);
	let deleteLoading = $state(false);

	// --- Step form ---
	let stepModal = $state<{ mode: 'create' | 'edit'; key?: string } | null>(null);
	let stepLoading = $state(false);
	let stepKey = $state('');
	let stepComponent = $state('');
	let stepIcon = $state('📄');
	let stepOrder = $state('0');
	let stepRequired = $state(false);
	let stepSectionTypeKey = $state('');
	let stepStrengthWeight = $state('0');
	let stepIsActive = $state(true);

	// --- Config form ---
	let configModal = $state(false);
	let configLoading = $state(false);
	let configLevels = $state<{ minScore: string; level: string; message: string }[]>([]);

	function openCreateStep() {
		stepModal = { mode: 'create' };
		stepKey = ''; stepComponent = ''; stepIcon = '📄'; stepOrder = String(sortedSteps.length);
		stepRequired = false; stepSectionTypeKey = ''; stepStrengthWeight = '0'; stepIsActive = true;
	}

	function openEditStep(step: Record<string, unknown>) {
		stepModal = { mode: 'edit', key: step.key as string };
		stepKey = (step.key as string) ?? '';
		stepComponent = (step.component as string) ?? '';
		stepIcon = (step.icon as string) ?? '📄';
		stepOrder = String((step.order as number) ?? 0);
		stepRequired = (step.required as boolean) ?? false;
		stepSectionTypeKey = (step.sectionTypeKey as string) ?? '';
		stepStrengthWeight = String((step.strengthWeight as number) ?? 0);
		stepIsActive = (step.isActive as boolean) ?? true;
	}

	async function handleStepSubmit() {
		stepLoading = true;
		try {
			const data = {
				key: stepKey, component: stepComponent, icon: stepIcon, order: Number(stepOrder),
				required: stepRequired, sectionTypeKey: stepSectionTypeKey || null,
				strengthWeight: Number(stepStrengthWeight), isActive: stepIsActive,
			};
			if (stepModal?.mode === 'create') {
				await adminOnboardingCreateStep(jsonBody(data));
			} else {
				await adminOnboardingUpdateStep(stepModal!.key!, jsonBody(data));
			}
			queryClient.invalidateQueries({ queryKey: getAdminOnboardingListStepsQueryKey() });
			stepModal = null;
		} finally {
			stepLoading = false;
		}
	}

	async function handleToggleActive(step: Record<string, unknown>) {
		await adminOnboardingUpdateStep(step.key as string, jsonBody({ isActive: !step.isActive }));
		queryClient.invalidateQueries({ queryKey: getAdminOnboardingListStepsQueryKey() });
	}

	async function handleReorder(step: Record<string, unknown>, direction: 'up' | 'down') {
		const currentOrder = (step.order as number) ?? 0;
		const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
		await adminOnboardingUpdateStep(step.key as string, jsonBody({ order: newOrder }));
		queryClient.invalidateQueries({ queryKey: getAdminOnboardingListStepsQueryKey() });
	}

	async function handleDelete() {
		if (!deleteKey) return;
		deleteLoading = true;
		try {
			await adminOnboardingDeleteStep(deleteKey);
			queryClient.invalidateQueries({ queryKey: getAdminOnboardingListStepsQueryKey() });
		} finally { deleteLoading = false; deleteKey = null; }
	}

	function openConfigEdit() {
		configLevels = strengthLevels.map(l => ({
			minScore: String((l.minScore as number) ?? 0),
			level: (l.level as string) ?? '',
			message: (l.message as string) ?? '',
		}));
		if (configLevels.length === 0) {
			configLevels = [
				{ minScore: '0', level: 'weak', message: 'Your profile needs work' },
				{ minScore: '40', level: 'medium', message: 'Getting better' },
				{ minScore: '70', level: 'strong', message: 'Looking great!' },
			];
		}
		configModal = true;
	}

	function addConfigLevel() {
		configLevels = [...configLevels, { minScore: '0', level: '', message: '' }];
	}

	function removeConfigLevel(index: number) {
		configLevels = configLevels.filter((_, i) => i !== index);
	}

	async function handleConfigSubmit() {
		configLoading = true;
		try {
			await adminOnboardingUpdateConfig(jsonBody({ strengthLevels: configLevels.map(l => ({ ...l, minScore: Number(l.minScore) })) }));
			queryClient.invalidateQueries({ queryKey: getAdminOnboardingGetConfigQueryKey() });
			configModal = false;
		} finally { configLoading = false; }
	}

	const columns = [
		{ key: 'key', label: t?.('admin.onboarding.stepKey') ?? 'Key' },
		{ key: 'component', label: 'Component' },
		{ key: 'order', label: t?.('admin.onboarding.order') ?? 'Order', width: '80px' },
		{ key: 'isActive', label: t?.('admin.onboarding.isActive') ?? 'Active', width: '80px' },
		{ key: 'actions', label: '', width: '140px' },
	];
</script>

<svelte:head>
	<title>{t?.('admin.onboarding.title') ?? 'Onboarding'}</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-xl font-semibold tracking-tight {text}">{t?.('admin.onboarding.title') ?? 'Onboarding Monitoring'}</h1>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<StatCard label={t?.('admin.onboarding.steps') ?? 'Total Steps'} value={steps.length} colorSchema={cs} />
		<StatCard label={t?.('admin.onboarding.isActive') ?? 'Active Steps'} value={steps.filter(s => s.isActive).length} colorSchema={cs} />
		<StatCard label="Inactive Steps" value={steps.filter(s => !s.isActive).length} colorSchema={cs} />
	</div>

	<div>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-sm font-semibold uppercase tracking-widest {muted}">{t?.('admin.onboarding.steps') ?? 'Steps Configuration'}</h2>
			<Button variant="solid" size="sm" onclick={openCreateStep} colorSchema={cs}>
				<Plus size={14} /> Add Step
			</Button>
		</div>

		<DataTable {columns} data={sortedSteps} loading={stepsQuery.isLoading} emptyMessage={t?.('admin.onboarding.noSteps') ?? 'No steps configured'} colorSchema={cs}>
			{#snippet cell({ row, key })}
				{#if key === 'isActive'}
					<Button variant="icon" size="xs" onclick={() => handleToggleActive(row)} colorSchema={cs}>
						{#if row.isActive}<ToggleRight size={20} class="text-emerald-500" />{:else}<ToggleLeft size={20} class={muted} />{/if}
					</Button>
				{:else if key === 'actions'}
					<div class="flex items-center gap-1">
						<Tooltip text="Edit" colorSchema={cs}>
							<Button variant="icon" size="xs" onclick={(e) => { e.stopPropagation(); openEditStep(row); }} colorSchema={cs}><Pencil size={14} /></Button>
						</Tooltip>
						<Tooltip text="Move up" colorSchema={cs}>
							<Button variant="icon" size="xs" onclick={(e) => { e.stopPropagation(); handleReorder(row, 'up'); }} colorSchema={cs}><ChevronUp size={14} /></Button>
						</Tooltip>
						<Tooltip text="Move down" colorSchema={cs}>
							<Button variant="icon" size="xs" onclick={(e) => { e.stopPropagation(); handleReorder(row, 'down'); }} colorSchema={cs}><ChevronDown size={14} /></Button>
						</Tooltip>
						<Tooltip text="Delete" colorSchema={cs}>
							<Button variant="danger" size="xs" onclick={(e) => { e.stopPropagation(); deleteKey = row.key as string; }} colorSchema={cs}><Trash2 size={14} /></Button>
						</Tooltip>
					</div>
				{:else}
					{row[key] ?? '—'}
				{/if}
			{/snippet}
		</DataTable>
	</div>

	<!-- Strength Config -->
	<div>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-sm font-semibold uppercase tracking-widest {muted}">Strength Configuration</h2>
			<Button variant="ghost" size="sm" onclick={openConfigEdit} colorSchema={cs}>
				<Settings size={14} /> Edit
			</Button>
		</div>
		{#if strengthLevels.length > 0}
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
				{#each strengthLevels as level}
					<div class="rounded-lg border px-4 py-3 {cardBg} {cardBorder}">
						<p class="text-xs font-semibold uppercase {text}">{level.level}</p>
						<p class="text-[10px] {muted}">Min score: {level.minScore}</p>
						<p class="mt-1 text-xs {muted}">{level.message}</p>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-xs {muted}">No strength levels configured</p>
		{/if}
	</div>
</div>

<!-- Step Form Modal -->
<FormModal open={stepModal !== null} title={stepModal?.mode === 'create' ? 'Add Step' : 'Edit Step'} loading={stepLoading} colorSchema={cs} onsubmit={handleStepSubmit} oncancel={() => stepModal = null}>
	<div class="space-y-3">
		<div><label class={labelClass}>Key *</label><Input bind:value={stepKey} placeholder="welcome" required colorSchema={cs} disabled={stepModal?.mode === 'edit'} /></div>
		<div><label class={labelClass}>Component *</label><Input bind:value={stepComponent} placeholder="step-form" required colorSchema={cs} /></div>
		<div class="grid grid-cols-2 gap-3">
			<div><label class={labelClass}>Icon</label><Input bind:value={stepIcon} placeholder="📄" colorSchema={cs} /></div>
			<div><label class={labelClass}>Order</label><Input bind:value={stepOrder} type="number" colorSchema={cs} /></div>
		</div>
		<div class="grid grid-cols-2 gap-3">
			<div><label class={labelClass}>Section Type Key</label><Input bind:value={stepSectionTypeKey} placeholder="work_experience_v1" colorSchema={cs} /></div>
			<div><label class={labelClass}>Strength Weight</label><Input bind:value={stepStrengthWeight} type="number" colorSchema={cs} /></div>
		</div>
		<div class="flex items-center gap-4">
			<label class="flex items-center gap-2 text-sm {text}"><input type="checkbox" bind:checked={stepRequired} class="rounded" /> Required</label>
			<label class="flex items-center gap-2 text-sm {text}"><input type="checkbox" bind:checked={stepIsActive} class="rounded" /> Active</label>
		</div>
	</div>
</FormModal>

<!-- Config Form Modal -->
<FormModal open={configModal} title="Edit Strength Levels" loading={configLoading} colorSchema={cs} onsubmit={handleConfigSubmit} oncancel={() => configModal = false}>
	<div class="space-y-3">
		{#each configLevels as level, i}
			<div class="flex items-end gap-2 rounded-lg border p-3 {cardBorder}">
				<div class="flex-1"><label class={labelClass}>Level</label><Input bind:value={level.level} placeholder="weak" required colorSchema={cs} /></div>
				<div class="w-20"><label class={labelClass}>Min</label><Input bind:value={level.minScore} type="number" colorSchema={cs} /></div>
				<div class="flex-1"><label class={labelClass}>Message</label><Input bind:value={level.message} placeholder="Keep going" colorSchema={cs} /></div>
				<Button type="button" variant="danger" size="xs" onclick={() => removeConfigLevel(i)} colorSchema={cs}><Trash2 size={14} /></Button>
			</div>
		{/each}
		<Button type="button" variant="ghost" size="xs" onclick={addConfigLevel} colorSchema={cs}><Plus size={12} /> Add level</Button>
	</div>
</FormModal>

<ConfirmModal open={deleteKey !== null} title="Delete Step" message={t?.('admin.onboarding.confirmDeleteStep') ?? 'Are you sure?'} loading={deleteLoading} colorSchema={cs} onconfirm={handleDelete} oncancel={() => deleteKey = null} />
