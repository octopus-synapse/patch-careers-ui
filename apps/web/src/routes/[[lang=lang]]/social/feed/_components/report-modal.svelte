<script lang="ts">

import { Button, Loader, Modal, Textarea } from 'ui';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

type Props = {
  open: boolean;
  onsubmit: (reason: string) => void;
  oncancel: () => void;
};

let { open, onsubmit, oncancel }: Props = $props();

let reason = $state('');
let submitting = $state(false);

async function handleSubmit() {
  if (!reason.trim() || submitting) return;
  submitting = true;
  try {
    onsubmit(reason.trim());
    reason = '';
  } finally {
    submitting = false;
  }
}

function handleCancel() {
  reason = '';
  oncancel();
}
</script>

<Modal {open} onClose={handleCancel}>
	{#snippet title()}
		Report Post
	{/snippet}

	<div class="space-y-4">
		<p class="text-xs text-gray-400 dark:text-neutral-500">Why are you reporting this post?</p>
		<Textarea
			placeholder={t('feed.report.reasonPlaceholder')}
			rows={4}
			bind:value={reason}
		/>

		<div class="flex items-center justify-end gap-2">
			<Button variant="ghost" size="sm" onclick={handleCancel}>
				Cancel
			</Button>
			<Button variant="solid" size="sm" onclick={handleSubmit} disabled={submitting || !reason.trim()}>
				{#if submitting}
					<Loader size={14} />
					Reporting...
				{:else}
					Report
				{/if}
			</Button>
		</div>
	</div>
</Modal>
