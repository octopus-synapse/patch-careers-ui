<script lang="ts">
	import {
		createUsersListUsers,
		getUsersListUsersQueryKey,
		usersCreateUser,
		usersDeleteUser,
		usersResetPassword,
		usersAssignRoles,
	} from 'api-client';
	import type { UserManagementListDataDtoUsersItem } from 'api-client';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { locale } from '$lib/locale.svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { Avatar, Button, Input, Label, Dropdown, ConfirmModal, FormModal } from 'ui';
	import { Plus, Shield, ShieldOff, MoreVertical, KeyRound, Trash2 } from 'lucide-svelte';
	import DataTable from '$lib/components/admin/data-table.svelte';
	import SearchFilterBar from '$lib/components/admin/search-filter-bar.svelte';
	import Pagination from '$lib/components/admin/pagination.svelte';
	import StatusBadge from '$lib/components/admin/status-badge.svelte';
	import ExportButton from '$lib/components/admin/export-button.svelte';

	const t = $derived(locale.t);
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

	const users = $derived(usersQuery.data?.users);
	const pagination = $derived(usersQuery.data?.pagination);

	// --- Dropdown state ---
	let openDropdownId = $state<string | null>(null);

	// --- Actions state ---
	let deleteUserId = $state<string | null>(null);
	let resetPasswordUserId = $state<string | null>(null);
	let toggleRoleUser = $state<UserManagementListDataDtoUsersItem | null>(null);
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

	const allSelected = $derived(!!users?.length && users.every(u => selectedIds.has(u.id)));

	function toggleSelectAll() {
		if (allSelected) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set((users ?? []).map(u => u.id));
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
		const isAdmin = toggleRoleUser.role === 'ADMIN';
		const newRoles = isAdmin ? ['role_user'] : ['role_user', 'role_admin'];
		try {
			await usersAssignRoles(toggleRoleUser.id, {
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

	const columns = $derived([
		{ key: 'checkbox', label: '', width: '40px' },
		{ key: 'name', label: t('admin.users.name') },
		{ key: 'email', label: t('admin.users.email') },
		{ key: 'role', label: t('admin.users.role'), width: '100px' },
		{ key: 'status', label: t('admin.users.status'), width: '100px' },
		{ key: 'createdAt', label: t('admin.users.created'), width: '120px' },
		{ key: 'actions', label: '', width: '60px' },
	]);

	const filters = $derived([
		{
			key: 'role',
			label: t('admin.users.filterRole'),
			options: [
				{ value: 'role_admin', label: 'Admin' },
				{ value: 'role_user', label: 'User' },
			],
			value: roleFilter,
		},
	]);
</script>

<svelte:head>
	<title>{t('admin.users.title')}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
			{t('admin.users.title')}
		</h1>
		<div class="flex items-center gap-2">
			<ExportButton data={users} filename="users.csv" />
			<Button variant="solid" size="sm" onclick={() => createModal = true}>
				<Plus size={14} />
				New User
			</Button>
		</div>
	</div>

	<SearchFilterBar
		{search}
		{filters}
		placeholder={t('admin.users.search')}
		onsearch={(v) => { search = v; page = 1; }}
		onfilterchange={(key, value) => { if (key === 'role') roleFilter = value; page = 1; }}
	/>

	{#if selectedIds.size > 0}
		<div class="flex items-center gap-3 rounded-lg border px-4 py-2 border-gray-200 bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800/50">
			<span class="text-xs font-medium text-gray-800 dark:text-neutral-200">{selectedIds.size} selected</span>
			<Button variant="danger" size="xs" onclick={() => bulkDeleteConfirm = true}>
				Delete Selected
			</Button>
			<Button variant="ghost" size="xs" onclick={() => selectedIds = new Set()}>
				Clear
			</Button>
		</div>
	{/if}

	<DataTable
		{columns}
		data={users}
		loading={usersQuery.isLoading}
		emptyMessage={t('admin.users.noUsers')}
		onrowclick={(row) => goto(`/admin/users/${row.id}`)}
	>
		{#snippet cell({ row, key, value })}
			{#if key === 'checkbox'}
				<input
					type="checkbox"
					checked={selectedIds.has(row.id)}
					onclick={(e) => { e.stopPropagation(); toggleSelect(row.id); }}
					class="rounded"
				/>
			{:else if key === 'name'}
				<div class="flex items-center gap-2">
					<Avatar name={row.name ?? row.email ?? '—'} size="sm" />
					<span>{row.name ?? '—'}</span>
				</div>
			{:else if key === 'role'}
				<StatusBadge status={row.role === 'ADMIN' ? 'admin' : 'user'} />
			{:else if key === 'status'}
				<StatusBadge status={row.isActive ? 'active' : 'inactive'} />
			{:else if key === 'createdAt'}
				{new Date(row.createdAt).toLocaleDateString()}
			{:else if key === 'actions'}
				{@const isRowAdmin = row.role === 'ADMIN'}
				{@const rowId = row.id}
				<Dropdown
					open={openDropdownId === rowId}
					onclose={() => openDropdownId = null}
				>
					{#snippet trigger()}
						<Button variant="icon" size="xs" onclick={(e) => { e.stopPropagation(); openDropdownId = openDropdownId === rowId ? null : rowId; }}>
							<MoreVertical size={16} />
						</Button>
					{/snippet}
					<Button variant="menu" size="sm" onclick={(e) => { e.stopPropagation(); openDropdownId = null; toggleRoleUser = row; }}>
						{#if isRowAdmin}<ShieldOff size={14} class="text-purple-400" />{:else}<Shield size={14} />{/if}
						{isRowAdmin ? 'Revoke Admin' : 'Make Admin'}
					</Button>
					<Button variant="menu" size="sm" onclick={(e) => { e.stopPropagation(); openDropdownId = null; resetPasswordUserId = rowId; }}>
						<KeyRound size={14} /> Reset Password
					</Button>
					<Button variant="menu" size="sm" onclick={(e) => { e.stopPropagation(); openDropdownId = null; deleteUserId = rowId; }} class="!text-red-400">
						<Trash2 size={14} /> Delete
					</Button>
				</Dropdown>
			{:else}
				{value ?? '—'}
			{/if}
		{/snippet}
	</DataTable>

	{#if pagination}
		<div class="flex justify-center">
			<Pagination
				page={pagination.page}
				totalPages={pagination.totalPages}
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
	onSubmit={handleCreateUser}
	onClose={() => { createModal = false; newEmail = ''; newName = ''; newPassword = ''; }}
>
	<div class="space-y-3">
		<div>
			<Label>Email *</Label>
			<Input bind:value={newEmail} type="email" placeholder="user@example.com" required />
		</div>
		<div>
			<Label>Name</Label>
			<Input bind:value={newName} placeholder="John Doe" />
		</div>
		<div>
			<Label>Password *</Label>
			<Input bind:value={newPassword} type="password" placeholder="Min 8 characters" required minlength={8} />
		</div>
	</div>
</FormModal>

<!-- Confirm Modals -->
<ConfirmModal
	open={deleteUserId !== null}
	title="Delete User"
	message={t('admin.users.confirmDelete')}
	loading={actionLoading}
	onConfirm={handleDelete}
	onClose={() => deleteUserId = null}
/>

<ConfirmModal
	open={resetPasswordUserId !== null}
	title="Reset Password"
	message={t('admin.users.confirmResetPassword')}
	loading={actionLoading}
	onConfirm={handleResetPassword}
	onClose={() => resetPasswordUserId = null}
/>

<ConfirmModal
	open={toggleRoleUser !== null}
	title="Change Role"
	message={toggleRoleUser ? (toggleRoleUser.role === 'ADMIN' ? 'Remove admin privileges from this user?' : 'Grant admin privileges to this user?') : ''}
	loading={actionLoading}
	onConfirm={handleToggleRole}
	onClose={() => toggleRoleUser = null}
/>

<ConfirmModal
	open={bulkDeleteConfirm}
	title="Delete Selected Users"
	message={`Are you sure you want to delete ${selectedIds.size} user(s)? This cannot be undone.`}
	loading={bulkLoading}
	onConfirm={handleBulkDelete}
	onClose={() => bulkDeleteConfirm = false}
/>
