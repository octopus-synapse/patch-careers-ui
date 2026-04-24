<script lang="ts">
import {
  Activity,
  Award,
  Bookmark,
  Briefcase,
  Code,
  Compass,
  GraduationCap,
  HelpCircle,
  ImagePlus,
  Link2,
  Smile,
  Sparkles,
  Target,
  Users,
} from 'lucide-svelte';
import type { Component } from 'svelte';
import { Avatar } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { locale } from '$lib/state/locale.svelte';

export type FeedMode = 'bubble' | 'explore' | 'activity';

type FilterIconProps = { size: number; class?: string };
type FilterIcon = Component<FilterIconProps> | null;

type Props = {
  userName: string;
  userPhoto: string | null;
  feedMode: FeedMode;
  selectedFilter: string;
  oncreate: () => void;
  onmodechange: (value: FeedMode) => void;
  onfilterchange: (value: string) => void;
};

let {
  userName,
  userPhoto,
  feedMode,
  selectedFilter,
  oncreate,
  onmodechange,
  onfilterchange,
}: Props = $props();

const t = $derived(locale.t);

type FilterOption = { value: string; label: string; icon: FilterIcon };

const filterOptions = $derived<FilterOption[]>([
  { value: 'ALL', label: t('feed.tabsAll'), icon: Sparkles as unknown as FilterIcon },
  { value: 'ACHIEVEMENT', label: t('feed.postTypes.ACHIEVEMENT'), icon: Award as unknown as FilterIcon },
  { value: 'OPPORTUNITY', label: t('feed.postTypes.OPPORTUNITY'), icon: Briefcase as unknown as FilterIcon },
  { value: 'LEARNING', label: t('feed.postTypes.LEARNING'), icon: GraduationCap as unknown as FilterIcon },
  { value: 'BUILD', label: t('feed.postTypes.BUILD'), icon: Code as unknown as FilterIcon },
  { value: 'QUESTION', label: t('feed.postTypes.QUESTION'), icon: HelpCircle as unknown as FilterIcon },
  { value: 'CHALLENGE', label: t('feed.postTypes.CHALLENGE'), icon: Target as unknown as FilterIcon },
]);

type ModeIconProps = { size: number; class?: string };
type ModeIcon = Component<ModeIconProps>;

const feedModeTabs = $derived<Array<{ value: FeedMode; label: string; icon: ModeIcon }>>([
  { value: 'bubble', label: t('feed.scopeBubble') ?? 'Minha bolha', icon: Users as unknown as ModeIcon },
  { value: 'explore', label: t('feed.scopeExplore') ?? 'Explorar', icon: Compass as unknown as ModeIcon },
  { value: 'activity', label: t('feed.tabsActivity') ?? 'Atividade', icon: Activity as unknown as ModeIcon },
]);

function handleFilterClick(value: string, el: HTMLElement) {
  onfilterchange(value);
  if (browser) {
    el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }
}
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
				<ImagePlus size={16} class="text-emerald-500" />
				<span class="hidden sm:inline">Imagem</span>
			</button>
			<button
				type="button"
				onclick={oncreate}
				aria-label="Anexar link"
				class="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
			>
				<Link2 size={16} class="text-sky-500" />
				<span class="hidden sm:inline">Link</span>
			</button>
			<button
				type="button"
				onclick={oncreate}
				aria-label="Adicionar sentimento"
				class="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
			>
				<Smile size={16} class="text-amber-500" />
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

<!--
  Mode switcher — segmented control style. Active tab has a solid pill
  instead of just a color change; this reads faster at a glance.
-->
<div class="mt-4 inline-flex rounded-full border border-gray-200 bg-gray-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
	{#each feedModeTabs as tab (tab.value)}
		{@const active = feedMode === tab.value}
		{@const Icon = tab.icon}
		<button
			type="button"
			onclick={() => onmodechange(tab.value)}
			aria-pressed={active}
			class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors {active
				? 'bg-white text-gray-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100'
				: 'text-gray-600 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-200'}"
		>
			<Icon size={13} />
			{tab.label}
		</button>
	{/each}
</div>

{#if feedMode !== 'activity'}
	<!--
	  Filter strip — same visual family as mode tabs so the admin-feel
	  is consistent. Horizontal scroll with a gradient mask so users
	  discover there's more beyond the fold.
	-->
	<div class="mt-3 filter-strip">
		<div class="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
			{#each filterOptions as option}
				{@const active = selectedFilter === option.value}
				{@const Icon = option.icon}
				<button
					class="shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors {active
						? 'border-gray-900 bg-gray-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
						: 'border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-200'}"
					aria-pressed={active}
					onclick={(e) => handleFilterClick(option.value, e.currentTarget as HTMLElement)}
				>
					{#if Icon}
						<Icon size={13} />
					{/if}
					{option.label}
				</button>
			{/each}
		</div>
	</div>
{/if}

<style>
	.scrollbar-none::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-none {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.filter-strip {
		-webkit-mask-image: linear-gradient(to right, black calc(100% - 2.5rem), transparent);
		mask-image: linear-gradient(to right, black calc(100% - 2.5rem), transparent);
	}
</style>
