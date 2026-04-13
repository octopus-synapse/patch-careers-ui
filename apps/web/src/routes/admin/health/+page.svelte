<script lang="ts">
	import {
		createPlatformCheck,
		createPlatformCheckDatabase,
		createPlatformCheckRedis,
		createPlatformCheckStorage,
		createPlatformCheckTranslate,
		createPlatformGetStatistics,
	} from 'api-client';
	import { browser } from '$app/environment';
	import { colorSchema } from '$lib/color-schema.svelte';
	import { locale } from '$lib/locale.svelte';
	import { Database, HardDrive, Globe, Server, RefreshCw } from 'lucide-svelte';
	import StatCard from '$lib/components/admin/stat-card.svelte';
	import StatusBadge from '$lib/components/admin/status-badge.svelte';

	const cs = $derived(colorSchema.mode);
	const t = $derived(locale.t);
	const cardBg = $derived(cs === 'dark' ? 'bg-neutral-800/50' : 'bg-white');
	const cardBorder = $derived(cs === 'dark' ? 'border-neutral-700/50' : 'border-gray-200');
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');

	const refetchInterval = 15000;

	const healthAll = createPlatformCheck(() => ({
		query: { enabled: browser, refetchInterval }
	}));
	const healthDb = createPlatformCheckDatabase(() => ({
		query: { enabled: browser, refetchInterval }
	}));
	const healthRedis = createPlatformCheckRedis(() => ({
		query: { enabled: browser, refetchInterval }
	}));
	const healthStorage = createPlatformCheckStorage(() => ({
		query: { enabled: browser, refetchInterval }
	}));
	const healthTranslate = createPlatformCheckTranslate(() => ({
		query: { enabled: browser, refetchInterval }
	}));
	const platformStats = createPlatformGetStatistics(() => ({
		query: { enabled: browser, refetchInterval: 30000 }
	}));

	type HealthStatus = 'healthy' | 'degraded' | 'down';

	function getStatus(query: { data?: { data?: { status?: string } }; isError?: boolean }): HealthStatus {
		if (query.isError) return 'down';
		const status = query.data?.data?.status;
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

	const stats = $derived(platformStats.data?.data?.data);
</script>

<svelte:head>
	<title>{t?.('admin.health.title') ?? 'Health'}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-semibold tracking-tight {text}">
			{t?.('admin.health.title') ?? 'Health & Infrastructure'}
		</h1>
		<div class="flex items-center gap-2 {muted}">
			<RefreshCw size={12} class="animate-spin" />
			<span class="text-[10px] font-medium uppercase tracking-widest">
				{t?.('admin.health.autoRefresh') ?? 'Auto-refresh: 15s'}
			</span>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
		{#each services as service}
			{@const status = getStatus(service.query)}
			{@const Icon = service.icon}
			<div class="rounded-xl border p-5 {cardBg} {cardBorder}">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Icon size={16} class={muted} />
						<span class="text-sm font-medium {text}">{service.label}</span>
					</div>
					<StatusBadge {status} colorSchema={cs} />
				</div>
			</div>
		{/each}
	</div>

	{#if stats}
		<div>
			<h2 class="mb-4 text-sm font-semibold uppercase tracking-widest {muted}">
				{t?.('admin.health.platformStats') ?? 'Platform Statistics'}
			</h2>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
				<StatCard
					label={t?.('admin.dashboard.totalUsers') ?? 'Total Users'}
					value={stats.totalUsers}
					colorSchema={cs}
				/>
				<StatCard
					label={t?.('admin.dashboard.totalResumes') ?? 'Total Resumes'}
					value={stats.totalResumes}
					colorSchema={cs}
				/>
				<StatCard
					label={t?.('admin.dashboard.totalViews') ?? 'Total Views'}
					value={stats.totalViews}
					colorSchema={cs}
				/>
				<StatCard
					label={t?.('admin.dashboard.activeToday') ?? 'Active Today'}
					value={stats.activeUsersToday}
					colorSchema={cs}
				/>
				<StatCard
					label={t?.('admin.dashboard.activeWeek') ?? 'Active This Week'}
					value={stats.activeUsersWeek}
					colorSchema={cs}
				/>
			</div>
		</div>
	{/if}
</div>
