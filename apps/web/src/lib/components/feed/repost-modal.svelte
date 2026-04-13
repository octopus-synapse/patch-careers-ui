<script lang="ts">
	import { Modal, Button, Avatar, Textarea } from 'ui';
	import { Loader2 } from 'lucide-svelte';

	type Props = {
		open: boolean;
		post: Record<string, unknown> | null;
		onsubmit: (content: string) => void;
		oncancel: () => void;
	};

	let { open, post, onsubmit, oncancel }: Props = $props();

	let commentary = $state('');
	let submitting = $state(false);

	interface PostAuthor { name?: string; username?: string; photoURL?: string; avatarUrl?: string }

	const author = $derived(post ? post.author : null);
	const authorObj = $derived(author ? author : null);
	const authorName = $derived(authorObj ? String((authorObj as PostAuthor).name ?? (authorObj as PostAuthor).username ?? 'Unknown') : 'Unknown');
	const authorPhoto = $derived(authorObj ? ((authorObj as PostAuthor).photoURL ?? (authorObj as PostAuthor).avatarUrl) : undefined);
	const postContent = $derived(post ? String(post.content ?? '') : '');

	async function handleSubmit() {
		if (submitting) return;
		submitting = true;
		try {
			onsubmit(commentary.trim());
			commentary = '';
		} finally {
			submitting = false;
		}
	}

	function handleCancel() {
		commentary = '';
		oncancel();
	}
</script>

<Modal {open} onClose={handleCancel}>
	{#snippet title()}
		Repost
	{/snippet}

	<div class="space-y-4">
		<Textarea
			placeholder="Add your thoughts (optional)..."
			rows={3}
			bind:value={commentary}
		/>

		<!-- Original post preview -->
		{#if post}
			<div class="rounded-lg border p-3 border-gray-200 dark:border-neutral-700/50 bg-gray-50 dark:bg-neutral-700/30">
				<div class="flex items-center gap-2 mb-2">
					<Avatar name={authorName} photoURL={authorPhoto} size="sm" />
					<span class="text-xs font-semibold text-gray-800 dark:text-neutral-200">{authorName}</span>
				</div>
				{#if postContent}
					<p class="text-xs text-gray-600 dark:text-neutral-400 line-clamp-3">{postContent}</p>
				{/if}
			</div>
		{/if}

		<div class="flex items-center justify-end gap-2">
			<Button variant="ghost" size="sm" onclick={handleCancel}>
				Cancel
			</Button>
			<Button variant="solid" size="sm" onclick={handleSubmit} disabled={submitting}>
				{#if submitting}
					<Loader2 size={14} class="animate-spin" />
					Reposting...
				{:else}
					Repost
				{/if}
			</Button>
		</div>
	</div>
</Modal>
