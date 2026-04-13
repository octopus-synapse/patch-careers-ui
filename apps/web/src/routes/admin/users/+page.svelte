<script lang="ts">
	import {
		createUsersListUsers,
		getUsersListUsersQueryKey,
		usersDeleteUser,
		usersResetPassword,
	} from 'api-client';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { colorSchema } from '$lib/color-schema.svelte';
	import { locale } from '$lib/locale.svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { Avatar } from 'ui';
	import DataTable from '$lib/components/admin/data-table.svelte';
	import SearchFilterBar from '$lib/components/admin/search-filter-bar.svelte';
	import Pagination from '$lib/components/admin/pagination.svelte';
	import StatusBadge from '$lib/components/admin/status-badge.svelte';
	import ConfirmModal from '$lib/components/admin/confirm-modal.svelte';

	const cs = $derived(colorSchema.mode);
	const t = $derived(locale.t);
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');
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

	let deleteUserId = $state<string | null>(null);
	let resetPasswordUserId = $state<string | null>(null);
	let actionLoading = $state(false);

	async function handleDelete() {
		if (!deleteUserId) return;
		actionLoading = true;
		try {
			await usersDeleteUser(deleteUserId);
			queryClient.invalidateQueries({ queryKey: getUsersListUsersQueryKey() });
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

	const columns = [
		{ key: 'name', label: t?.('admin.users.name') ?? 'Name' },
		{ key: 'email', label: t?.('admin.users.email') ?? 'Email' },
		{ key: 'role', label: t?.('admin.users.role') ?? 'Role', width: '100px' },
		{ key: 'status', label: t?.('admin.users.status') ?? 'Status', width: '100px' },
		{ key: 'createdAt', label: t?.('admin.users.created') ?? 'Created', width: '120px' },
		{ key: 'actions', label: '', width: '160px' },
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
	<h1 class="text-xl font-semibold tracking-tight {text}">
		{t?.('admin.users.title') ?? 'User Management'}
	</h1>

	<SearchFilterBar
		{search}
		{filters}
		placeholder={t?.('admin.users.search') ?? 'Search by name or email...'}
		colorSchema={cs}
		onsearch={(v) => { search = v; page = 1; }}
		onfilterchange={(key, value) => { if (key === 'role') roleFilter = value; page = 1; }}
	/>

	<DataTable
		{columns}
		data={users}
		loading={usersQuery.isLoading}
		emptyMessage={t?.('admin.users.noUsers') ?? 'No users found'}
		colorSchema={cs}
		onrowclick={(row) => goto(`/admin/users/${row.id}`)}
	>
		{#snippet cell({ row, key })}
			{#if key === 'name'}
				<div class="flex items-center gap-2">
					<Avatar name={row.name as string ?? row.email as string} size="sm" colorSchema={cs} />
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
				<div class="flex items-center gap-2">
					<button
						onclick={(e) => { e.stopPropagation(); resetPasswordUserId = row.id as string; }}
						class="text-[10px] font-semibold uppercase tracking-wider transition-colors {cs === 'dark' ? 'text-neutral-400 hover:text-neutral-200' : 'text-gray-500 hover:text-gray-800'}"
					>
						{t?.('admin.users.resetPassword') ?? 'Reset'}
					</button>
					<button
						onclick={(e) => { e.stopPropagation(); deleteUserId = row.id as string; }}
						class="text-[10px] font-semibold uppercase tracking-wider text-red-400 transition-colors hover:text-red-300"
					>
						{t?.('admin.users.deleteUser') ?? 'Delete'}
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

<ConfirmModal
	open={deleteUserId !== null}
	title={t?.('admin.users.deleteUser') ?? 'Delete User'}
	message={t?.('admin.users.confirmDelete') ?? 'Are you sure?'}
	loading={actionLoading}
	colorSchema={cs}
	onconfirm={handleDelete}
	oncancel={() => deleteUserId = null}
/>

<ConfirmModal
	open={resetPasswordUserId !== null}
	title={t?.('admin.users.resetPassword') ?? 'Reset Password'}
	message={t?.('admin.users.confirmResetPassword') ?? 'Are you sure?'}
	loading={actionLoading}
	colorSchema={cs}
	onconfirm={handleResetPassword}
	oncancel={() => resetPasswordUserId = null}
/>
