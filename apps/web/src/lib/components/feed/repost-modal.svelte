<script lang="ts">
import { Loader2 } from 'lucide-svelte';
import { Button, Modal, QuoteCard, Textarea } from 'ui';
import { locale } from '$lib/state/locale.svelte';

type Props = {
  open: boolean;
  post: Record<string, unknown> | null;
  onsubmit: (content: string) => void;
  oncancel: () => void;
};

let { open, post, onsubmit, oncancel }: Props = $props();

let commentary = $state('');
let submitting = $state(false);

interface PostAuthor {
  name?: string;
  username?: string;
  photoURL?: string;
  avatarUrl?: string;
}

const t = $derived(locale.t);

const author = $derived((post?.author ?? null) as PostAuthor | null);
const authorName = $derived(
  author ? String(author.name ?? author.username ?? 'Unknown') : 'Unknown',
);
const authorUsername = $derived(author?.username ?? null);
const authorPhoto = $derived(author?.photoURL ?? author?.avatarUrl ?? null);
const postContent = $derived(post?.content ? String(post.content) : '');
const postCreatedAt = $derived(post?.createdAt ? String(post.createdAt) : null);

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
		{t('feed.quoteRepost.title')}
	{/snippet}

	<div class="space-y-4">
		<Textarea
			placeholder={t('feed.quoteRepost.placeholder')}
			rows={3}
			bind:value={commentary}
		/>

		{#if post}
			<QuoteCard
				{authorName}
				authorUsername={authorUsername ?? null}
				authorAvatarUrl={authorPhoto ?? null}
				createdAt={postCreatedAt}
				content={postContent}
			/>
		{/if}

		<div class="flex items-center justify-end gap-2">
			<Button variant="ghost" size="sm" onclick={handleCancel}>
				{t('feed.quoteRepost.cancel')}
			</Button>
			<Button variant="solid" size="sm" onclick={handleSubmit} disabled={submitting}>
				{#if submitting}
					<Loader2 size={14} class="animate-spin" />
					{t('feed.quoteRepost.submitting')}
				{:else}
					{t('feed.quoteRepost.submit')}
				{/if}
			</Button>
		</div>
	</div>
</Modal>
