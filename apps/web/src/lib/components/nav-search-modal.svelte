<script lang="ts">
import { SearchSearchSortBy, searchSearch } from 'api-client';
import { ArrowRight, Briefcase, Building2, FileText, Search } from 'lucide-svelte';
import { Avatar, Button } from 'ui';
import { goto } from '$app/navigation';

type Props = {
  open: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  onclose: () => void;
};

let { open, t, onclose }: Props = $props();

type PersonResult = {
  userId: string;
  fullName: string | null;
  jobTitle: string | null;
  slug: string | null;
  location: string | null;
};

let inputRef: HTMLInputElement | undefined = $state();
let query = $state('');
let people = $state<PersonResult[] | undefined>();
let total = $state(0);
let searching = $state(false);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

$effect(() => {
  if (open) {
    query = '';
    people = undefined;
    total = 0;
    setTimeout(() => inputRef?.focus(), 0);
  }
});

$effect(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    people = undefined;
    total = 0;
    return;
  }
  searching = true;
  debounceTimer = setTimeout(async () => {
    try {
      const res = (await searchSearch({
        q: trimmed,
        skills: '',
        location: '',
        minExp: 0,
        maxExp: 0,
        page: 1,
        limit: 5,
        sortBy: SearchSearchSortBy.relevance,
      })) as unknown as Record<string, unknown> | undefined;
      const items = (res?.data as Record<string, unknown>[] | undefined) ?? [];
      people = items.map((r) => ({
        userId: String(r.userId ?? ''),
        fullName: (r.fullName as string | null) ?? null,
        jobTitle: (r.jobTitle as string | null) ?? null,
        slug: (r.slug as string | null) ?? null,
        location: (r.location as string | null) ?? null,
      }));
      total = Number(res?.total ?? items.length);
    } catch {
      people = undefined;
      total = 0;
    }
    searching = false;
  }, 300);
});

function selectPerson(person: PersonResult) {
  if (!person.slug) return;
  onclose();
  goto(`/my-profile/public/@${person.slug}`);
}

function gotoSearchPage() {
  const trimmed = query.trim();
  if (!trimmed) return;
  onclose();
  goto(`/search?q=${encodeURIComponent(trimmed)}`);
}

function handleBackdrop(e: MouseEvent) {
  if (e.target === e.currentTarget) onclose();
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') onclose();
  if (e.key === 'Enter' && query.trim().length >= 2) {
    e.preventDefault();
    gotoSearchPage();
  }
}

const quickLinks = [
  { icon: Briefcase, labelKey: 'nav.jobs', href: '/careers/browse-jobs' },
  { icon: Building2, labelKey: 'nav.companies', href: '/companies' },
  { icon: FileText, labelKey: 'nav.about', href: '/about' },
];
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 px-4 pt-[15vh] backdrop-blur-sm"
		onclick={handleBackdrop}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="w-full max-w-[calc(100vw-2rem)] sm:max-w-lg overflow-hidden rounded-xl shadow-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700/60">
			<div class="flex items-center gap-3 border-b px-4 border-gray-200 dark:border-neutral-700/60">
				<Search size={16} class="text-gray-400 dark:text-neutral-500 shrink-0" />
				<input
					bind:this={inputRef}
					bind:value={query}
					type="text"
					placeholder={t('nav.searchPlaceholder')}
					class="h-12 w-full bg-transparent text-sm outline-none text-gray-800 dark:text-neutral-200 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
				/>
				<Button
					variant="ghost"
					size="xs"
					onclick={onclose}
					class="shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 border-gray-200 dark:border-neutral-700"
				>
					ESC
				</Button>
			</div>

			<div class="max-h-96 overflow-y-auto px-2 py-3 scrollbar-thin">
				{#if people && people.length > 0}
					<div class="flex items-center justify-between px-2 pb-2">
						<span class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
							{t('nav.searchSectionPeople')}
						</span>
						<button
							type="button"
							onclick={gotoSearchPage}
							class="text-[11px] font-medium text-emerald-600 hover:underline dark:text-emerald-300"
						>
							{t('nav.searchSeeAll')}
						</button>
					</div>
					{#each people as person}
						<button
							onclick={() => selectPerson(person)}
							class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
						>
							<Avatar name={person.fullName ?? person.slug ?? '?'} photoURL={null} size="sm" />
							<div class="flex-1 min-w-0">
								<span class="block truncate text-sm font-medium text-gray-800 dark:text-neutral-200">
									{person.fullName ?? person.slug ?? 'Unknown'}
								</span>
								{#if person.jobTitle || person.location}
									<span class="block truncate text-[11px] text-gray-400 dark:text-neutral-500">
										{[person.jobTitle, person.location].filter(Boolean).join(' · ')}
									</span>
								{/if}
							</div>
							<ArrowRight size={14} class="text-gray-400 dark:text-neutral-500" />
						</button>
					{/each}
				{:else if query.trim().length >= 2 && !searching}
					<div class="flex items-center justify-center py-6">
						<span class="text-xs text-gray-400 dark:text-neutral-500">{t('nav.searchNoUsers')}</span>
					</div>
				{:else}
					<div class="px-2 pb-2">
						<span class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
							{t('nav.searchQuickLinks')}
						</span>
					</div>

					{#each quickLinks as link}
						<button
							onclick={() => { onclose(); goto(link.href); }}
							class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
						>
							<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400 dark:text-neutral-500 border border-gray-200 dark:border-neutral-700/60">
								<link.icon size={14} />
							</div>
							<span class="flex-1 text-sm text-gray-800 dark:text-neutral-200">{t(link.labelKey)}</span>
							<ArrowRight size={14} class="text-gray-400 dark:text-neutral-500" />
						</button>
					{/each}
				{/if}
			</div>

			<div class="hidden sm:flex items-center gap-4 border-t px-4 py-2.5 border-gray-200 dark:border-neutral-700/60 bg-gray-50 dark:bg-neutral-800/50">
				<div class="flex items-center gap-1.5">
					<kbd class="inline-flex h-5 items-center justify-center rounded border px-1 text-[10px] bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 border-gray-200 dark:border-neutral-700">
						&crarr;
					</kbd>
					<span class="text-[10px] text-gray-400 dark:text-neutral-500">{t('nav.searchTipSelect')}</span>
				</div>
				<div class="flex items-center gap-1.5">
					<kbd class="inline-flex h-5 items-center justify-center rounded border px-1 text-[10px] bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 border-gray-200 dark:border-neutral-700">
						esc
					</kbd>
					<span class="text-[10px] text-gray-400 dark:text-neutral-500">{t('nav.searchTipClose')}</span>
				</div>
			</div>
		</div>
	</div>
{/if}
