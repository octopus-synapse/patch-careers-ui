<!--
  Admin collaboration overview — shows all active ResumeCollaborator rows
  with filters by role + search. Admins can revoke any collaborator.
-->
<script lang="ts">
import { Shield, Trash2 } from 'lucide-svelte';
import { onMount } from 'svelte';
import { Avatar, Button, Input, Loader, Select, toastState } from 'ui';
import { browser } from '$app/environment';

interface CollabRow {
  id: string;
  role: 'VIEWER' | 'EDITOR' | 'ADMIN';
  invitedAt: string;
  joinedAt: string | null;
  resume: { id: string; title: string | null; userId: string; ownerUsername: string | null };
  user: {
    id: string;
    name: string | null;
    username: string | null;
    photoURL: string | null;
  };
}

let rows = $state<CollabRow[]>([]);
let loading = $state(true);
let search = $state('');
let roleFilter = $state<'ALL' | 'VIEWER' | 'EDITOR' | 'ADMIN'>('ALL');
let revoking = $state<string | null>(null);

async function load() {
  if (!browser) return;
  loading = true;
  try {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (roleFilter !== 'ALL') params.set('role', roleFilter);
    const res = await fetch(`/api/v1/admin/collaboration?${params}`, {
      credentials: 'include',
    });
    const body = (await res.json()) as { data?: { collaborators?: CollabRow[] } };
    rows = body.data?.collaborators ?? [];
  } catch {
    toastState.show('Falha ao carregar colaboradores.', 'danger');
  } finally {
    loading = false;
  }
}

async function revoke(row: CollabRow) {
  if (
    !confirm(
      `Remover ${row.user.name ?? row.user.username} como colaborador do currículo de @${row.resume.ownerUsername ?? ''}?`,
    )
  ) {
    return;
  }
  revoking = row.id;
  try {
    const res = await fetch(`/api/v1/admin/collaboration/${row.resume.id}/${row.user.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error();
    rows = rows.filter((r) => r.id !== row.id);
    toastState.show('Colaborador removido.', 'success');
  } catch {
    toastState.show('Falha ao remover.', 'danger');
  } finally {
    revoking = null;
  }
}

onMount(load);
</script>

<svelte:head>
  <title>Admin · Colaboração</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 pt-20 pb-12">
  <header class="mb-6 flex items-center gap-2">
    <Shield size={20} class="text-cyan-500" />
    <h1 class="text-xl font-semibold text-gray-900 dark:text-neutral-100">
      Colaboração (admin)
    </h1>
  </header>

  <form
    class="mb-4 flex flex-wrap gap-2"
    onsubmit={(e) => {
      e.preventDefault();
      load();
    }}
  >
    <Input
      bind:value={search}
      placeholder="Buscar por nome, username ou título do currículo"
      class="flex-1 min-w-[200px]"
    />
    <Select bind:value={roleFilter}>
      <option value="ALL">Todas as roles</option>
      <option value="VIEWER">Viewer</option>
      <option value="EDITOR">Editor</option>
      <option value="ADMIN">Admin</option>
    </Select>
    <Button type="submit" variant="outline">Filtrar</Button>
  </form>

  {#if loading}
    <div class="flex justify-center py-12">
      <Loader size={20} />
    </div>
  {:else if rows.length === 0}
    <p class="rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-neutral-800 dark:text-neutral-500">
      Nenhum colaborador ativo.
    </p>
  {:else}
    <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-neutral-800">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500 dark:bg-neutral-900 dark:text-neutral-400">
          <tr>
            <th class="px-4 py-2">Colaborador</th>
            <th class="px-4 py-2">Currículo</th>
            <th class="px-4 py-2">Role</th>
            <th class="px-4 py-2">Entrou em</th>
            <th class="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {#each rows as r (r.id)}
            <tr class="border-t border-gray-200 dark:border-neutral-800">
              <td class="px-4 py-2">
                <div class="flex items-center gap-2">
                  <Avatar
                    name={r.user.name ?? r.user.username ?? '?'}
                    photoURL={r.user.photoURL}
                    size="sm"
                  />
                  <div>
                    <p class="font-medium text-gray-900 dark:text-neutral-100">
                      {r.user.name ?? r.user.username}
                    </p>
                    {#if r.user.username}
                      <a
                        href="/my-profile/public/@{r.user.username}"
                        class="text-xs text-cyan-500 hover:underline"
                      >
                        @{r.user.username}
                      </a>
                    {/if}
                  </div>
                </div>
              </td>
              <td class="px-4 py-2">
                <p class="text-gray-800 dark:text-neutral-200">{r.resume.title ?? 'Sem título'}</p>
                <p class="text-xs text-gray-500 dark:text-neutral-500">
                  dono: @{r.resume.ownerUsername ?? '—'}
                </p>
              </td>
              <td class="px-4 py-2">
                <span
                  class="rounded-full px-2 py-0.5 text-xs"
                  class:bg-gray-100={r.role === 'VIEWER'}
                  class:bg-blue-100={r.role === 'EDITOR'}
                  class:bg-red-100={r.role === 'ADMIN'}
                  class:dark:bg-neutral-800={r.role === 'VIEWER'}
                  class:dark:bg-blue-900={r.role === 'EDITOR'}
                  class:dark:bg-red-900={r.role === 'ADMIN'}
                >
                  {r.role}
                </span>
              </td>
              <td class="px-4 py-2 text-xs text-gray-500 dark:text-neutral-500">
                {r.joinedAt
                  ? new Date(r.joinedAt).toLocaleDateString()
                  : `convidado ${new Date(r.invitedAt).toLocaleDateString()}`}
              </td>
              <td class="px-4 py-2 text-right">
                <Button
                  variant="icon"
                  size="xs"
                  onclick={() => revoke(r)}
                  disabled={revoking === r.id}
                  aria-label="Revogar acesso"
                >
                  {#if revoking === r.id}
                    <Loader size={14} />
                  {:else}
                    <Trash2 size={14} class="text-red-500" />
                  {/if}
                </Button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
