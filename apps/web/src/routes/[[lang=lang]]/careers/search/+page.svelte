<script lang="ts">
import { SearchSearchSortBy, createJobsFindAll, createSearchSearch, searchSearch } from 'api-client';
import { Search, Users } from 'lucide-svelte';
import type { Component } from 'svelte';
import { Button, EmptyState, Input, Skeleton, Tabs } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { track } from '$lib/utils/analytics/track';
import UserCard from '$lib/components/user/user-card.svelte';
import { locale } from '$lib/state/locale.svelte';
import { InfiniteScrollTrigger } from 'ui';

const t = $derived(locale.t);

type Person = {
  userId: string;
  fullName: string | null;
  jobTitle: string | null;
  slug: string | null;
  location: string | null;
};

const initialQuery = $derived($page.url.searchParams.get('q') ?? '');
const initialSkills = $derived($page.url.searchParams.get('skills') ?? '');
const initialLocation = $derived($page.url.searchParams.get('location') ?? '');
const initialMinExp = $derived(Number($page.url.searchParams.get('minExp') ?? '') || 0);
const initialMaxExp = $derived(Number($page.url.searchParams.get('maxExp') ?? '') || 0);
const initialType = $derived($page.url.searchParams.get('type') ?? 'people');

let queryInput = $state('');
let skillsInput = $state('');
let locationInput = $state('');
let minExpInput = $state('');
let maxExpInput = $state('');
let activeTab = $state<'people' | 'posts' | 'jobs' | 'companies'>('people');

$effect(() => {
  queryInput = initialQuery;
  skillsInput = initialSkills;
  locationInput = initialLocation;
  minExpInput = initialMinExp ? String(initialMinExp) : '';
  maxExpInput = initialMaxExp ? String(initialMaxExp) : '';
  const validTabs = ['people', 'posts', 'jobs', 'companies'] as const;
  activeTab = (validTabs as readonly string[]).includes(initialType)
    ? (initialType as typeof activeTab)
    : 'people';
});

const queryParams = $derived({
  q: initialQuery,
  skills: initialSkills,
  location: initialLocation,
  minExp: initialMinExp,
  maxExp: initialMaxExp,
  page: 1,
  limit: 20,
  sortBy: SearchSearchSortBy.relevance,
});

const query = createSearchSearch(
  () => queryParams,
  () => ({
    query: { enabled: browser && initialQuery.trim().length >= 2 && activeTab === 'people' },
  }),
);

const jobsQuery = createJobsFindAll(
  () => ({ search: initialQuery, skills: '', page: 1, limit: 20 }),
  () => ({
    query: { enabled: browser && initialQuery.trim().length >= 2 && activeTab === 'jobs' },
  }),
);

function rowsFrom(items?: Record<string, unknown>[]): Person[] {
  return (items ?? []).map((r) => ({
    userId: String(r.userId ?? ''),
    fullName: (r.fullName as string | null) ?? null,
    jobTitle: (r.jobTitle as string | null) ?? null,
    slug: (r.slug as string | null) ?? null,
    location: (r.location as string | null) ?? null,
  }));
}

const firstPage = $derived.by(() => {
  const data = query.data as Record<string, unknown> | undefined;
  const items = (data?.data as Record<string, unknown>[] | undefined) ?? [];
  return {
    rows: rowsFrom(items),
    total: Number(data?.total ?? 0),
    totalPages: Number(data?.totalPages ?? 0),
  };
});

let extra = $state<Person[]>([]);
let pageNum = $state(1);
let loadingMore = $state(false);

$effect(() => {
  // reset accumulator when the search query changes
  void initialQuery;
  void initialSkills;
  void initialLocation;
  void initialMinExp;
  void initialMaxExp;
  extra = [];
  pageNum = 1;
});

async function loadMore() {
  if (loadingMore) return;
  loadingMore = true;
  try {
    const next = pageNum + 1;
    const res = (await searchSearch({
      ...queryParams,
      page: next,
    })) as unknown as Record<string, unknown> | undefined;
    const items = (res?.data as Record<string, unknown>[] | undefined) ?? [];
    extra = [...extra, ...rowsFrom(items)];
    pageNum = next;
  } finally {
    loadingMore = false;
  }
}

const all = $derived([...firstPage.rows, ...extra]);

function applyFilters() {
  const params = new URLSearchParams();
  if (queryInput.trim()) params.set('q', queryInput.trim());
  if (skillsInput.trim()) params.set('skills', skillsInput.trim());
  if (locationInput.trim()) params.set('location', locationInput.trim());
  if (minExpInput.trim()) params.set('minExp', minExpInput.trim());
  if (maxExpInput.trim()) params.set('maxExp', maxExpInput.trim());
  params.set('type', activeTab);
  track('search_submitted', {
    q: queryInput.trim(),
    withSkills: skillsInput.trim().length > 0,
    withLocation: locationInput.trim().length > 0,
  });
  goto(`/search?${params.toString()}`);
}

function clearFilters() {
  skillsInput = '';
  locationInput = '';
  minExpInput = '';
  maxExpInput = '';
  applyFilters();
}

function onTabChange(value: string) {
  activeTab = value as typeof activeTab;
  const params = new URLSearchParams($page.url.searchParams);
  params.set('type', value);
  goto(`/search?${params.toString()}`);
}

const tabs = $derived([
  { value: 'people', label: t('nav.searchSectionPeople') },
  { value: 'posts', label: t('nav.searchSectionPosts') },
  { value: 'jobs', label: t('nav.searchSectionJobs') },
  { value: 'companies', label: t('nav.searchSectionCompanies') },
]);
</script>

<svelte:head>
	<title>{t('nav.searchPagePeopleTitle')}</title>
</svelte:head>

<div class="min-h-screen pt-20 pb-12">
	<div class="mx-auto max-w-6xl px-3 sm:px-6">
		<header class="mb-4">
			<form
				class="flex items-center gap-2"
				onsubmit={(e) => {
					e.preventDefault();
					applyFilters();
				}}
			>
				<div class="relative flex-1">
					<Search
						size={16}
						class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500"
					/>
					<input
						type="text"
						class="h-10 w-full rounded-lg border bg-white pl-9 pr-3 text-sm outline-none border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-cyan-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
						placeholder={t('nav.searchPlaceholder')}
						bind:value={queryInput}
					/>
				</div>
				<Button variant="solid" size="sm" type="submit">
					{t('nav.searchApply')}
				</Button>
			</form>
		</header>

		<div class="mb-4">
			<Tabs {tabs} selected={activeTab} onchange={onTabChange} />
		</div>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-[16rem_1fr]">
			<aside class="space-y-3">
				<h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-500">
					{t('nav.searchFiltersTitle')}
				</h2>
				<label class="block">
					<span class="mb-1 block text-xs text-gray-600 dark:text-neutral-400">
						{t('nav.searchFilterSkills')}
					</span>
					<Input bind:value={skillsInput} placeholder="React, TypeScript" />
				</label>
				<label class="block">
					<span class="mb-1 block text-xs text-gray-600 dark:text-neutral-400">
						{t('nav.searchFilterLocation')}
					</span>
					<Input bind:value={locationInput} placeholder="" />
				</label>
				<label class="block">
					<span class="mb-1 block text-xs text-gray-600 dark:text-neutral-400">
						{t('nav.searchFilterMinExp')}
					</span>
					<Input bind:value={minExpInput} placeholder="0" />
				</label>
				<label class="block">
					<span class="mb-1 block text-xs text-gray-600 dark:text-neutral-400">
						{t('nav.searchFilterMaxExp')}
					</span>
					<Input bind:value={maxExpInput} placeholder="20" />
				</label>
				<div class="flex gap-2 pt-2">
					<Button variant="solid" size="sm" fullWidth onclick={applyFilters}>
						{t('nav.searchApply')}
					</Button>
					<Button variant="outline" size="sm" onclick={clearFilters}>
						{t('nav.searchClear')}
					</Button>
				</div>
			</aside>

			<section>
				{#if activeTab === 'posts'}
					<EmptyState
						message={t('nav.searchSoonPosts')}
						icon={Search as unknown as Component<{ size: number; class?: string }>}
					/>
				{:else if activeTab === 'jobs'}
					{#if !initialQuery}
						<EmptyState
							message={t('nav.searchEmptyState')}
							icon={Search as unknown as Component<{ size: number; class?: string }>}
						/>
					{:else if jobsQuery.isLoading}
						<div class="grid grid-cols-1 gap-3">
							{#each Array(5) as _}
								<div class="rounded-xl border p-4 border-gray-200 dark:border-neutral-800">
									<Skeleton shape="text" width="60%" />
									<Skeleton shape="text" width="40%" />
								</div>
							{/each}
						</div>
					{:else if ((jobsQuery.data as Record<string, unknown> | undefined)?.items as unknown[] | undefined)?.length}
						<div class="grid grid-cols-1 gap-3">
							{#each ((jobsQuery.data as Record<string, unknown> | undefined)?.items as Record<string, unknown>[]) as job}
								<a
									href="/careers/browse-jobs/{String(job.id)}"
									class="block rounded-xl border p-4 transition-colors hover:border-cyan-500 border-gray-200 dark:border-neutral-800"
								>
									<div class="text-sm font-semibold text-gray-900 dark:text-neutral-100">{String(job.title ?? '')}</div>
									<div class="text-xs text-gray-500 dark:text-neutral-500">{String(job.company ?? '')} · {String(job.location ?? '')}</div>
								</a>
							{/each}
						</div>
					{:else}
						<EmptyState
							message={t('nav.searchNoUsers')}
							icon={Search as unknown as Component<{ size: number; class?: string }>}
						/>
					{/if}
				{:else if activeTab === 'companies'}
					<EmptyState
						message={t('nav.searchSoonCompanies')}
						icon={Search as unknown as Component<{ size: number; class?: string }>}
					/>
				{:else if !initialQuery}
					<EmptyState
						message={t('nav.searchEmptyState')}
						icon={Search as unknown as Component<{ size: number; class?: string }>}
					/>
				{:else if query.isLoading}
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
						{#each Array(6) as _}
							<div class="flex flex-col items-center gap-2 rounded-xl border p-4 border-gray-200 dark:border-neutral-800">
								<Skeleton shape="avatar" width="3.5rem" height="3.5rem" />
								<Skeleton shape="text" width="80%" />
								<Skeleton shape="text" width="60%" />
							</div>
						{/each}
					</div>
				{:else if all.length === 0}
					<EmptyState
						message={t('nav.searchNoUsers')}
						icon={Users as unknown as Component<{ size: number; class?: string }>}
					/>
				{:else}
					<div class="mb-3 text-xs text-gray-500 dark:text-neutral-500">
						{t('nav.searchResultsCount', { count: firstPage.total })}
					</div>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
						{#each all as person (person.userId)}
							<UserCard
								user={{
									id: person.userId,
									name: person.fullName,
									username: person.slug,
									photoURL: null,
								}}
								subtitle={[person.jobTitle, person.location].filter(Boolean).join(' · ') || undefined}
							/>
						{/each}
					</div>
					<InfiniteScrollTrigger
						onLoadMore={loadMore}
						hasMore={pageNum < firstPage.totalPages}
						isLoading={loadingMore}
					/>
				{/if}
			</section>
		</div>
	</div>
</div>
