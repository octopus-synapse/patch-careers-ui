<script lang="ts">
import { Loader2 } from 'lucide-svelte';
import { Button, Modal, Textarea } from 'ui';
import { locale } from '$lib/locale.svelte';

type Props = {
  open: boolean;
  jobTitle: string;
  submitting: boolean;
  onsubmit: (coverLetter: string) => void;
  oncancel: () => void;
};

let { open, jobTitle, submitting, onsubmit, oncancel }: Props = $props();

const t = $derived(locale.t);
let coverLetter = $state('');

$effect(() => {
  if (!open) coverLetter = '';
});

function handleSubmit() {
  if (submitting) return;
  onsubmit(coverLetter.trim());
}

function handleCancel() {
  if (submitting) return;
  coverLetter = '';
  oncancel();
}
</script>

<Modal {open} onClose={handleCancel}>
	{#snippet title()}
		{t('jobs.applyModalTitle', { title: jobTitle })}
	{/snippet}

	<div class="space-y-4">
		<p class="text-xs text-gray-500 dark:text-neutral-500">
			{t('jobs.applyModalSubtitle')}
		</p>

		<label class="block">
			<span class="mb-1 block text-xs font-medium text-gray-700 dark:text-neutral-300">
				{t('jobs.applyCoverLetter')}
			</span>
			<Textarea
				placeholder={t('jobs.applyCoverPlaceholder')}
				rows={5}
				bind:value={coverLetter}
			/>
		</label>

		<div class="flex items-center justify-end gap-2">
			<Button variant="ghost" size="sm" onclick={handleCancel} disabled={submitting}>
				{t('jobs.applyCancel')}
			</Button>
			<Button variant="solid" size="sm" onclick={handleSubmit} disabled={submitting}>
				{#if submitting}
					<Loader2 size={14} class="animate-spin" />
					{t('jobs.applySubmitting')}
				{:else}
					{t('jobs.applySubmit')}
				{/if}
			</Button>
		</div>
	</div>
</Modal>
