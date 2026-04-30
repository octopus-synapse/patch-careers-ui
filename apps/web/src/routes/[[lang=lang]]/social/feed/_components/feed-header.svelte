<script lang="ts">
import { Bookmark, ImagePlus, Link2, Smile } from 'lucide-svelte';
import { Avatar } from 'ui';
import { goto } from '$app/navigation';
import { locale } from '$lib/state/locale.svelte';

/**
 * `FeedMode` used to be a union of 'bubble' / 'explore' / 'activity' —
 * the three tabs that lived on this header. Filters were removed so
 * the feed is a single unfiltered stream. The type is kept exported so
 * any downstream consumer can still reference it; new callers should
 * treat it as always the single default mode.
 */
export type FeedMode = 'default';

type Props = {
  userName: string;
  userPhoto: string | null;
  oncreate: () => void;
};

let { userName, userPhoto, oncreate }: Props = $props();

const t = $derived(locale.t);
</script>

<!--
  Composer — larger hit area, avatar + full-width prompt + 3 quick-action
  icons that all open the create-post modal (they're visual affordances,
  the underlying flow handles the actual input).
-->
<div class="rounded-2xl border border-gray-200 bg-white transition-colors dark:border-neutral-800 dark:bg-neutral-900">
	<button
		type="button"
		onclick={oncreate}
		class="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/60"
	>
		<Avatar name={userName || 'U'} photoURL={userPhoto} size="md" />
		<span class="flex-1 text-sm text-gray-500 dark:text-neutral-400">
			{t('feed.composer.placeholder') ?? t('feed.whatsOnYourMind')}
		</span>
	</button>

	<div class="flex items-center justify-between gap-1 border-t border-gray-100 px-2 py-1.5 dark:border-neutral-800">
		<div class="flex items-center gap-0.5">
			<button
				type="button"
				onclick={oncreate}
				aria-label="Anexar imagem"
				class="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
			>
				<ImagePlus size={16} class="text-cyan-500" />
				<span class="hidden sm:inline">Imagem</span>
			</button>
			<button
				type="button"
				onclick={oncreate}
				aria-label="Anexar link"
				class="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
			>
				<Link2 size={16} class="text-cyan-500" />
				<span class="hidden sm:inline">Link</span>
			</button>
			<button
				type="button"
				onclick={oncreate}
				aria-label="Adicionar sentimento"
				class="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
			>
				<Smile size={16} class="text-cyan-500" />
				<span class="hidden sm:inline">Sentimento</span>
			</button>
		</div>

		<div class="flex items-center">
			<button
				type="button"
				onclick={() => goto('/social/feed/bookmarks')}
				class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
			>
				<Bookmark size={14} />
				<span>{t('feed.saved')}</span>
			</button>
			<button
				type="button"
				onclick={oncreate}
				class="ml-1 rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
			>
				{t('feed.createPost')}
			</button>
		</div>
	</div>
</div>
