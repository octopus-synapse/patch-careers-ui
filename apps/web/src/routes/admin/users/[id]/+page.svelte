<script lang="ts">
	import {
		createUsersGetUserDetails,
		getUsersGetUserDetailsQueryKey,
		usersUpdateUser,
		usersAssignRoles,
	} from 'api-client';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { colorSchema } from '$lib/color-schema.svelte';
	import { locale } from '$lib/locale.svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { ArrowLeft, Loader2, Pencil, Save, X, Shield, ShieldOff } from 'lucide-svelte';
	import { Avatar, Input } from 'ui';
	import StatCard from '$lib/components/admin/stat-card.svelte';
	import StatusBadge from '$lib/components/admin/status-badge.svelte';
	import ConfirmModal from '$lib/components/admin/confirm-modal.svelte';

	const cs = $derived(colorSchema.mode);
	const t = $derived(locale.t);
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');
	const cardBg = $derived(cs === 'dark' ? 'bg-neutral-800/50' : 'bg-white');
	const cardBorder = $derived(cs === 'dark' ? 'border-neutral-700/50' : 'border-gray-200');
	const labelClass = $derived(`text-[10px] font-bold uppercase tracking-widest ${cs === 'dark' ? 'text-neutral-500' : 'text-gray-500'}`);
	const queryClient = useQueryClient();

	const userId = $derived(($page.params as Record<string, string>).id ?? '');

	const userQuery = createUsersGetUserDetails(() => userId, () => ({
		query: { enabled: browser && !!userId }
	}));

	const user = $derived(userQuery.data?.data?.data?.user as Record<string, unknown> | undefined);
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
			<div class="flex items-start justify-between">
				<div class="flex items-start gap-4">
					<Avatar name={(user.name as string) ?? (user.email as string)} size="lg" colorSchema={cs} />
					<div class="flex-1">
						{#if editing}
							<div class="space-y-2">
								<div>
									<label class={labelClass}>Name</label>
									<Input bind:value={editName} placeholder="Name" colorSchema={cs} />
								</div>
								<div>
									<label class={labelClass}>Email</label>
									<Input bind:value={editEmail} type="email" placeholder="Email" colorSchema={cs} />
								</div>
								<label class="flex items-center gap-2 text-sm {text}">
									<input type="checkbox" bind:checked={editIsActive} class="rounded" />
									Active
								</label>
							</div>
						{:else}
							<h1 class="text-lg font-semibold {text}">{user.name ?? '—'}</h1>
							<p class="text-sm {muted}">{user.email}</p>
							{#if user.roles}
								<div class="mt-2 flex items-center gap-2">
									<StatusBadge status={isAdmin ? 'admin' : 'user'} colorSchema={cs} />
									<StatusBadge status={user.isActive ? 'active' : 'inactive'} colorSchema={cs} />
								</div>
							{/if}
						{/if}
					</div>
				</div>

				<div class="flex items-center gap-1">
					{#if editing}
						<button
							onclick={saveEditing}
							disabled={editLoading}
							class="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors {cs === 'dark' ? 'bg-neutral-200 text-neutral-900' : 'bg-gray-800 text-gray-50'}"
						>
							{#if editLoading}<Loader2 size={12} class="animate-spin" />{:else}<Save size={12} />{/if}
							Save
						</button>
						<button
							onclick={cancelEditing}
							class="rounded-lg p-1.5 transition-colors {cs === 'dark' ? 'text-neutral-400 hover:bg-neutral-700' : 'text-gray-400 hover:bg-gray-100'}"
						>
							<X size={16} />
						</button>
					{:else}
						<button
							onclick={startEditing}
							class="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors {cs === 'dark' ? 'text-neutral-400 hover:bg-neutral-700' : 'text-gray-500 hover:bg-gray-100'}"
						>
							<Pencil size={12} />
							Edit
						</button>
						<button
							onclick={() => roleConfirm = true}
							class="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors {isAdmin ? 'text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20' : cs === 'dark' ? 'text-neutral-400 hover:bg-neutral-700' : 'text-gray-500 hover:bg-gray-100'}"
							title={isAdmin ? 'Remove admin' : 'Make admin'}
						>
							{#if isAdmin}<ShieldOff size={12} />{:else}<Shield size={12} />{/if}
							{isAdmin ? 'Revoke Admin' : 'Make Admin'}
						</button>
					{/if}
				</div>
			</div>

			{#if !editing}
				<dl class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
					<div>
						<dt class={labelClass}>Username</dt>
						<dd class="mt-1 text-sm {text}">{user.username ?? '—'}</dd>
					</div>
					<div>
						<dt class={labelClass}>Created</dt>
						<dd class="mt-1 text-sm {text}">{new Date(user.createdAt as string).toLocaleDateString()}</dd>
					</div>
					<div>
						<dt class={labelClass}>Last Login</dt>
						<dd class="mt-1 text-sm {text}">{user.lastLoginAt ? new Date(user.lastLoginAt as string).toLocaleDateString() : '—'}</dd>
					</div>
					<div>
						<dt class={labelClass}>Onboarding</dt>
						<dd class="mt-1 text-sm {text}">{user.hasCompletedOnboarding ? 'Completed' : 'Pending'}</dd>
					</div>
				</dl>
			{/if}
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

<ConfirmModal
	open={roleConfirm}
	title="Change Role"
	message={isAdmin ? 'Remove admin privileges from this user?' : 'Grant admin privileges to this user?'}
	loading={roleLoading}
	colorSchema={cs}
	onconfirm={handleToggleRole}
	oncancel={() => roleConfirm = false}
/>
