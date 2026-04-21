<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createNotificationsGetByUser,
  createNotificationsMarkRead,
  getNotificationsGetByUserQueryKey,
  getNotificationsGetUnreadCountQueryKey,
  notificationsGetByUser,
  notificationsMarkRead,
} from 'api-client';
import { Bell } from 'lucide-svelte';
import type { Component } from 'svelte';
import { Avatar, Button, EmptyState, Skeleton, Tabs, toastState } from 'ui';
import { browser } from '$app/environment';
import { track } from '$lib/analytics/track';
import { useAuth } from '$lib/state/auth.svelte';
import { locale } from '$lib/state/locale.svelte';
import { useSseSubscribe } from '$lib/query/use-sse-subscribe';

const t = $derived(locale.t);
const auth = useAuth();
const authenticated = $derived(auth.data?.authenticated);

type TabKey = 'all' | 'connections' | 'engagement';

type NotificationItem = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  actor?: {
    id: string;
    name: string | null;
    username: string | null;
    photoURL: string | null;
  } | null;
};

let activeTab = $state<TabKey>('all');
const tabs = $derived([
  { value: 'all', label: t('notifications.tabAll') },
  { value: 'connections', label: t('notifications.tabConnections') },
  { value: 'engagement', label: t('notifications.tabEngagement') },
]);

const CONNECTION_TYPES = new Set(['CONNECTION_REQUEST', 'CONNECTION_ACCEPTED', 'FOLLOW_NEW']);

const initialQuery = createNotificationsGetByUser(
  () => ({ limit: 20 }),
  () => ({ query: { enabled: browser && authenticated } }),
);

function unwrapNotifications(data: unknown): {
  items: NotificationItem[];
  nextCursor: string | null;
} {
  const outer = data as Record<string, unknown> | undefined;
  const items = (outer?.data as NotificationItem[] | undefined) ?? [];
  const nextCursor = (outer?.nextCursor as string | null | undefined) ?? null;
  return { items, nextCursor };
}

let extra = $state<NotificationItem[]>([]);
let cursor = $state<string | null>(null);
let loadingMore = $state(false);

const firstPage = $derived(unwrapNotifications(initialQuery.data));
const all = $derived([...firstPage.items, ...extra]);

const filtered = $derived.by(() => {
  if (activeTab === 'all') return all;
  if (activeTab === 'connections') return all.filter((n) => CONNECTION_TYPES.has(n.type));
  return all.filter((n) => !CONNECTION_TYPES.has(n.type));
});

const queryClient = useQueryClient();

// svelte-ignore state_referenced_locally
useSseSubscribe('/v1/notifications/subscribe', {
  queryClient,
  invalidateKeys: [
    getNotificationsGetByUserQueryKey({ limit: 20 }),
    getNotificationsGetUnreadCountQueryKey(),
  ],
  enabled: authenticated,
});

async function loadMore() {
  const next = extra.length === 0 ? firstPage.nextCursor : cursor;
  if (loadingMore || !next) return;
  loadingMore = true;
  try {
    const res = (await notificationsGetByUser({ cursor: next, limit: 20 })) as unknown as
      | Record<string, unknown>
      | undefined;
    const page = unwrapNotifications(res);
    extra = [...extra, ...page.items];
    cursor = page.nextCursor;
  } finally {
    loadingMore = false;
  }
}

const markReadMutation = createNotificationsMarkRead(() => ({
  mutation: {
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: getNotificationsGetByUserQueryKey({ limit: 20 }) });
      queryClient.invalidateQueries({ queryKey: getNotificationsGetUnreadCountQueryKey() });
      extra = extra.map((n) => ({ ...n, read: true }));
      track('notifications_mark_all_read');
    },
    onError() {
      toastState.show(t('notifications.errorMarkRead'), 'danger');
    },
  },
}));

async function markOne(id: string) {
  try {
    await notificationsMarkRead({
      body: JSON.stringify({ notificationId: id }),
      headers: { 'Content-Type': 'application/json' },
    });
    extra = extra.map((n) => (n.id === id ? { ...n, read: true } : n));
    queryClient.invalidateQueries({
      queryKey: getNotificationsGetByUserQueryKey({ limit: 20 }),
    });
    queryClient.invalidateQueries({ queryKey: getNotificationsGetUnreadCountQueryKey() });
  } catch {
    toastState.show(t('notifications.errorMarkRead'), 'danger');
  }
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return t('feed.justNow');
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

let sentinel: HTMLDivElement | undefined = $state();

$effect(() => {
  if (!sentinel) return;
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) loadMore();
    },
    { rootMargin: '200px' },
  );
  observer.observe(sentinel);
  return () => observer.disconnect();
});

const hasMore = $derived(extra.length === 0 ? Boolean(firstPage.nextCursor) : Boolean(cursor));
</script>

<svelte:head>
	<title>{t('notifications.pageTitle')}</title>
</svelte:head>

<div class="min-h-screen pt-20 pb-12">
	<div class="mx-auto max-w-2xl px-3 sm:px-6">
		<header class="mb-4 flex items-center justify-between">
			<h1 class="text-lg font-semibold text-gray-800 dark:text-neutral-200">
				{t('notifications.pageTitle')}
			</h1>
			{#if all.some((n) => !n.read)}
				<Button
					variant="outline"
					size="sm"
					onclick={() => markReadMutation.mutate(undefined)}
					disabled={markReadMutation.isPending}
				>
					{t('notifications.markAllRead')}
				</Button>
			{/if}
		</header>

		<div class="mb-4">
			<Tabs {tabs} selected={activeTab} onchange={(v) => (activeTab = v as TabKey)} />
		</div>

		<section class="rounded-xl border overflow-hidden border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50">
			{#if initialQuery.isLoading && all.length === 0}
				<div class="divide-y divide-gray-200 dark:divide-neutral-800">
					{#each Array(5) as _}
						<div class="flex items-center gap-3 px-4 py-3 sm:px-6">
							<Skeleton shape="avatar" width="2.5rem" height="2.5rem" />
							<div class="flex-1 space-y-2">
								<Skeleton shape="text" width="60%" />
								<Skeleton shape="text" width="30%" />
							</div>
						</div>
					{/each}
				</div>
			{:else if filtered.length === 0}
				<EmptyState
					message={t('notifications.empty')}
					icon={Bell as unknown as Component<{ size: number; class?: string }>}
				/>
			{:else}
				<ul class="divide-y divide-gray-200 dark:divide-neutral-800">
					{#each filtered as item (item.id)}
						<li class="flex items-start gap-3 px-4 py-3 sm:px-6 {item.read ? 'opacity-70' : 'bg-emerald-50/30 dark:bg-emerald-900/10'}">
							<Avatar
								name={item.actor?.name ?? item.actor?.username ?? '?'}
								photoURL={item.actor?.photoURL}
								size="md"
							/>
							<div class="min-w-0 flex-1">
								<p class="text-sm text-gray-800 dark:text-neutral-200">
									{#if item.actor?.username}
										<a href="/my-profile/public/@{item.actor.username}" class="font-semibold hover:underline">
											{item.actor.name ?? item.actor.username}
										</a>
										<span class="text-gray-600 dark:text-neutral-400">{item.message}</span>
									{:else}
										{item.message}
									{/if}
								</p>
								<p class="mt-0.5 text-[11px] text-gray-400 dark:text-neutral-500">
									{timeAgo(item.createdAt)}
								</p>
							</div>
							{#if !item.read}
								<button
									type="button"
									class="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500"
									aria-label="mark read"
									onclick={() => markOne(item.id)}
								></button>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		{#if hasMore}
			<div bind:this={sentinel} class="flex justify-center py-6">
				{#if loadingMore}
					<div class="flex gap-2">
						{#each [1, 2, 3] as _}
							<div class="h-2 w-2 animate-bounce rounded-full bg-gray-300 dark:bg-neutral-600" style="animation-delay: {_ * 150}ms"></div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
