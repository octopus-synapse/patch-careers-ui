<script lang="ts">
import { Plus, X } from 'lucide-svelte';
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

function openModal() {
  modalData = {};
  isModalOpen = true;
}

function saveItem() {
  const newItem: Item = { content: { ...modalData } };
  onupdate([...items, newItem]);
  isModalOpen = false;
}

function removeItem(index: number) {
  onupdate(items.filter((_, i) => i !== index));
}

// Render the primary identifying field of the tag. Prefer the first
// non-empty value — covers `name`, `language`, etc. without hardcoding
// per-section.
function tagLabel(item: Item): string {
  if (!item.content) return '—';
  const values = Object.values(item.content).filter((v) => v != null && v !== '');
  return values.length > 0 ? String(values[0]) : '—';
}

// Secondary detail (e.g. CEFR level, proficiency) — shown smaller next to
// the primary label when present.
function tagDetail(item: Item): string | undefined {
  if (!item.content) return undefined;
  const values = Object.values(item.content).filter((v) => v != null && v !== '');
  return values.length > 1 ? String(values[1]) : undefined;
}
</script>

<div>
	<div class="flex flex-wrap gap-2">
		{#each items as item, i (item.id ?? i)}
			{@const label = tagLabel(item)}
			{@const detail = tagDetail(item)}
			<span
				class="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 transition-colors hover:border-gray-300 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-200 dark:hover:border-neutral-600"
			>
				<span>{label}</span>
				{#if detail}
					<span class="text-gray-400 dark:text-neutral-500">·</span>
					<span class="text-gray-500 dark:text-neutral-400">{detail}</span>
				{/if}
				<button
					type="button"
					onclick={() => removeItem(i)}
					class="-mr-1 ml-1 rounded-full p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500 dark:text-neutral-500 dark:hover:bg-neutral-700"
					aria-label="Remover {label}"
				>
					<X size={11} />
				</button>
			</span>
		{/each}

		<button
			type="button"
			onclick={openModal}
			class="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-gray-500 hover:text-gray-800 dark:border-neutral-600 dark:text-neutral-400 dark:hover:border-neutral-400 dark:hover:text-neutral-200"
		>
			<Plus size={12} />
			{t('onboarding.addItem')}
		</button>
	</div>

	{#if items.length === 0}
		<p class="mt-3 text-xs text-gray-500 dark:text-neutral-500">{t('onboarding.noData')}</p>
	{/if}
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
