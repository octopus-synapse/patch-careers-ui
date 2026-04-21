<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  adminOnboardingCreateStep,
  adminOnboardingDeleteStep,
  adminOnboardingUpdateConfig,
  adminOnboardingUpdateStep,
  createAdminOnboardingGetConfig,
  createAdminOnboardingListSteps,
  getAdminOnboardingGetConfigQueryKey,
  getAdminOnboardingListStepsQueryKey,
} from 'api-client';
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Settings,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-svelte';
import { Button, ConfirmModal, FormModal, Input, Label, Tooltip } from 'ui';
import { browser } from '$app/environment';
import DataTable from '$lib/components/data/data-table.svelte';
import StatCard from '../_components/stat-card.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);
const queryClient = useQueryClient();

const stepsQuery = createAdminOnboardingListSteps(() => ({ query: { enabled: browser } }));
const configQuery = createAdminOnboardingGetConfig(() => ({ query: { enabled: browser } }));

interface StepItem {
  id: string;
  key: string;
  order: number;
  component: string;
  icon: string;
  required: boolean;
  sectionTypeKey: string | null;
  strengthWeight: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  fields: unknown;
  translations: unknown;
  validation: unknown;
  [key: string]: unknown;
}
interface StrengthLevel {
  minScore: number;
  level: string;
  message: string;
}

const steps = $derived(stepsQuery.data?.steps as StepItem[] | undefined);
const sortedSteps = $derived([...(steps ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
const config = $derived(configQuery.data?.config);
const strengthLevels = $derived(config?.strengthLevels as StrengthLevel[] | undefined);

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
  stepKey = '';
  stepComponent = '';
  stepIcon = '📄';
  stepOrder = String(sortedSteps.length);
  stepRequired = false;
  stepSectionTypeKey = '';
  stepStrengthWeight = '0';
  stepIsActive = true;
}

function openEditStep(step: StepItem) {
  stepModal = { mode: 'edit', key: step.key };
  stepKey = step.key ?? '';
  stepComponent = step.component ?? '';
  stepIcon = step.icon ?? '📄';
  stepOrder = String(step.order ?? 0);
  stepRequired = step.required ?? false;
  stepSectionTypeKey = step.sectionTypeKey ?? '';
  stepStrengthWeight = String(step.strengthWeight ?? 0);
  stepIsActive = step.isActive ?? true;
}

async function handleStepSubmit() {
  stepLoading = true;
  try {
    const data = {
      key: stepKey,
      component: stepComponent,
      icon: stepIcon,
      order: Number(stepOrder),
      required: stepRequired,
      sectionTypeKey: stepSectionTypeKey || null,
      strengthWeight: Number(stepStrengthWeight),
      isActive: stepIsActive,
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

async function handleToggleActive(step: StepItem) {
  await adminOnboardingUpdateStep(step.key, jsonBody({ isActive: !step.isActive }));
  queryClient.invalidateQueries({ queryKey: getAdminOnboardingListStepsQueryKey() });
}

async function handleReorder(step: StepItem, direction: 'up' | 'down') {
  const currentOrder = step.order ?? 0;
  const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
  await adminOnboardingUpdateStep(step.key, jsonBody({ order: newOrder }));
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

function openConfigEdit() {
  configLevels = (strengthLevels ?? []).map((l) => ({
    minScore: String(l.minScore ?? 0),
    level: l.level ?? '',
    message: l.message ?? '',
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
    await adminOnboardingUpdateConfig(
      jsonBody({
        strengthLevels: configLevels.map((l) => ({ ...l, minScore: Number(l.minScore) })),
      }),
    );
    queryClient.invalidateQueries({ queryKey: getAdminOnboardingGetConfigQueryKey() });
    configModal = false;
  } finally {
    configLoading = false;
  }
}

const columns = $derived([
  { key: 'key', label: t?.('admin.onboarding.stepKey') ?? 'Key' },
  { key: 'component', label: 'Component' },
  { key: 'order', label: t?.('admin.onboarding.order') ?? 'Order', width: '80px' },
  { key: 'isActive', label: t?.('admin.onboarding.isActive') ?? 'Active', width: '80px' },
  { key: 'actions', label: '', width: '140px' },
]);
</script>

<svelte:head>
	<title>{t?.('admin.onboarding.title') ?? 'Onboarding'}</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">{t?.('admin.onboarding.title') ?? 'Onboarding Monitoring'}</h1>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<StatCard label={t?.('admin.onboarding.steps') ?? 'Total Steps'} value={steps?.length ?? 0} />
		<StatCard label={t?.('admin.onboarding.isActive') ?? 'Active Steps'} value={steps?.filter(s => s.isActive).length ?? 0} />
		<StatCard label="Inactive Steps" value={steps?.filter(s => !s.isActive).length ?? 0} />
	</div>

	<div>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-500">{t?.('admin.onboarding.steps') ?? 'Steps Configuration'}</h2>
			<Button variant="solid" size="sm" onclick={openCreateStep}>
				<Plus size={14} /> Add Step
			</Button>
		</div>

		<DataTable {columns} data={sortedSteps} loading={stepsQuery.isLoading} emptyMessage={t?.('admin.onboarding.noSteps') ?? 'No steps configured'}>
			{#snippet cell({ row, key })}
				{#if key === 'isActive'}
					<Button variant="icon" size="xs" onclick={() => handleToggleActive(row)}>
						{#if row.isActive}<ToggleRight size={20} class="text-emerald-500" />{:else}<ToggleLeft size={20} class="text-gray-500 dark:text-neutral-500" />{/if}
					</Button>
				{:else if key === 'actions'}
					<div class="flex items-center gap-1">
						<Tooltip text="Edit">
							<Button variant="icon" size="xs" onclick={(e) => { e.stopPropagation(); openEditStep(row); }}><Pencil size={14} /></Button>
						</Tooltip>
						<Tooltip text="Move up">
							<Button variant="icon" size="xs" onclick={(e) => { e.stopPropagation(); handleReorder(row, 'up'); }}><ChevronUp size={14} /></Button>
						</Tooltip>
						<Tooltip text="Move down">
							<Button variant="icon" size="xs" onclick={(e) => { e.stopPropagation(); handleReorder(row, 'down'); }}><ChevronDown size={14} /></Button>
						</Tooltip>
						<Tooltip text="Delete">
							<Button variant="ghost" intent="danger" size="xs" onclick={(e) => { e.stopPropagation(); deleteKey = row.key; }}><Trash2 size={14} /></Button>
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
			<h2 class="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-500">Strength Configuration</h2>
			<Button variant="ghost" size="sm" onclick={openConfigEdit}>
				<Settings size={14} /> Edit
			</Button>
		</div>
		{#if strengthLevels?.length}
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
				{#each strengthLevels ?? [] as level}
					<div class="rounded-lg border px-4 py-3 bg-white dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700/50">
						<p class="text-xs font-semibold uppercase text-gray-800 dark:text-neutral-200">{level.level}</p>
						<p class="text-[10px] text-gray-500 dark:text-neutral-500">Min score: {level.minScore}</p>
						<p class="mt-1 text-xs text-gray-500 dark:text-neutral-500">{level.message}</p>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-xs text-gray-500 dark:text-neutral-500">No strength levels configured</p>
		{/if}
	</div>
</div>

<!-- Step Form Modal -->
<FormModal open={stepModal !== null} title={stepModal?.mode === 'create' ? 'Add Step' : 'Edit Step'} loading={stepLoading} onSubmit={handleStepSubmit} onClose={() => stepModal = null}>
	<div class="space-y-3">
		<div><Label>Key *</Label><Input bind:value={stepKey} placeholder="welcome" required disabled={stepModal?.mode === 'edit'} /></div>
		<div><Label>Component *</Label><Input bind:value={stepComponent} placeholder="step-form" required /></div>
		<div class="grid grid-cols-2 gap-3">
			<div><Label>Icon</Label><Input bind:value={stepIcon} placeholder="📄" /></div>
			<div><Label>Order</Label><Input bind:value={stepOrder} type="number" /></div>
		</div>
		<div class="grid grid-cols-2 gap-3">
			<div><Label>Section Type Key</Label><Input bind:value={stepSectionTypeKey} placeholder="work_experience_v1" /></div>
			<div><Label>Strength Weight</Label><Input bind:value={stepStrengthWeight} type="number" /></div>
		</div>
		<div class="flex items-center gap-4">
			<label class="flex items-center gap-2 text-sm text-gray-800 dark:text-neutral-200"><input type="checkbox" bind:checked={stepRequired} class="rounded" /> Required</label>
			<label class="flex items-center gap-2 text-sm text-gray-800 dark:text-neutral-200"><input type="checkbox" bind:checked={stepIsActive} class="rounded" /> Active</label>
		</div>
	</div>
</FormModal>

<!-- Config Form Modal -->
<FormModal open={configModal} title="Edit Strength Levels" loading={configLoading} onSubmit={handleConfigSubmit} onClose={() => configModal = false}>
	<div class="space-y-3">
		{#each configLevels as level, i}
			<div class="flex items-end gap-2 rounded-lg border p-3 border-gray-200 dark:border-neutral-700/50">
				<div class="flex-1"><Label>Level</Label><Input bind:value={level.level} placeholder="weak" required /></div>
				<div class="w-20"><Label>Min</Label><Input bind:value={level.minScore} type="number" /></div>
				<div class="flex-1"><Label>Message</Label><Input bind:value={level.message} placeholder="Keep going" /></div>
				<Button type="button" variant="ghost" intent="danger" size="xs" onclick={() => removeConfigLevel(i)}><Trash2 size={14} /></Button>
			</div>
		{/each}
		<Button type="button" variant="ghost" size="xs" onclick={addConfigLevel}><Plus size={12} /> Add level</Button>
	</div>
</FormModal>

<ConfirmModal open={deleteKey !== null} title="Delete Step" message={t?.('admin.onboarding.confirmDeleteStep') ?? 'Are you sure?'} loading={deleteLoading} onConfirm={handleDelete} onClose={() => deleteKey = null} />
