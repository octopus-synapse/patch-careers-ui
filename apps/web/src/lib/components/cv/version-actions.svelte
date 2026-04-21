<!--
  VersionActions — rename + delete controls for a resume version card.
-->
<script lang="ts">
import { Check, Loader2, Pencil, Trash2, X } from 'lucide-svelte';
import { Button, Input, toastState } from 'ui';
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
let titleDraft = $state(title ?? '');
let saving = $state(false);
let deleting = $state(false);

function startEdit() {
  titleDraft = title ?? '';
  editing = true;
}

function cancelEdit() {
  editing = false;
  titleDraft = title ?? '';
}

async function saveRename() {
  const trimmed = titleDraft.trim();
  if (!trimmed || trimmed === title) {
    editing = false;
    return;
  }
  saving = true;
  try {
    const res = await fetch(`/api/v1/resumes/${resumeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title: trimmed }),
    });
    if (!res.ok) throw new Error();
    onRenamed?.(trimmed);
    editing = false;
    toastState.show(t('success.versionRenamed'), 'success');
  } catch {
    toastState.show(t('errors.renameFailed'), 'danger');
  } finally {
    saving = false;
  }
}

async function remove() {
  if (!confirm('Remover esta versão permanentemente?')) return;
  deleting = true;
  try {
    const res = await fetch(`/api/v1/resumes/${resumeId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error();
    onDeleted?.();
    toastState.show(t('success.versionRemoved'), 'success');
  } catch {
    toastState.show(t('errors.removeFailed'), 'danger');
  } finally {
    deleting = false;
  }
}
</script>

<div class="flex items-center gap-2">
  {#if editing}
    <Input
      bind:value={titleDraft}
      placeholder="Nome da versão"
      class="h-7 text-xs"
    />
    <Button variant="icon" size="xs" onclick={saveRename} disabled={saving} aria-label={t('actions.save')}>
      {#if saving}
        <Loader2 size={14} class="animate-spin" />
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
      <Button variant="icon" size="xs" onclick={remove} disabled={deleting} aria-label={t('actions.remove')}>
        {#if deleting}
          <Loader2 size={14} class="animate-spin" />
        {:else}
          <Trash2 size={14} class="text-red-500" />
        {/if}
      </Button>
    {/if}
  {/if}
</div>
