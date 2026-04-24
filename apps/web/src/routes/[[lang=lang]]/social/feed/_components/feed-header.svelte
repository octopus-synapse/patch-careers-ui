<script lang="ts">
import {
  Award,
  Bookmark,
  Briefcase,
  Code,
  GraduationCap,
  HelpCircle,
  PenSquare,
  Sparkles,
  Target,
} from 'lucide-svelte';
import type { Component } from 'svelte';
import { Avatar, Button, Card, Tabs } from 'ui';
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

const feedModeTabs = $derived([
  { value: 'bubble', label: t('feed.scopeBubble') ?? 'Minha bolha' },
  { value: 'explore', label: t('feed.scopeExplore') ?? 'Explorar' },
  { value: 'activity', label: t('feed.tabsActivity') },
]);

function handleFilterClick(value: string, el: HTMLElement) {
  onfilterchange(value);
  if (browser) {
    el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }
}
</script>

<Card class="shadow-sm hover:shadow-md transition-shadow">
	<div class="flex items-center gap-2">
		<button
			class="flex flex-1 items-center gap-3 rounded-xl p-2 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/60"
			onclick={oncreate}
		>
			<Avatar name={userName || 'U'} photoURL={userPhoto} size="md" />
			<span class="flex-1 text-left text-sm text-gray-400 dark:text-neutral-500">{t('feed.whatsOnYourMind')}</span>
			<PenSquare size={18} class="text-gray-400 dark:text-neutral-500" />
		</button>
		<Button variant="ghost" size="sm" onclick={() => goto('/social/feed/bookmarks')}>
			<Bookmark size={18} />
			<span class="text-xs">{t('feed.saved')}</span>
		</Button>
	</div>
</Card>

<div class="mt-4">
	<Tabs
		tabs={feedModeTabs}
		selected={feedMode}
		onchange={(v) => {
			if (v === 'bubble' || v === 'explore' || v === 'activity') onmodechange(v);
		}}
	/>
</div>

{#if feedMode !== 'activity'}
	<div class="mt-4 filter-strip">
		<div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
			{#each filterOptions as option}
				{@const active = selectedFilter === option.value}
				{@const Icon = option.icon}
				<button
					class="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors {active ? 'bg-gray-800 text-white dark:bg-neutral-200 dark:text-neutral-900' : 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'}"
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
