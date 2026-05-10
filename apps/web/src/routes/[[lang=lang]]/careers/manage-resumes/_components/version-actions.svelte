<!--
  VersionActions — rename + delete controls for a resume version card.
-->
<script lang="ts">
import { createDeleteV1ResumesResumeId, createPatchV1ResumesResumeId } from 'api-client';
import { Check, Pencil, Trash2, X } from 'lucide-svelte';
import { handleApiError } from '$lib/components/errors/error-renderer.svelte';
import { untrack } from 'svelte';
import { Button, Input, Loader, toastState } from 'ui';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

interface Props {
  resumeId: string;
  title: string | null;
  onRenamed?: (title: string) => void;
  onDeleted?: () => void;
  /** Hide the delete button for the master resume. */
  canDelete?: boolean;
}

let { resumeId, title, onRenamed, onDeleted, canDelete = true }: Props = $props();

let editing = $state(false);
// Re-seed titleDraft whenever the parent provides a new title (e.g. after a
// successful rename elsewhere). `untrack` at init makes the seed explicit and
// silences Svelte's state_referenced_locally warning; the $effect below is
// what actually keeps the draft aligned with the prop while not editing.
let titleDraft = $state(untrack(() => title ?? ''));
$effect(() => {
  if (!editing) titleDraft = title ?? '';
});

const renameMutation = createPatchV1ResumesResumeId({ mutation: { onError: handleApiError } });
const deleteMutation = createDeleteV1ResumesResumeId({ mutation: { onError: handleApiError } });

function startEdit() {
  titleDraft = title ?? '';
  editing = true;
}

function cancelEdit() {
  editing = false;
  titleDraft = title ?? '';
}

function saveRename() {
  const trimmed = titleDraft.trim();
  if (!trimmed || trimmed === title) {
    editing = false;
    return;
  }
  $renameMutation.mutate(
    { resumeId, data: { title: trimmed } },
    {
      onSuccess: () => {
        onRenamed?.(trimmed);
        editing = false;
        toastState.show(t('success.versionRenamed'), 'success');
      },
    },
  );
}

function remove() {
  if (!confirm('Remover esta versão permanentemente?')) return;
  $deleteMutation.mutate(
    { resumeId },
    {
      onSuccess: () => {
        onDeleted?.();
        toastState.show(t('success.versionRemoved'), 'success');
      },
    },
  );
}
</script>

<div class="flex items-center gap-2">
  {#if editing}
    <Input
      bind:value={titleDraft}
      placeholder="Nome da versão"
      class="h-7 text-xs"
    />
    <Button variant="icon" size="xs" onclick={saveRename} disabled={$renameMutation.isPending} aria-label={t('actions.save')}>
      {#if $renameMutation.isPending}
        <Loader size={14} />
      {:else}
        <Check size={14} class="text-emerald-500" />
      {/if}
    </Button>
    <Button variant="icon" size="xs" onclick={cancelEdit} aria-label={t('actions.cancel')}>
      <X size={14} />
    </Button>
  {:else}
    <Button variant="icon" size="xs" onclick={startEdit} aria-label="Renomear">
      <Pencil size={14} class="text-gray-400" />
    </Button>
    {#if canDelete}
      <Button variant="icon" size="xs" onclick={remove} disabled={$deleteMutation.isPending} aria-label={t('actions.remove')}>
        {#if $deleteMutation.isPending}
          <Loader size={14} />
        {:else}
          <Trash2 size={14} class="text-red-500" />
        {/if}
      </Button>
    {/if}
  {/if}
</div>
