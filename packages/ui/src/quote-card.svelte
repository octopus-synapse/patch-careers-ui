<script lang="ts">
import type { Snippet } from 'svelte';

type Props = {
  authorName: string;
  authorUsername?: string | null;
  authorAvatarUrl?: string | null;
  createdAt?: string | null;
  /** The original post text. Truncated with CSS if very long. */
  content: string;
  /** Optional slot for extras (images, link preview, etc.). */
  extras?: Snippet;
};

let { authorName, authorUsername, authorAvatarUrl, createdAt, content, extras }: Props = $props();

const formattedDate = $derived(
  createdAt
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(createdAt))
    : null,
);
</script>

<div
	class="rounded-lg border border-gray-200 bg-gray-50/50 p-3 dark:border-neutral-700 dark:bg-neutral-800/40"
>
	<div class="flex items-center gap-2 text-sm">
		{#if authorAvatarUrl}
			<img
				src={authorAvatarUrl}
				alt=""
				class="h-7 w-7 rounded-full object-cover"
				loading="lazy"
			/>
		{:else}
			<div
				aria-hidden="true"
				class="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 dark:bg-neutral-700 dark:text-neutral-300"
			>
				{authorName.slice(0, 1).toUpperCase()}
			</div>
		{/if}
		<div class="flex min-w-0 flex-1 items-baseline gap-1.5">
			<span class="truncate font-medium text-gray-900 dark:text-neutral-100">
				{authorName}
			</span>
			{#if authorUsername}
				<span class="truncate text-xs text-gray-500 dark:text-neutral-400">
					@{authorUsername}
				</span>
			{/if}
			{#if formattedDate}
				<span aria-hidden="true" class="text-gray-400 dark:text-neutral-500">&middot;</span>
				<span class="shrink-0 text-xs text-gray-500 dark:text-neutral-400">
					{formattedDate}
				</span>
			{/if}
		</div>
	</div>

	<p class="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-gray-800 dark:text-neutral-200">
		{content}
	</p>

	{#if extras}
		<div class="mt-2">
			{@render extras()}
		</div>
	{/if}
</div>
