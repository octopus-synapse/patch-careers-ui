<script lang="ts">
	import { createUsersGetUserDetails } from 'api-client';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { colorSchema } from '$lib/color-schema.svelte';
	import { locale } from '$lib/locale.svelte';
	import { ArrowLeft, Loader2 } from 'lucide-svelte';
	import { Avatar } from 'ui';
	import StatCard from '$lib/components/admin/stat-card.svelte';
	import StatusBadge from '$lib/components/admin/status-badge.svelte';

	const cs = $derived(colorSchema.mode);
	const t = $derived(locale.t);
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');
	const cardBg = $derived(cs === 'dark' ? 'bg-neutral-800/50' : 'bg-white');
	const cardBorder = $derived(cs === 'dark' ? 'border-neutral-700/50' : 'border-gray-200');

	const userId = $derived(($page.params as Record<string, string>).id ?? '');

	const userQuery = createUsersGetUserDetails(() => userId, () => ({
		query: { enabled: browser && !!userId }
	}));

	const user = $derived(userQuery.data?.data?.data?.user as Record<string, unknown> | undefined);
	const resumes = $derived((user?.resumes as Record<string, unknown>[] | undefined) ?? []);
	const counts = $derived(user?.counts as Record<string, number> | undefined);
</script>

<svelte:head>
	<title>{t?.('admin.users.detail.title') ?? 'User Details'}</title>
</svelte:head>

<div class="space-y-6">
	<a href="/admin/users" class="inline-flex items-center gap-1 text-sm transition-colors {muted} hover:opacity-70">
		<ArrowLeft size={14} />
		{t?.('admin.users.detail.back') ?? 'Back to users'}
	</a>

	{#if userQuery.isLoading}
		<div class="flex items-center justify-center py-20">
			<Loader2 size={24} class="animate-spin {muted}" />
		</div>
	{:else if user}
		<div class="rounded-xl border p-6 {cardBg} {cardBorder}">
			<div class="flex items-start gap-4">
				<Avatar name={(user.name as string) ?? (user.email as string)} size="lg" colorSchema={cs} />
				<div class="flex-1">
					<h1 class="text-lg font-semibold {text}">{user.name ?? '—'}</h1>
					<p class="text-sm {muted}">{user.email}</p>
					{#if user.roles}
						{@const roles = user.roles as string[]}
						<div class="mt-2 flex items-center gap-2">
							<StatusBadge status={roles.includes('role_admin') ? 'admin' : 'user'} colorSchema={cs} />
							<StatusBadge status={user.isActive ? 'active' : 'inactive'} colorSchema={cs} />
						</div>
					{/if}
				</div>
			</div>

			<dl class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
				<div>
					<dt class="text-[10px] font-bold uppercase tracking-widest {muted}">Username</dt>
					<dd class="mt-1 text-sm {text}">{user.username ?? '—'}</dd>
				</div>
				<div>
					<dt class="text-[10px] font-bold uppercase tracking-widest {muted}">Created</dt>
					<dd class="mt-1 text-sm {text}">{new Date(user.createdAt as string).toLocaleDateString()}</dd>
				</div>
				<div>
					<dt class="text-[10px] font-bold uppercase tracking-widest {muted}">Last Login</dt>
					<dd class="mt-1 text-sm {text}">{user.lastLoginAt ? new Date(user.lastLoginAt as string).toLocaleDateString() : '—'}</dd>
				</div>
				<div>
					<dt class="text-[10px] font-bold uppercase tracking-widest {muted}">Onboarding</dt>
					<dd class="mt-1 text-sm {text}">{user.hasCompletedOnboarding ? 'Completed' : 'Pending'}</dd>
				</div>
			</dl>
		</div>

		{#if counts}
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
				{#each Object.entries(counts) as [key, value]}
					<StatCard label={key} {value} colorSchema={cs} />
				{/each}
			</div>
		{/if}

		{#if resumes.length > 0}
			<div>
				<h2 class="mb-4 text-sm font-semibold uppercase tracking-widest {muted}">
					{t?.('admin.users.detail.resumes') ?? 'Resumes'} ({resumes.length})
				</h2>
				<div class="space-y-2">
					{#each resumes as resume}
						<div class="rounded-lg border px-4 py-3 {cardBg} {cardBorder}">
							<p class="text-sm font-medium {text}">{resume.title ?? 'Untitled'}</p>
							<p class="text-[10px] {muted}">
								{resume.primaryLanguage} · Created {new Date(resume.createdAt as string).toLocaleDateString()}
							</p>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
