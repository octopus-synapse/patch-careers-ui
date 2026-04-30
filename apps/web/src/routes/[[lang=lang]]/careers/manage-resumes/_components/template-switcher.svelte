<!--
  TemplateSwitcher — dropdown on resume cards that PATCHes the template
  field. Optimistic UI: updates local state immediately, rolls back on error.
-->
<script lang="ts">

import { untrack } from 'svelte';
import { Loader, toastState } from 'ui';

type Template =
  | 'PROFESSIONAL'
  | 'CREATIVE'
  | 'TECHNICAL'
  | 'MINIMAL'
  | 'MODERN'
  | 'EXECUTIVE'
  | 'ACADEMIC';

interface Props {
  resumeId: string;
  value: Template;
  onchange?: (next: Template) => void;
}

let { resumeId, value, onchange }: Props = $props();

// Mirror prop into local state so we can hold an optimistic update while the
// PATCH is in flight. `untrack` at init signals we intentionally seed with the
// current prop, and the $effect below re-syncs on future prop changes.
let current = $state<Template>(untrack(() => value));
$effect(() => {
  current = value;
});
let saving = $state(false);

const TEMPLATES: Array<{ value: Template; label: string }> = [
  { value: 'PROFESSIONAL', label: 'Profissional' },
  { value: 'MODERN', label: 'Moderno' },
  { value: 'CREATIVE', label: 'Criativo' },
  { value: 'TECHNICAL', label: 'Técnico' },
  { value: 'MINIMAL', label: 'Minimalista' },
  { value: 'EXECUTIVE', label: 'Executivo' },
  { value: 'ACADEMIC', label: 'Acadêmico' },
];

async function handleChange(e: Event) {
  const next = (e.currentTarget as HTMLSelectElement).value as Template;
  const prev = current;
  current = next;
  saving = true;
  try {
    const res = await fetch(`/api/v1/resumes/${resumeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ template: next }),
    });
    if (!res.ok) throw new Error();
    onchange?.(next);
    toastState.show('Template atualizado.', 'success');
  } catch {
    current = prev;
    toastState.show('Falha ao trocar template.', 'danger');
  } finally {
    saving = false;
  }
}
</script>

<label class="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-500">
  Template
  <div class="relative">
    <select
      bind:value={current}
      onchange={handleChange}
      disabled={saving}
      class="rounded-md border border-gray-200 bg-white px-2 py-1 pr-7 text-xs text-gray-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
    >
      {#each TEMPLATES as t}
        <option value={t.value}>{t.label}</option>
      {/each}
    </select>
    {#if saving}
      <Loader
        size={12}
        class="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2"
      />
    {/if}
  </div>
</label>
