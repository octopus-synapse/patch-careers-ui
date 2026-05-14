<!--
  TemplateSwitcher — dropdown on resume cards. Uses the SDK PATCH now
  that `template` is a real column on Resume (F3-PD-009d).
-->
<script lang="ts">

import { patchV1ResumesResumeId } from 'api-client';
import { untrack } from 'svelte';
import { handleApiError } from '$lib/components/errors/error-renderer.svelte';
import { Loader, toastState } from 'ui';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

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

const TEMPLATES: Array<{ value: Template; label: string }> = $derived([
  { value: 'PROFESSIONAL', label: 'Profissional' },
  { value: 'MODERN', label: 'Moderno' },
  { value: 'CREATIVE', label: 'Criativo' },
  { value: 'TECHNICAL', label: t('careers.template.label.technical') },
  { value: 'MINIMAL', label: 'Minimalista' },
  { value: 'EXECUTIVE', label: 'Executivo' },
  { value: 'ACADEMIC', label: t('careers.template.label.academic') },
]);

async function handleChange(e: Event) {
  const next = (e.currentTarget as HTMLSelectElement).value as Template;
  const prev = current;
  current = next;
  saving = true;
  try {
    await patchV1ResumesResumeId(resumeId, { template: next });
    onchange?.(next);
    toastState.show(t('careers.templateSwitcher.toastUpdated'), 'success');
  } catch (err) {
    current = prev;
    handleApiError(err);
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
      {#each TEMPLATES as tpl}
        <option value={tpl.value}>{tpl.label}</option>
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
