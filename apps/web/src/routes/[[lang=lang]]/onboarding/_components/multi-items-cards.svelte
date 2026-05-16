<script lang="ts">
import { Pencil, Plus, Trash2 } from 'lucide-svelte';
import { Button, Modal } from 'ui';
import { locale } from '$lib/state/locale.svelte';
import StepForm from './step-form.svelte';

type Field = {
  key: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
  widget?: string;
};

type Item = { id?: string; content?: Record<string, unknown> };

type Props = {
  fields: Field[];
  items: Item[];
  onupdate: (items: Item[]) => void;
};

let { fields, items, onupdate }: Props = $props();

const t = $derived(locale.t);

let isModalOpen = $state(false);
let modalData = $state<Record<string, string>>({});
let editingIndex = $state<number | null>(null);

function openAddModal() {
  modalData = {};
  editingIndex = null;
  isModalOpen = true;
}

function openEditModal(index: number) {
  const item = items[index];
  modalData = item?.content
    ? Object.fromEntries(
        Object.entries(item.content).map(([k, v]) => [k, v == null ? '' : String(v)]),
      )
    : {};
  editingIndex = index;
  isModalOpen = true;
}

function saveItem() {
  if (editingIndex !== null) {
    const next = items.slice();
    next[editingIndex] = { ...next[editingIndex], content: { ...modalData } };
    onupdate(next);
  } else {
    onupdate([...items, { content: { ...modalData } }]);
  }
  isModalOpen = false;
  editingIndex = null;
}

function removeItem(index: number) {
  onupdate(items.filter((_, i) => i !== index));
}

// Pull a primary heading for the card (e.g. job title, institution,
// project title). First non-empty content value wins — works across
// section schemas without hardcoding the key.
function cardTitle(item: Item): string {
  if (!item.content) return '—';
  const values = Object.values(item.content).filter((v) => v != null && v !== '');
  return values.length > 0 ? String(values[0]) : '—';
}

// Secondary subtitle (employer, course, year — whatever the schema puts
// in slot 2). Skipped if absent.
function cardSubtitle(item: Item): string | undefined {
  if (!item.content) return undefined;
  const values = Object.values(item.content).filter((v) => v != null && v !== '');
  return values.length > 1 ? String(values[1]) : undefined;
}

// Period or extra meta — third populated value if available.
function cardMeta(item: Item): string | undefined {
  if (!item.content) return undefined;
  const values = Object.values(item.content).filter((v) => v != null && v !== '');
  return values.length > 2 ? String(values[2]) : undefined;
}
</script>

<div>
	{#if items.length === 0}
		<p class="text-sm text-gray-500 dark:text-neutral-500">{t('onboarding.noData')}</p>
	{:else}
		<div class="space-y-3">
			{#each items as item, i (item.id ?? i)}
				{@const title = cardTitle(item)}
				{@const subtitle = cardSubtitle(item)}
				{@const meta = cardMeta(item)}
				<div
					class="group rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm dark:border-neutral-700 dark:bg-neutral-800/50"
				>
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0 flex-1">
							<h3 class="truncate text-sm font-semibold text-gray-900 dark:text-neutral-100">
								{title}
							</h3>
							{#if subtitle}
								<p class="mt-0.5 truncate text-xs text-gray-600 dark:text-neutral-400">
									{subtitle}
								</p>
							{/if}
							{#if meta}
								<p class="mt-0.5 truncate text-[11px] text-gray-400 dark:text-neutral-500">
									{meta}
								</p>
							{/if}
						</div>
						<div class="flex flex-shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
							<Button
								variant="icon"
								size="xs"
								onclick={() => openEditModal(i)}
								class="text-gray-400 dark:text-neutral-500"
								aria-label="Editar"
							>
								<Pencil size={13} />
							</Button>
							<Button
								variant="icon"
								size="xs"
								onclick={() => removeItem(i)}
								class="text-gray-400 hover:text-red-500"
								aria-label="Remover"
							>
								<Trash2 size={13} />
							</Button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<Button
		variant="ghost"
		size="sm"
		onclick={openAddModal}
		class="mt-3"
	>
		<Plus size={14} />
		{t('onboarding.addItem')}
	</Button>
</div>

<Modal open={isModalOpen} onClose={() => (isModalOpen = false)}>
	{#snippet title()}{t('onboarding.modalTitle')}{/snippet}

	<StepForm
		{fields}
		data={modalData}
		onupdate={(d) => (modalData = d)}
	/>
	<div class="mt-5">
		<Button variant="solid" onclick={saveItem}>
			{t('onboarding.modalSave')}
		</Button>
	</div>
</Modal>
