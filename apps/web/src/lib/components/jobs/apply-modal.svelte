<script lang="ts">

import { Button, Loader, Modal, Textarea } from 'ui';
import { locale } from '$lib/state/locale.svelte';

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

function handleSubmit(event?: SubmitEvent) {
  // P2-#49: when invoked via `<form onsubmit>` make sure we don't fall
  // through to a real navigation. Manual button clicks pass no event,
  // so the optional-chain keeps that path working too.
  event?.preventDefault();
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

	<!-- P2-#49: wrapping in <form> so Enter / Cmd+Enter inside the textarea
	     submit the application, matching the platform convention for modals
	     with a single primary action. -->
	<form onsubmit={handleSubmit} class="space-y-4">
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
			<Button type="button" variant="ghost" size="sm" onclick={handleCancel} disabled={submitting}>
				{t('jobs.applyCancel')}
			</Button>
			<Button type="submit" variant="solid" size="sm" disabled={submitting}>
				{#if submitting}
					<Loader size={14} />
					{t('jobs.applySubmitting')}
				{:else}
					{t('jobs.applySubmit')}
				{/if}
			</Button>
		</div>
	</form>
</Modal>
