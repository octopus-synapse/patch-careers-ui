<!--
  Admin collaboration overview — paginated /v1/admin/collaborations list with
  a per-row revoke action.
-->
<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  getV1AdminCollaborationsQueryKey,
  createDeleteV1AdminCollaborationsResumeIdUserId,
  createGetV1AdminCollaborations,
} from 'api-client';
import { Shield, Trash2 } from 'lucide-svelte';
import { handleApiError } from '$lib/components/errors/error-renderer.svelte';
import { Avatar, Button, Loader, toastState } from 'ui';
import { browser } from '$app/environment';

const queryClient = useQueryClient();

const collaborationsQuery = createGetV1AdminCollaborations(undefined, {
  query: { enabled: browser },
});

const revokeMutation = createDeleteV1AdminCollaborationsResumeIdUserId({
  mutation: {
    onSuccess(data) {
      toastState.show(data.message, 'success');
      queryClient.invalidateQueries({ queryKey: getV1AdminCollaborationsQueryKey() });
    },
    onError: handleApiError,
  },
});

function revoke(resumeId: string, userId: string, label: string) {
  if (!confirm(`Remover ${label} como colaborador?`)) return;
  $revokeMutation.mutate({ resumeId, userId });
}
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

  {#if $collaborationsQuery.isLoading}
    <div class="flex justify-center py-12">
      <Loader size={20} />
    </div>
  {:else if !$collaborationsQuery.data || $collaborationsQuery.data.items.length === 0}
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
          {#each $collaborationsQuery.data.items as r (r.id)}
            {@const revoking = $revokeMutation.isPending && $revokeMutation.variables?.resumeId === r.resumeId && $revokeMutation.variables?.userId === r.userId}
            <tr class="border-t border-gray-200 dark:border-neutral-800">
              <td class="px-4 py-2">
                <div class="flex items-center gap-2">
                  <Avatar name={r.user.name ?? r.user.email} photoURL={null} size="sm" />
                  <div>
                    <p class="font-medium text-gray-900 dark:text-neutral-100">
                      {r.user.name ?? r.user.email}
                    </p>
                    <span class="text-xs text-gray-500 dark:text-neutral-500">{r.user.email}</span>
                  </div>
                </div>
              </td>
              <td class="px-4 py-2">
                <p class="text-gray-800 dark:text-neutral-200">{r.resume.title ?? 'Sem título'}</p>
                <p class="text-xs text-gray-500 dark:text-neutral-500">id: {r.resume.id}</p>
              </td>
              <td class="px-4 py-2">
                <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-neutral-800">
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
                  onclick={() => revoke(r.resumeId, r.userId, r.user.name ?? r.user.email)}
                  disabled={revoking}
                  aria-label="Revogar acesso"
                >
                  {#if revoking}
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
