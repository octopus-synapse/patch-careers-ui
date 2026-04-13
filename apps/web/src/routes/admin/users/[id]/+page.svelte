<script lang="ts">
	import {
		createUsersGetUserDetails,
		getUsersGetUserDetailsQueryKey,
		usersUpdateUser,
		usersAssignRoles,
	} from 'api-client';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { locale } from '$lib/locale.svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { ArrowLeft, Loader2, Pencil, Save, X, Shield, ShieldOff } from 'lucide-svelte';
	import { Avatar, Button, Input } from 'ui';
	import StatCard from '$lib/components/admin/stat-card.svelte';
	import StatusBadge from '$lib/components/admin/status-badge.svelte';
	import ConfirmModal from '$lib/components/admin/confirm-modal.svelte';

	const t = $derived(locale.t);
	const queryClient = useQueryClient();

	const userId = $derived(($page.params as Record<string, string>).id ?? '');

	const userQuery = createUsersGetUserDetails(() => userId, () => ({
		query: { enabled: browser && !!userId }
	}));

	const user = $derived(userQuery.data?.user as Record<string, unknown> | undefined);
	const resumes = $derived((user?.resumes as Record<string, unknown>[] | undefined) ?? []);
	const counts = $derived(user?.counts as Record<string, number> | undefined);

	// --- Editing ---
	let editing = $state(false);
	let editLoading = $state(false);
	let editName = $state('');
	let editEmail = $state('');
	let editIsActive = $state(true);

	function startEditing() {
		editName = (user?.name as string) ?? '';
		editEmail = (user?.email as string) ?? '';
		editIsActive = (user?.isActive as boolean) ?? true;
		editing = true;
	}

	function cancelEditing() {
		editing = false;
	}

	async function saveEditing() {
		editLoading = true;
		try {
			await usersUpdateUser(userId, {
				name: editName || undefined,
				email: editEmail,
				isActive: editIsActive,
			});
			queryClient.invalidateQueries({ queryKey: getUsersGetUserDetailsQueryKey(userId) });
			editing = false;
		} finally {
			editLoading = false;
		}
	}

	// --- Role toggle ---
	let roleConfirm = $state(false);
	let roleLoading = $state(false);
	const userRoles = $derived((user?.roles as string[]) ?? []);
	const isAdmin = $derived(userRoles.includes('role_admin'));

	async function handleToggleRole() {
		roleLoading = true;
		const newRoles = isAdmin ? ['role_user'] : ['role_user', 'role_admin'];
		try {
			await usersAssignRoles(userId, {
				body: JSON.stringify({ roles: newRoles }),
				headers: { 'Content-Type': 'application/json' },
			});
			queryClient.invalidateQueries({ queryKey: getUsersGetUserDetailsQueryKey(userId) });
		} finally {
			roleLoading = false;
			roleConfirm = false;
		}
	}
</script>

<svelte:head>
	<title>{t('admin.users.detail.title')}</title>
</svelte:head>

<div class="space-y-6">
	<a href="/admin/users" class="inline-flex items-center gap-1 text-sm transition-colors text-gray-500 dark:text-neutral-500 hover:opacity-70">
		<ArrowLeft size={14} />
		{t('admin.users.detail.back')}
	</a>

	{#if userQuery.isLoading}
		<div class="flex items-center justify-center py-20">
			<Loader2 size={24} class="animate-spin text-gray-500 dark:text-neutral-500" />
		</div>
	{:else if user}
		<div class="rounded-xl border p-6 bg-white dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700/50">
			<div class="flex items-start justify-between">
				<div class="flex items-start gap-4">
					<Avatar name={(user.name as string) ?? (user.email as string)} size="lg" />
					<div class="flex-1">
						{#if editing}
							<div class="space-y-2">
								<div>
									<label class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">Name</label>
									<Input bind:value={editName} placeholder="Name" />
								</div>
								<div>
									<label class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">Email</label>
									<Input bind:value={editEmail} type="email" placeholder="Email" />
								</div>
								<label class="flex items-center gap-2 text-sm text-gray-800 dark:text-neutral-200">
									<input type="checkbox" bind:checked={editIsActive} class="rounded" />
									Active
								</label>
							</div>
						{:else}
							<h1 class="text-lg font-semibold text-gray-800 dark:text-neutral-200">{user.name ?? '—'}</h1>
							<p class="text-sm text-gray-500 dark:text-neutral-500">{user.email}</p>
							{#if user.roles}
								<div class="mt-2 flex items-center gap-2">
									<StatusBadge status={isAdmin ? 'admin' : 'user'} />
									<StatusBadge status={user.isActive ? 'active' : 'inactive'} />
								</div>
							{/if}
						{/if}
					</div>
				</div>

				<div class="flex items-center gap-1">
					{#if editing}
						<Button variant="solid" size="sm" onclick={saveEditing} disabled={editLoading}>
							{#if editLoading}<Loader2 size={12} class="animate-spin" />{:else}<Save size={12} />{/if}
							Save
						</Button>
						<Button variant="icon" size="xs" onclick={cancelEditing}>
							<X size={16} />
						</Button>
					{:else}
						<Button variant="ghost" size="sm" onclick={startEditing}>
							<Pencil size={12} />
							Edit
						</Button>
						<Button variant="ghost" size="sm" onclick={() => roleConfirm = true} class={isAdmin ? 'text-purple-400' : ''} title={isAdmin ? 'Remove admin' : 'Make admin'}>
							{#if isAdmin}<ShieldOff size={12} />{:else}<Shield size={12} />{/if}
							{isAdmin ? 'Revoke Admin' : 'Make Admin'}
						</Button>
					{/if}
				</div>
			</div>

			{#if !editing}
				<dl class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
					<div>
						<dt class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">Username</dt>
						<dd class="mt-1 text-sm text-gray-800 dark:text-neutral-200">{user.username ?? '—'}</dd>
					</div>
					<div>
						<dt class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">Created</dt>
						<dd class="mt-1 text-sm text-gray-800 dark:text-neutral-200">{new Date(user.createdAt as string).toLocaleDateString()}</dd>
					</div>
					<div>
						<dt class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">Last Login</dt>
						<dd class="mt-1 text-sm text-gray-800 dark:text-neutral-200">{user.lastLoginAt ? new Date(user.lastLoginAt as string).toLocaleDateString() : '—'}</dd>
					</div>
					<div>
						<dt class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">Onboarding</dt>
						<dd class="mt-1 text-sm text-gray-800 dark:text-neutral-200">{user.hasCompletedOnboarding ? 'Completed' : 'Pending'}</dd>
					</div>
				</dl>
			{/if}
		</div>

		{#if counts}
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
				{#each Object.entries(counts) as [key, value]}
					<StatCard label={key} {value} />
				{/each}
			</div>
		{/if}

		{#if resumes.length > 0}
			<div>
				<h2 class="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
					{t('admin.users.detail.resumes')} ({resumes.length})
				</h2>
				<div class="space-y-2">
					{#each resumes as resume}
						<div class="rounded-lg border px-4 py-3 bg-white dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700/50">
							<p class="text-sm font-medium text-gray-800 dark:text-neutral-200">{resume.title ?? 'Untitled'}</p>
							<p class="text-[10px] text-gray-500 dark:text-neutral-500">
								{resume.primaryLanguage} · Created {new Date(resume.createdAt as string).toLocaleDateString()}
							</p>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

<ConfirmModal
	open={roleConfirm}
	title="Change Role"
	message={isAdmin ? 'Remove admin privileges from this user?' : 'Grant admin privileges to this user?'}
	loading={roleLoading}
	onconfirm={handleToggleRole}
	oncancel={() => roleConfirm = false}
/>
