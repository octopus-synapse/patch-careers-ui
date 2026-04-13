<script lang="ts">
	import {
		createUsersListUsers,
		getUsersListUsersQueryKey,
		usersCreateUser,
		usersDeleteUser,
		usersResetPassword,
		usersAssignRoles,
	} from 'api-client';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { colorSchema } from '$lib/color-schema.svelte';
	import { locale } from '$lib/locale.svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { Avatar, Input } from 'ui';
	import { Plus, Shield, ShieldOff } from 'lucide-svelte';
	import DataTable from '$lib/components/admin/data-table.svelte';
	import SearchFilterBar from '$lib/components/admin/search-filter-bar.svelte';
	import Pagination from '$lib/components/admin/pagination.svelte';
	import StatusBadge from '$lib/components/admin/status-badge.svelte';
	import ConfirmModal from '$lib/components/admin/confirm-modal.svelte';
	import FormModal from '$lib/components/admin/form-modal.svelte';
	import ExportButton from '$lib/components/admin/export-button.svelte';

	const cs = $derived(colorSchema.mode);
	const t = $derived(locale.t);
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');
	const labelClass = $derived(`text-[10px] font-bold uppercase tracking-widest ${cs === 'dark' ? 'text-neutral-500' : 'text-gray-500'}`);
	const queryClient = useQueryClient();

	let page = $state(1);
	let search = $state('');
	let roleFilter = $state('');

	const usersQuery = createUsersListUsers(() => ({
		page,
		limit: 20,
		search: search || undefined,
		roleName: roleFilter || undefined,
	}), () => ({
		query: { enabled: browser }
	}));

	const users = $derived(
		(usersQuery.data?.data?.data?.users as Record<string, unknown>[] | undefined) ?? []
	);
	const pagination = $derived(
		usersQuery.data?.data?.data?.pagination as { page: number; totalPages: number; total: number } | undefined
	);

	// --- Actions state ---
	let deleteUserId = $state<string | null>(null);
	let resetPasswordUserId = $state<string | null>(null);
	let toggleRoleUser = $state<Record<string, unknown> | null>(null);
	let actionLoading = $state(false);

	// --- Create user ---
	let createModal = $state(false);
	let createLoading = $state(false);
	let newEmail = $state('');
	let newName = $state('');
	let newPassword = $state('');

	// --- Bulk selection ---
	let selectedIds = $state<Set<string>>(new Set());
	let bulkDeleteConfirm = $state(false);
	let bulkLoading = $state(false);

	const allSelected = $derived(users.length > 0 && users.every(u => selectedIds.has(u.id as string)));

	function toggleSelectAll() {
		if (allSelected) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(users.map(u => u.id as string));
		}
	}

	function toggleSelect(id: string) {
		const next = new Set(selectedIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedIds = next;
	}

	function invalidate() {
		queryClient.invalidateQueries({ queryKey: getUsersListUsersQueryKey() });
	}

	async function handleDelete() {
		if (!deleteUserId) return;
		actionLoading = true;
		try {
			await usersDeleteUser(deleteUserId);
			invalidate();
		} finally {
			actionLoading = false;
			deleteUserId = null;
		}
	}

	async function handleResetPassword() {
		if (!resetPasswordUserId) return;
		actionLoading = true;
		try {
			await usersResetPassword(resetPasswordUserId, { newPassword: crypto.randomUUID().slice(0, 16) });
		} finally {
			actionLoading = false;
			resetPasswordUserId = null;
		}
	}

	async function handleCreateUser() {
		createLoading = true;
		try {
			await usersCreateUser({ email: newEmail, password: newPassword, name: newName || undefined });
			invalidate();
			createModal = false;
			newEmail = '';
			newName = '';
			newPassword = '';
		} finally {
			createLoading = false;
		}
	}

	async function handleToggleRole() {
		if (!toggleRoleUser) return;
		actionLoading = true;
		const currentRoles = (toggleRoleUser.roles as string[]) ?? [];
		const isAdmin = currentRoles.includes('role_admin');
		const newRoles = isAdmin ? ['role_user'] : ['role_user', 'role_admin'];
		try {
			await usersAssignRoles((toggleRoleUser.id as string), {
				body: JSON.stringify({ roles: newRoles }),
				headers: { 'Content-Type': 'application/json' },
			});
			invalidate();
		} finally {
			actionLoading = false;
			toggleRoleUser = null;
		}
	}

	async function handleBulkDelete() {
		bulkLoading = true;
		try {
			for (const id of selectedIds) {
				await usersDeleteUser(id);
			}
			selectedIds = new Set();
			invalidate();
		} finally {
			bulkLoading = false;
			bulkDeleteConfirm = false;
		}
	}

	const columns = [
		{ key: 'checkbox', label: '', width: '40px' },
		{ key: 'name', label: t?.('admin.users.name') ?? 'Name' },
		{ key: 'email', label: t?.('admin.users.email') ?? 'Email' },
		{ key: 'role', label: t?.('admin.users.role') ?? 'Role', width: '100px' },
		{ key: 'status', label: t?.('admin.users.status') ?? 'Status', width: '100px' },
		{ key: 'createdAt', label: t?.('admin.users.created') ?? 'Created', width: '120px' },
		{ key: 'actions', label: '', width: '200px' },
	];

	const filters = $derived([
		{
			key: 'role',
			label: t?.('admin.users.filterRole') ?? 'All Roles',
			options: [
				{ value: 'role_admin', label: 'Admin' },
				{ value: 'role_user', label: 'User' },
			],
			value: roleFilter,
		},
	]);
</script>

<svelte:head>
	<title>{t?.('admin.users.title') ?? 'Users'}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-semibold tracking-tight {text}">
			{t?.('admin.users.title') ?? 'User Management'}
		</h1>
		<div class="flex items-center gap-2">
			<ExportButton data={users} filename="users.csv" colorSchema={cs} />
			<button
				onclick={() => createModal = true}
				class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors {cs === 'dark' ? 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300' : 'bg-gray-800 text-gray-50 hover:bg-gray-700'}"
			>
				<Plus size={14} />
				New User
			</button>
		</div>
	</div>

	<SearchFilterBar
		{search}
		{filters}
		placeholder={t?.('admin.users.search') ?? 'Search by name or email...'}
		colorSchema={cs}
		onsearch={(v) => { search = v; page = 1; }}
		onfilterchange={(key, value) => { if (key === 'role') roleFilter = value; page = 1; }}
	/>

	{#if selectedIds.size > 0}
		<div class="flex items-center gap-3 rounded-lg border px-4 py-2 {cs === 'dark' ? 'border-neutral-700 bg-neutral-800/50' : 'border-gray-200 bg-gray-50'}">
			<span class="text-xs font-medium {text}">{selectedIds.size} selected</span>
			<button
				onclick={() => bulkDeleteConfirm = true}
				class="text-[10px] font-semibold uppercase tracking-wider text-red-400 transition-colors hover:text-red-300"
			>
				Delete Selected
			</button>
			<button
				onclick={() => selectedIds = new Set()}
				class="text-[10px] font-semibold uppercase tracking-wider {muted}"
			>
				Clear
			</button>
		</div>
	{/if}

	<DataTable
		{columns}
		data={users}
		loading={usersQuery.isLoading}
		emptyMessage={t?.('admin.users.noUsers') ?? 'No users found'}
		colorSchema={cs}
		onrowclick={(row) => goto(`/admin/users/${row.id}`)}
	>
		{#snippet cell({ row, key })}
			{#if key === 'checkbox'}
				<input
					type="checkbox"
					checked={selectedIds.has(row.id as string)}
					onclick={(e) => { e.stopPropagation(); toggleSelect(row.id as string); }}
					class="rounded"
				/>
			{:else if key === 'name'}
				<div class="flex items-center gap-2">
					<Avatar name={(row.name as string) ?? (row.email as string)} size="sm" colorSchema={cs} />
					<span>{row.name ?? '—'}</span>
				</div>
			{:else if key === 'role'}
				{@const roles = (row.roles as string[]) ?? []}
				<StatusBadge status={roles.includes('role_admin') ? 'admin' : 'user'} colorSchema={cs} />
			{:else if key === 'status'}
				<StatusBadge status={row.isActive ? 'active' : 'inactive'} colorSchema={cs} />
			{:else if key === 'createdAt'}
				{new Date(row.createdAt as string).toLocaleDateString()}
			{:else if key === 'actions'}
				{@const roles = (row.roles as string[]) ?? []}
				{@const isRowAdmin = roles.includes('role_admin')}
				<div class="flex items-center gap-2">
					<button
						onclick={(e) => { e.stopPropagation(); toggleRoleUser = row; }}
						class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition-colors {isRowAdmin ? 'text-purple-400 hover:text-purple-300' : cs === 'dark' ? 'text-neutral-400 hover:text-neutral-200' : 'text-gray-500 hover:text-gray-800'}"
						title={isRowAdmin ? 'Remove admin' : 'Make admin'}
					>
						{#if isRowAdmin}<ShieldOff size={12} />{:else}<Shield size={12} />{/if}
						{isRowAdmin ? 'Revoke' : 'Admin'}
					</button>
					<button
						onclick={(e) => { e.stopPropagation(); resetPasswordUserId = row.id as string; }}
						class="text-[10px] font-semibold uppercase tracking-wider transition-colors {cs === 'dark' ? 'text-neutral-400 hover:text-neutral-200' : 'text-gray-500 hover:text-gray-800'}"
					>
						Reset
					</button>
					<button
						onclick={(e) => { e.stopPropagation(); deleteUserId = row.id as string; }}
						class="text-[10px] font-semibold uppercase tracking-wider text-red-400 transition-colors hover:text-red-300"
					>
						Delete
					</button>
				</div>
			{:else}
				{row[key] ?? '—'}
			{/if}
		{/snippet}
	</DataTable>

	{#if pagination}
		<div class="flex justify-center">
			<Pagination
				page={pagination.page}
				totalPages={pagination.totalPages}
				colorSchema={cs}
				onpagechange={(p) => page = p}
			/>
		</div>
	{/if}
</div>

<!-- Create User Modal -->
<FormModal
	open={createModal}
	title="New User"
	loading={createLoading}
	colorSchema={cs}
	onsubmit={handleCreateUser}
	oncancel={() => { createModal = false; newEmail = ''; newName = ''; newPassword = ''; }}
>
	<div class="space-y-3">
		<div>
			<label class={labelClass}>Email *</label>
			<Input bind:value={newEmail} type="email" placeholder="user@example.com" required colorSchema={cs} />
		</div>
		<div>
			<label class={labelClass}>Name</label>
			<Input bind:value={newName} placeholder="John Doe" colorSchema={cs} />
		</div>
		<div>
			<label class={labelClass}>Password *</label>
			<Input bind:value={newPassword} type="password" placeholder="Min 8 characters" required minlength={8} colorSchema={cs} />
		</div>
	</div>
</FormModal>

<!-- Confirm Modals -->
<ConfirmModal
	open={deleteUserId !== null}
	title="Delete User"
	message={t?.('admin.users.confirmDelete') ?? 'Are you sure? This action cannot be undone.'}
	loading={actionLoading}
	colorSchema={cs}
	onconfirm={handleDelete}
	oncancel={() => deleteUserId = null}
/>

<ConfirmModal
	open={resetPasswordUserId !== null}
	title="Reset Password"
	message={t?.('admin.users.confirmResetPassword') ?? 'A new random password will be generated.'}
	loading={actionLoading}
	colorSchema={cs}
	onconfirm={handleResetPassword}
	oncancel={() => resetPasswordUserId = null}
/>

<ConfirmModal
	open={toggleRoleUser !== null}
	title="Change Role"
	message={toggleRoleUser ? ((toggleRoleUser.roles as string[])?.includes('role_admin') ? 'Remove admin privileges from this user?' : 'Grant admin privileges to this user?') : ''}
	loading={actionLoading}
	colorSchema={cs}
	onconfirm={handleToggleRole}
	oncancel={() => toggleRoleUser = null}
/>

<ConfirmModal
	open={bulkDeleteConfirm}
	title="Delete Selected Users"
	message={`Are you sure you want to delete ${selectedIds.size} user(s)? This cannot be undone.`}
	loading={bulkLoading}
	colorSchema={cs}
	onconfirm={handleBulkDelete}
	oncancel={() => bulkDeleteConfirm = false}
/>
