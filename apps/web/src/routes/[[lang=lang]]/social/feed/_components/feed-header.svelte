<script lang="ts">
import { Image, Link as LinkIcon, Smile } from 'lucide-svelte';
import { Avatar } from 'ui';
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

<section
	class="rounded-3xl border border-black/5 bg-white px-4 pt-3 pb-2 dark:border-white/[0.06] dark:bg-zinc-900/40"
>
	<button
		type="button"
		onclick={oncreate}
		class="flex w-full items-center gap-3 text-left"
	>
		<Avatar name={userName || 'U'} photoURL={userPhoto} size="md" shape="circle" />
		<span class="truncate text-[15px] text-gray-500 dark:text-zinc-500">{placeholder}</span>
	</button>

	<div class="mt-2 flex items-center justify-between">
		<div class="flex items-center">
			<button
				type="button"
				onclick={oncreate}
				aria-label={t('feed.composer.addImage')}
				class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-black/[0.04] hover:text-gray-700 dark:text-zinc-500 dark:hover:bg-white/[0.05] dark:hover:text-zinc-300"
			>
				<Image size={18} strokeWidth={1.75} />
			</button>
			<button
				type="button"
				onclick={oncreate}
				aria-label={t('feed.composer.addLink')}
				class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-black/[0.04] hover:text-gray-700 dark:text-zinc-500 dark:hover:bg-white/[0.05] dark:hover:text-zinc-300"
			>
				<LinkIcon size={18} strokeWidth={1.75} />
			</button>
			<button
				type="button"
				onclick={oncreate}
				aria-label={t('feed.composer.addEmoji')}
				class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-black/[0.04] hover:text-gray-700 dark:text-zinc-500 dark:hover:bg-white/[0.05] dark:hover:text-zinc-300"
			>
				<Smile size={18} strokeWidth={1.75} />
			</button>
		</div>

		<button
			type="button"
			onclick={oncreate}
			class="rounded-full bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
		>
			{t('feed.composer.post')}
		</button>
	</div>
</section>
