<script lang="ts">
import { Image, Link as LinkIcon, Smile } from 'lucide-svelte';
import { Avatar, Button } from 'ui';
import { locale } from '$lib/state/locale.svelte';

export type FeedMode = 'default';

type Props = {
  userName: string;
  userPhoto: string | null;
  oncreate: () => void;
};

let { userName, userPhoto, oncreate }: Props = $props();

const t = $derived(locale.t);
const firstName = $derived((userName ?? '').split(' ')[0] ?? '');
const placeholder = $derived(
  firstName
    ? t('feed.composer.placeholderWithName', { name: firstName })
    : t('feed.composer.placeholder'),
);
</script>

<section class="glass glass-reflect rounded-[28px] p-4 sm:p-5">
	<div class="flex items-center gap-3">
		<Avatar name={userName || 'U'} photoURL={userPhoto} size="lg" shape="square" />
		<button
			type="button"
			onclick={oncreate}
			class="composer-trigger group flex-1 truncate rounded-2xl border border-transparent bg-black/[0.04] px-4 py-3 text-left text-sm font-medium text-gray-600 transition-all hover:border-blue-500/30 hover:bg-black/[0.06] hover:text-gray-900 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100"
		>
			{placeholder}
		</button>
	</div>

	<div class="mt-3 flex items-center justify-between gap-3 border-t border-black/5 pt-3 dark:border-white/5">
		<div class="flex items-center gap-1">
			<button
				type="button"
				onclick={oncreate}
				aria-label={t('feed.composer.addImage')}
				class="action-btn group flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-gray-600 transition-all hover:bg-blue-500/10 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-blue-500/15 dark:hover:text-blue-400"
			>
				<Image size={16} />
				<span class="hidden sm:inline">{t('feed.composer.addImage')}</span>
			</button>
			<button
				type="button"
				onclick={oncreate}
				aria-label={t('feed.composer.addLink')}
				class="action-btn group flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-gray-600 transition-all hover:bg-emerald-500/10 hover:text-emerald-600 dark:text-zinc-400 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-400"
			>
				<LinkIcon size={16} />
				<span class="hidden sm:inline">{t('feed.composer.addLink')}</span>
			</button>
			<button
				type="button"
				onclick={oncreate}
				aria-label={t('feed.composer.addEmoji')}
				class="action-btn group flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-gray-600 transition-all hover:bg-violet-500/10 hover:text-violet-600 dark:text-zinc-400 dark:hover:bg-violet-500/15 dark:hover:text-violet-400"
			>
				<Smile size={16} />
				<span class="hidden sm:inline">{t('feed.composer.addEmoji')}</span>
			</button>
		</div>

		<Button variant="glossy" size="sm" onclick={oncreate}>
			{t('feed.composer.post')}
		</Button>
	</div>
</section>
