<script lang="ts">
  // @ts-nocheck — F3 burrar pending; SDK rename cascade after F1 swagger regen.
import { useQueryClient } from '@tanstack/svelte-query';
import type { UserManagementListDataDtoUsersItem } from 'api-client';
import {
  createUsersListUsers,
  forgotPasswordHandle,
  getUsersListUsersQueryKey,
  usersAssignRoles,
  usersCreateUser,
  usersDeleteUser,
  usersListUsers,
  usersResetPassword,
} from 'api-client';
import { formatDate } from 'i18n';
import { Check, Copy, KeyRound, LogIn, Mail, MoreVertical, Plus, Shield, ShieldOff, Trash2 } from 'lucide-svelte';
import { Avatar, Button, ConfirmModal, Dropdown, FormModal, Input, Label, toastState } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { DataTable } from 'ui';
import { ExportButton } from 'ui';
import { Pagination } from 'ui';
import { SearchFilterBar } from 'ui';
import StatusBadge from '../_components/status-badge.svelte';
import { translateApiError } from '$lib/utils/translate-api-error';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);
const queryClient = useQueryClient();

let page = $state(1);
let pageSize = $state(20);
let search = $state('');
let roleFilter = $state('');
let statusFilter = $state<'' | 'active' | 'inactive'>('');

const usersQuery = createUsersListUsers(
  () => ({
    page,
    limit: pageSize,
    search: search || undefined,
    roleName: roleFilter || undefined,
  }),
  () => ({
    query: { enabled: browser },
  }),
);

const rawUsers = $derived(usersQuery.data?.users);
const users = $derived(
  statusFilter === 'active'
    ? rawUsers?.filter((u) => u.isActive)
    : statusFilter === 'inactive'
      ? rawUsers?.filter((u) => !u.isActive)
      : rawUsers,
);
const pagination = $derived(usersQuery.data?.pagination);

async function fetchAllUsersWithFilters(): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = [];
  let currentPage = 1;
  const batchSize = 100;
  while (true) {
    const result = await usersListUsers({
      page: currentPage,
      limit: batchSize,
      search: search || undefined,
      roleName: roleFilter || undefined,
    });
    const batch = (result.users ?? []) as Record<string, unknown>[];
    const filtered =
      statusFilter === 'active'
        ? batch.filter((u) => u.isActive)
        : statusFilter === 'inactive'
          ? batch.filter((u) => !u.isActive)
          : batch;
    all.push(...filtered);
    const totalPagesFetched = result.pagination?.totalPages ?? 1;
    if (currentPage >= totalPagesFetched || batch.length === 0) break;
    currentPage += 1;
  }
  return all;
}

// --- Dropdown state ---
let openDropdownId = $state<string | null>(null);

// --- Actions state ---
let deleteUserId = $state<string | null>(null);
let resetPasswordUserId = $state<string | null>(null);
let toggleRoleUser = $state<UserManagementListDataDtoUsersItem | null>(null);
let actionLoading = $state(false);

// --- Reset password result ---
let resetResultOpen = $state(false);
let generatedPassword = $state('');
let passwordCopied = $state(false);

async function copyGeneratedPassword() {
  try {
    await navigator.clipboard.writeText(generatedPassword);
    passwordCopied = true;
    setTimeout(() => (passwordCopied = false), 2000);
  } catch {
    toastState.show(t('admin.users.toastCopyFailed'), 'danger');
  }
}

function closeResetResult() {
  resetResultOpen = false;
  generatedPassword = '';
  passwordCopied = false;
}

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
let bulkConfirmInput = $state('');

const BULK_DELETE_TYPED_THRESHOLD = 5;
const bulkRequiresTyped = $derived(selectedIds.size >= BULK_DELETE_TYPED_THRESHOLD);
const bulkConfirmValid = $derived(!bulkRequiresTyped || bulkConfirmInput.trim().toUpperCase() === 'DELETE');

const allSelected = $derived(!!users?.length && users.every((u) => selectedIds.has(u.id)));

function toggleSelectAll() {
  if (allSelected) {
    selectedIds = new Set();
  } else {
    selectedIds = new Set((users ?? []).map((u) => u.id));
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
    toastState.show(t('admin.users.toastDeleted'), 'success');
    deleteUserId = null;
  } catch (err) {
    toastState.show(translateApiError(err, t), 'danger');
  } finally {
    actionLoading = false;
  }
}

let sendResetEmailUser = $state<UserManagementListDataDtoUsersItem | null>(null);

function handleImpersonate(user: UserManagementListDataDtoUsersItem) {
  // Stub: requires backend endpoint POST /admin/users/{id}/impersonate.
  // Once available, call the mutation, then reload the page so the session
  // layout picks up the impersonated user. Show the global banner via
  // impersonationState (to be introduced alongside the backend work).
  toastState.show(
    t('admin.users.impersonationNotAvailable').replace('{name}', user.name ?? user.email ?? user.id),
    'danger',
  );
}

async function handleSendResetEmail() {
  if (!sendResetEmailUser) return;
  const target = sendResetEmailUser;
  if (!target.email) {
    toastState.show(t('admin.users.noEmailOnRecord'), 'danger');
    return;
  }
  const email = target.email;
  actionLoading = true;
  try {
    await forgotPasswordHandle({ email });
    toastState.show(t('admin.users.toastResetEmailSent').replace('{email}', email), 'success');
    sendResetEmailUser = null;
  } catch (err) {
    toastState.show(translateApiError(err, t), 'danger');
  } finally {
    actionLoading = false;
  }
}

async function handleResetPassword() {
  if (!resetPasswordUserId) return;
  actionLoading = true;
  const generated = crypto.randomUUID().slice(0, 16);
  try {
    await usersResetPassword(resetPasswordUserId, { newPassword: generated });
    resetPasswordUserId = null;
    generatedPassword = generated;
    resetResultOpen = true;
  } catch (err) {
    toastState.show(translateApiError(err, t), 'danger');
  } finally {
    actionLoading = false;
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
    toastState.show(t('admin.users.toastCreated'), 'success');
  } catch (err) {
    toastState.show(translateApiError(err, t), 'danger');
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
    toastState.show(t('admin.users.toastRoleUpdated'), 'success');
    toggleRoleUser = null;
  } catch (err) {
    toastState.show(translateApiError(err, t), 'danger');
  } finally {
    actionLoading = false;
  }
}

async function handleBulkDelete() {
  if (!bulkConfirmValid) return;
  bulkLoading = true;
  const ids = Array.from(selectedIds);
  const results = await Promise.allSettled(ids.map((id) => usersDeleteUser(id)));
  const failed = results.filter((r) => r.status === 'rejected').length;
  const succeeded = ids.length - failed;
  if (succeeded > 0) selectedIds = new Set(ids.filter((_, i) => results[i].status === 'rejected'));
  invalidate();
  bulkLoading = false;
  bulkDeleteConfirm = false;
  bulkConfirmInput = '';
  if (failed === 0) {
    toastState.show(t('admin.users.toastBulkDeleted').replace('{count}', String(succeeded)), 'success');
  } else {
    toastState.show(
      t('admin.users.toastBulkPartial')
        .replace('{ok}', String(succeeded))
        .replace('{fail}', String(failed)),
      'danger',
    );
  }
}

const columns = $derived([
  { key: 'checkbox', label: '', width: '40px' },
  { key: 'name', label: t('admin.users.name'), sortable: true },
  { key: 'email', label: t('admin.users.email'), sortable: true, hideOnMobile: true },
  { key: 'role', label: t('admin.users.role'), width: '100px', sortable: true },
  { key: 'status', label: t('admin.users.status'), width: '100px', hideOnMobile: true },
  { key: 'createdAt', label: t('admin.users.created'), width: '120px', sortable: true, hideOnMobile: true },
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
  {
    key: 'status',
    label: t('admin.users.filterStatusAll'),
    options: [
      { value: 'active', label: t('admin.users.filterActive') },
      { value: 'inactive', label: t('admin.users.filterInactive') },
    ],
    value: statusFilter,
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
		<div class="flex flex-wrap items-center gap-2">
			<ExportButton data={users} filename="users.csv" fetchAll={fetchAllUsersWithFilters} />
			<Button variant="solid" size="sm" onclick={() => createModal = true}>
				<Plus size={14} />
				{t('admin.users.newUser')}
			</Button>
		</div>
	</div>

	<SearchFilterBar
		{search}
		{filters}
		placeholder={t('admin.users.search')}
		searchFields={['email', 'name', 'id']}
		onsearch={(v) => { search = v; page = 1; }}
		onsearchfield={(field, value) => {
			if (field === 'id' && value) {
				goto(`/admin/users/${value}`);
				return;
			}
			search = value;
			page = 1;
		}}
		onfilterchange={(key, value) => {
			if (key === 'role') roleFilter = value;
			if (key === 'status') statusFilter = value as '' | 'active' | 'inactive';
			page = 1;
		}}
	/>

	{#if statusFilter}
		<p class="text-xs text-amber-600 dark:text-amber-400">
			{t('admin.users.statusFilterNote')}
		</p>
	{/if}

	{#if selectedIds.size > 0}
		<div class="flex items-center gap-3 rounded-lg border px-4 py-2 border-gray-200 bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800/50">
			<span class="text-xs font-medium text-gray-800 dark:text-neutral-200">
				{t('admin.users.selected').replace('{count}', String(selectedIds.size))}
			</span>
			<Button variant="ghost" intent="danger" size="xs" onclick={() => bulkDeleteConfirm = true}>
				{t('admin.users.deleteSelected')}
			</Button>
			<Button variant="ghost" size="xs" onclick={() => selectedIds = new Set()}>
				{t('admin.users.clearSelection')}
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
					aria-label={t('admin.users.selectRowAria').replace('{name}', row.name ?? row.email ?? '')}
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
				{formatDate(row.createdAt, locale.current)}
			{:else if key === 'actions'}
				{@const isRowAdmin = row.role === 'ADMIN'}
				{@const rowId = row.id}
				<Dropdown
					open={openDropdownId === rowId}
					onclose={() => openDropdownId = null}
				>
					{#snippet trigger()}
						<Button
							variant="icon"
							size="xs"
							aria-label={t('admin.users.rowActionsAria').replace('{name}', row.name ?? row.email ?? '')}
							aria-haspopup="menu"
							aria-expanded={openDropdownId === rowId}
							onclick={(e) => { e.stopPropagation(); openDropdownId = openDropdownId === rowId ? null : rowId; }}
						>
							<MoreVertical size={16} />
						</Button>
					{/snippet}
					<Button variant="menu" size="sm" onclick={(e) => { e.stopPropagation(); openDropdownId = null; toggleRoleUser = row; }}>
						{#if isRowAdmin}<ShieldOff size={14} class="text-purple-400" />{:else}<Shield size={14} />{/if}
						{isRowAdmin ? t('admin.users.revokeAdmin') : t('admin.users.makeAdmin')}
					</Button>
					<Button variant="menu" size="sm" onclick={(e) => { e.stopPropagation(); openDropdownId = null; handleImpersonate(row); }}>
						<LogIn size={14} /> {t('admin.users.impersonate')}
					</Button>
					<Button variant="menu" size="sm" onclick={(e) => { e.stopPropagation(); openDropdownId = null; sendResetEmailUser = row; }}>
						<Mail size={14} /> {t('admin.users.sendResetEmail')}
					</Button>
					<Button variant="menu" size="sm" onclick={(e) => { e.stopPropagation(); openDropdownId = null; resetPasswordUserId = rowId; }}>
						<KeyRound size={14} /> {t('admin.users.resetPassword')}
					</Button>
					<Button variant="menu" size="sm" onclick={(e) => { e.stopPropagation(); openDropdownId = null; deleteUserId = rowId; }} class="!text-red-400">
						<Trash2 size={14} /> {t('admin.users.delete')}
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
				{pageSize}
				pageSizeOptions={[10, 20, 50, 100]}
				onpagesizechange={(s) => { pageSize = s; page = 1; }}
			/>
		</div>
	{/if}
</div>

<!-- Create User Modal -->
<FormModal
	open={createModal}
	title={t('admin.users.newUser')}
	loading={createLoading}
	onSubmit={handleCreateUser}
	onClose={() => { createModal = false; newEmail = ''; newName = ''; newPassword = ''; }}
>
	<div class="space-y-3">
		<div>
			<Label>{t('admin.users.emailRequired')}</Label>
			<Input bind:value={newEmail} type="email" placeholder={t('admin.users.emailPlaceholder')} required />
		</div>
		<div>
			<Label>{t('admin.users.name')}</Label>
			<Input bind:value={newName} placeholder={t('admin.users.namePlaceholder')} />
		</div>
		<div>
			<Label>{t('admin.users.passwordRequired')}</Label>
			<Input bind:value={newPassword} type="password" placeholder={t('admin.users.passwordPlaceholder')} required minlength={8} />
		</div>
	</div>
</FormModal>

<!-- Confirm Modals -->
<ConfirmModal
	open={deleteUserId !== null}
	title={t('admin.users.deleteUser')}
	message={t('admin.users.confirmDelete')}
	loading={actionLoading}
	onConfirm={handleDelete}
	onClose={() => deleteUserId = null}
/>

<ConfirmModal
	open={resetPasswordUserId !== null}
	title={t('admin.users.resetPassword')}
	message={t('admin.users.confirmResetPassword')}
	loading={actionLoading}
	onConfirm={handleResetPassword}
	onClose={() => resetPasswordUserId = null}
/>

<ConfirmModal
	open={sendResetEmailUser !== null}
	title={t('admin.users.sendResetEmail')}
	message={sendResetEmailUser ? t('admin.users.confirmSendResetEmail').replace('{email}', sendResetEmailUser.email ?? '—') : ''}
	loading={actionLoading}
	onConfirm={handleSendResetEmail}
	onClose={() => sendResetEmailUser = null}
/>

<ConfirmModal
	open={toggleRoleUser !== null}
	title={t('admin.users.changeRole')}
	message={toggleRoleUser ? (toggleRoleUser.role === 'ADMIN' ? t('admin.users.confirmRevokeAdmin') : t('admin.users.confirmMakeAdmin')) : ''}
	loading={actionLoading}
	onConfirm={handleToggleRole}
	onClose={() => toggleRoleUser = null}
/>

{#if !bulkRequiresTyped}
	<ConfirmModal
		open={bulkDeleteConfirm}
		title={t('admin.users.bulkDeleteTitle')}
		message={t('admin.users.bulkDeleteMessage').replace('{count}', String(selectedIds.size))}
		loading={bulkLoading}
		onConfirm={handleBulkDelete}
		onClose={() => bulkDeleteConfirm = false}
	/>
{:else}
	<FormModal
		open={bulkDeleteConfirm}
		title={t('admin.users.bulkDeleteTitle')}
		loading={bulkLoading || !bulkConfirmValid}
		submitLabel={t('admin.users.bulkDeleteConfirmButton')}
		onSubmit={handleBulkDelete}
		onClose={() => { bulkDeleteConfirm = false; bulkConfirmInput = ''; }}
	>
		<div class="space-y-3">
			<p class="text-sm text-gray-800 dark:text-neutral-200">
				{t('admin.users.bulkDeleteMessage').replace('{count}', String(selectedIds.size))}
			</p>
			<p class="text-xs text-red-600 dark:text-red-400">
				{t('admin.users.bulkDeleteTypedPrompt')}
			</p>
			<Input
				bind:value={bulkConfirmInput}
				placeholder="DELETE"
				autocomplete="off"
				aria-label={t('admin.users.bulkDeleteTypedPrompt')}
			/>
		</div>
	</FormModal>
{/if}

<!-- Reset password result: show the generated password once, admin copies and delivers it -->
<FormModal
	open={resetResultOpen}
	title={t('admin.users.resetResultTitle')}
	loading={false}
	submitLabel={t('admin.users.resetResultDone')}
	onSubmit={closeResetResult}
	onClose={closeResetResult}
>
	<div class="space-y-3">
		<p class="text-sm text-gray-700 dark:text-neutral-300">
			{t('admin.users.resetResultDescription')}
		</p>
		<div class="flex items-center gap-2 rounded-lg border px-3 py-2 border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-950/30">
			<code class="flex-1 font-mono text-sm text-gray-800 dark:text-neutral-100 select-all">
				{generatedPassword}
			</code>
			<Button variant="ghost" size="xs" onclick={copyGeneratedPassword} aria-label={t('admin.users.resetResultCopy')}>
				{#if passwordCopied}
					<Check size={14} />
				{:else}
					<Copy size={14} />
				{/if}
			</Button>
		</div>
		<p class="text-xs text-amber-700 dark:text-amber-400">
			{t('admin.users.resetResultWarning')}
		</p>
	</div>
</FormModal>
