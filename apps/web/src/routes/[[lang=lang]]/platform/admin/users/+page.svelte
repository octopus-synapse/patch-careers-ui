<script lang="ts">
  /**
   * Admin users — burra: lista usuários (search/filter/pagination) + delete.
   * Backend retorna `void` no schema OpenAPI; cast local da resposta.
   */
  import { useQueryClient } from '@tanstack/svelte-query';
  import {
    createUsersManageGet,
    getUsersManageGetQueryKey,
    usersManageDelete,
  } from 'api-client';
  import { Trash2 } from 'lucide-svelte';
  import { Button, Loader, toastState } from 'ui';
  import { browser } from '$app/environment';
  import { locale } from '$lib/state/locale.svelte';

  type UserRow = {
    id: string;
    email?: string;
    name?: string;
    role?: string;
    status?: string;
    resumesCount?: number;
    createdAt?: string;
    lastLoginAt?: string | null;
  };

  type Page = { items?: UserRow[]; users?: UserRow[]; total?: number; totalPages?: number };

  const t = $derived(locale.t);
  const queryClient = useQueryClient();

  let page = $state(1);
  let limit = $state(20);
  let search = $state('');
  let roleName = $state('');

  const listQuery = createUsersManageGet(
    () => ({
      page,
      limit,
      search: search || undefined,
      roleName: roleName || undefined,
    }),
    () => ({ query: { enabled: browser } }),
  );

  const data = $derived(listQuery.data as unknown as Page | undefined);
  const users = $derived(data?.items ?? data?.users ?? []);
  const totalPages = $derived(data?.totalPages ?? 1);

  let deleting = $state<string | null>(null);
  async function handleDelete(id: string) {
    if (!confirm(t('admin.users.confirmDelete'))) return;
    deleting = id;
    try {
      await usersManageDelete(id);
      toastState.show(t('admin.users.toastDeleted'), 'success');
      await queryClient.invalidateQueries({ queryKey: getUsersManageGetQueryKey() });
    } catch {
      toastState.show('Falha ao excluir', 'danger');
    } finally {
      deleting = null;
    }
  }
</script>

<svelte:head>
  <title>{t('admin.users.title')}</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
    {t('admin.users.title')}
  </h1>

  <div class="flex flex-wrap gap-3">
    <input
      type="search"
      placeholder={t('admin.users.search')}
      bind:value={search}
      class="rounded-md border border-border bg-background px-3 py-1.5 text-sm w-72"
    />
    <select
      bind:value={roleName}
      class="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
    >
      <option value="">{t('admin.users.filterRole')}</option>
      <option value="USER">USER</option>
      <option value="RECRUITER">RECRUITER</option>
      <option value="ADMIN">ADMIN</option>
    </select>
  </div>

  {#if listQuery.isLoading}
    <div class="flex items-center justify-center py-12"><Loader size={20} /></div>
  {:else}
    <div class="rounded-xl border border-border">
      <table class="w-full text-sm">
        <thead class="bg-muted/40">
          <tr class="text-left text-xs text-gray-500 dark:text-neutral-500">
            <th class="px-3 py-2">{t('admin.users.email')}</th>
            <th class="px-3 py-2">{t('admin.users.name')}</th>
            <th class="px-3 py-2">{t('admin.users.role')}</th>
            <th class="px-3 py-2">{t('admin.users.status')}</th>
            <th class="px-3 py-2">{t('admin.users.created')}</th>
            <th class="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {#each users as u}
            <tr class="border-t border-border">
              <td class="px-3 py-2 text-xs">{u.email ?? '—'}</td>
              <td class="px-3 py-2">{u.name ?? '—'}</td>
              <td class="px-3 py-2 text-xs">{u.role ?? '—'}</td>
              <td class="px-3 py-2 text-xs">{u.status ?? '—'}</td>
              <td class="px-3 py-2 text-xs">{u.createdAt ?? '—'}</td>
              <td class="px-3 py-2 text-right">
                <Button
                  size="sm"
                  variant="ghost"
                  onclick={() => handleDelete(u.id)}
                  disabled={deleting === u.id}
                >
                  <Trash2 class="size-3" />
                </Button>
              </td>
            </tr>
          {:else}
            <tr><td colspan="6" class="px-3 py-6 text-center text-xs text-gray-500 dark:text-neutral-500">{t('admin.users.noUsers')}</td></tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="flex justify-end gap-2">
      <Button size="sm" variant="outline" onclick={() => (page = Math.max(1, page - 1))} disabled={page <= 1}>←</Button>
      <span class="text-xs text-gray-500 dark:text-neutral-500 self-center">{page} / {totalPages}</span>
      <Button size="sm" variant="outline" onclick={() => (page = page + 1)} disabled={page >= totalPages}>→</Button>
    </div>
  {/if}
</div>
