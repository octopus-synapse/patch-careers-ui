<script lang="ts">
import {
  createPlatformCheck,
  createPlatformCheckDatabase,
  createPlatformCheckRedis,
  createPlatformCheckStorage,
  createPlatformCheckTranslate,
  createPlatformGetStatistics,
} from 'api-client';
import { Database, Globe, HardDrive, RefreshCw, Server } from 'lucide-svelte';
import { browser } from '$app/environment';
import StatCard from '../_components/stat-card.svelte';
import StatusBadge from '../_components/status-badge.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

const refetchInterval = 15000;

const healthAll = createPlatformCheck(() => ({
  query: { enabled: browser, refetchInterval },
}));
const healthDb = createPlatformCheckDatabase(() => ({
  query: { enabled: browser, refetchInterval },
}));
const healthRedis = createPlatformCheckRedis(() => ({
  query: { enabled: browser, refetchInterval },
}));
const healthStorage = createPlatformCheckStorage(() => ({
  query: { enabled: browser, refetchInterval },
}));
const healthTranslate = createPlatformCheckTranslate(() => ({
  query: { enabled: browser, refetchInterval },
}));
const platformStats = createPlatformGetStatistics(() => ({
  query: { enabled: browser, refetchInterval: 30000 },
}));

type HealthStatus = 'healthy' | 'degraded' | 'down';

function getStatus(query: { data?: { status?: string }; isError?: boolean }): HealthStatus {
  if (query.isError) return 'down';
  const status = query.data?.status;
  if (status === 'ok') return 'healthy';
  if (status === 'error') return 'down';
  return 'degraded';
}

const services = $derived([
  { label: t?.('admin.health.api') ?? 'API', icon: Server, query: healthAll },
  { label: t?.('admin.health.database') ?? 'Database', icon: Database, query: healthDb },
  { label: t?.('admin.health.redis') ?? 'Redis', icon: HardDrive, query: healthRedis },
  { label: t?.('admin.health.storage') ?? 'Storage', icon: HardDrive, query: healthStorage },
  { label: t?.('admin.health.translation') ?? 'Translation', icon: Globe, query: healthTranslate },
]);

const stats = $derived(platformStats.data);
</script>

<svelte:head>
	<title>{t?.('admin.health.title') ?? 'Health'}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
			{t?.('admin.health.title') ?? 'Health & Infrastructure'}
		</h1>
		<div class="flex items-center gap-2 text-gray-500 dark:text-neutral-500">
			<RefreshCw size={12} class="animate-spin" />
			<span class="text-xs font-medium">
				{t?.('admin.health.autoRefresh') ?? 'Auto-refresh: 15s'}
			</span>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
		{#each services as service}
			{@const status = getStatus(service.query)}
			{@const Icon = service.icon}
			<div class="rounded-xl border p-5 bg-white dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700/50">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Icon size={16} class="text-gray-500 dark:text-neutral-500" />
						<span class="text-sm font-medium text-gray-800 dark:text-neutral-200">{service.label}</span>
					</div>
					<StatusBadge {status} />
				</div>
			</div>
		{/each}
	</div>

	{#if stats}
		<div>
			<h2 class="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
				{t?.('admin.health.platformStats') ?? 'Platform Statistics'}
			</h2>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
				<StatCard
					label={t?.('admin.dashboard.totalUsers') ?? 'Total Users'}
					value={stats.totalUsers}
				/>
				<StatCard
					label={t?.('admin.dashboard.totalResumes') ?? 'Total Resumes'}
					value={stats.totalResumes}
				/>
				<StatCard
					label={t?.('admin.dashboard.totalViews') ?? 'Total Views'}
					value={stats.totalViews}
				/>
				<StatCard
					label={t?.('admin.dashboard.activeToday') ?? 'Active Today'}
					value={stats.activeUsersToday}
				/>
				<StatCard
					label={t?.('admin.dashboard.activeWeek') ?? 'Active This Week'}
					value={stats.activeUsersWeek}
				/>
			</div>
		</div>
	{/if}
</div>
