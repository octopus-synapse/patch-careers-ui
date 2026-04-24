<script lang="ts">
import { Bookmark, Hash, Search, Sparkles, Users, X } from 'lucide-svelte';
import { Card } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { locale } from '$lib/state/locale.svelte';

type Post = Record<string, unknown>;

type Props = {
  posts: Post[];
  searchTerm: string;
  onsearch: (value: string) => void;
};

let { posts, searchTerm, onsearch }: Props = $props();

const t = $derived(locale.t);

let inputEl: HTMLInputElement | undefined = $state();

const activeTag = $derived(
  searchTerm.trim().startsWith('#') ? searchTerm.trim().slice(1).toLowerCase() : null,
);

const trending = $derived.by(() => {
  const counts = new Map<string, number>();
  for (const p of posts) {
    const tags = (p.hashtags as string[] | undefined) ?? [];
    for (const raw of tags) {
      if (typeof raw !== 'string') continue;
      const tag = raw.replace(/^#/, '').toLowerCase();
      if (!tag) continue;
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }));
});

// Focus the search input when the user presses "/" outside a text field —
// a familiar shortcut from GitHub/Gmail.
$effect(() => {
  if (!browser) return;
  function onKey(e: KeyboardEvent) {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target as HTMLElement | null;
    const tag = target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
    e.preventDefault();
    inputEl?.focus();
    inputEl?.select();
  }
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
});

function toggleTag(tag: string) {
  if (activeTag === tag) {
    onsearch('');
  } else {
    onsearch(`#${tag}`);
  }
}
</script>

<aside class="hidden space-y-4 lg:block">
	<Card class="shadow-sm">
		<label class="block">
			<span class="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-gray-500 dark:text-neutral-400">
				<span class="flex items-center gap-2">
					<Search size={14} />
					{t('feed.sidebar.searchLabel') ?? 'Buscar no feed'}
				</span>
				<kbd class="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500">/</kbd>
			</span>
			<div class="relative">
				<input
					bind:this={inputEl}
					type="search"
					value={searchTerm}
					oninput={(e) => onsearch(e.currentTarget.value)}
					placeholder={t('feed.sidebar.searchPlaceholder') ?? 'palavra ou #hashtag'}
					class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm text-gray-800 placeholder:text-gray-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:placeholder:text-neutral-500"
				/>
				{#if searchTerm}
					<button
						type="button"
						onclick={() => {
							onsearch('');
							inputEl?.focus();
						}}
						aria-label={t('feed.sidebar.clearSearch') ?? 'Limpar busca'}
						class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
					>
						<X size={14} />
					</button>
				{/if}
			</div>
		</label>
	</Card>

	{#if trending.length > 0}
		<Card class="shadow-sm">
			<p class="mb-3 flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-neutral-400">
				<Hash size={14} />
				{t('feed.sidebar.trendingTitle') ?? 'Em alta'}
			</p>
			<div class="flex flex-wrap gap-1.5">
				{#each trending as { tag, count }}
					{@const active = activeTag === tag}
					<button
						type="button"
						class="group flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors {active ? 'bg-cyan-600 text-white hover:bg-cyan-700 dark:bg-cyan-500 dark:text-neutral-900 dark:hover:bg-cyan-400' : 'bg-gray-100 text-gray-700 hover:bg-cyan-100 hover:text-cyan-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-cyan-900/40 dark:hover:text-cyan-300'}"
						aria-pressed={active}
						onclick={() => toggleTag(tag)}
					>
						<span>#{tag}</span>
						<span class="text-[10px] {active ? 'text-cyan-100 dark:text-cyan-900' : 'text-gray-400 group-hover:text-cyan-500 dark:text-neutral-500'}">{count}</span>
					</button>
				{/each}
			</div>
		</Card>
	{/if}

	<Card class="shadow-sm">
		<p class="mb-3 text-xs font-semibold text-gray-500 dark:text-neutral-400">
			{t('feed.sidebar.shortcutsTitle') ?? 'Atalhos'}
		</p>
		<nav class="flex flex-col gap-1">
			<button
				type="button"
				class="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
				onclick={() => goto('/social/feed/bookmarks')}
			>
				<Bookmark size={16} />
				<span>{t('feed.saved')}</span>
			</button>
			<button
				type="button"
				class="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
				onclick={() => goto('/social/network/suggestions')}
			>
				<Users size={16} />
				<span>{t('feed.sidebar.suggestions') ?? 'Sugestões de rede'}</span>
			</button>
			<button
				type="button"
				class="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
				onclick={() => goto('/careers/browse-jobs')}
			>
				<Sparkles size={16} />
				<span>{t('feed.sidebar.browseJobs') ?? 'Ver vagas'}</span>
			</button>
		</nav>
	</Card>
</aside>
