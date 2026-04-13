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
						<Button
							variant="icon"
							size="xs"
							onclick={() => {
								const copy = { content: { ...item.content } };
								onupdate([...items, copy]);
							}}
							class="text-gray-400 dark:text-neutral-500"
						>
							<Copy size={14} />
						</Button>
						<Button
							variant="icon"
							size="xs"
							onclick={() => removeItem(i)}
							class="text-red-500"
						>
							<Trash2 size={14} />
						</Button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<Button
		variant="ghost"
		size="xs"
		onclick={openModal}
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
