<script lang="ts">
	import { Button, Modal } from 'ui';
	import type { Translator } from 'i18n';
	import { Copy, Plus, Trash2 } from 'lucide-svelte';
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
		t: Translator;
		onupdate: (items: Item[]) => void;
	};

	let { fields, items, t, onupdate }: Props = $props();

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

	function itemSummary(item: Item): string {
		if (!item.content) return '---';
		const values = Object.values(item.content).filter(Boolean);
		return values.slice(0, 2).join(' · ') || '---';
	}
</script>

<div>
	{#if items.length === 0}
		<p class="text-sm text-gray-500 dark:text-neutral-500">{t('onboarding.noData')}</p>
	{:else}
		<div class="space-y-2">
			{#each items as item, i}
				<div class="flex items-center justify-between border-b py-3 border-gray-200 dark:border-neutral-700">
					<span class="text-sm text-gray-800 dark:text-neutral-200">{itemSummary(item)}</span>
					<div class="flex items-center gap-1">
						<button
							class="rounded p-1 text-gray-400 transition-opacity hover:opacity-60 dark:text-neutral-500"
							onclick={() => {
								const copy = { content: { ...item.content } };
								onupdate([...items, copy]);
							}}
						>
							<Copy size={14} />
						</button>
						<button
							onclick={() => removeItem(i)}
							class="rounded p-1 text-red-500 transition-opacity hover:opacity-60"
						>
							<Trash2 size={14} />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<button
		onclick={openModal}
		class="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-60 text-gray-500 dark:text-neutral-500"
	>
		<Plus size={14} />
		{t('onboarding.addItem')}
	</button>
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
