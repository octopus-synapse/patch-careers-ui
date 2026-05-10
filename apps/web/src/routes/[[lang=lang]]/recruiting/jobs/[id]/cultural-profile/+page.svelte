<script lang="ts">
  /**
   * Recruiting jobs/[id]/cultural-profile — burra: sliders 0-1 por dimensão.
   */
  import {
    type PostV1JobsIdFitProfileMutationRequest,
    createGetV1JobsIdFitProfile,
    postV1JobsIdFitProfile,
  } from 'api-client';

  type Sliders = PostV1JobsIdFitProfileMutationRequest['sliders'];
  import { Save } from 'lucide-svelte';
  import { Button, Loader, toastState } from 'ui';
  import { handleApiError } from '$lib/components/errors/error-renderer.svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';

  const DIMENSIONS = {
    bigFive: [
      { key: 'BIG_FIVE_OPENNESS', label: 'Openness' },
      { key: 'BIG_FIVE_CONSCIENTIOUSNESS', label: 'Conscientiousness' },
      { key: 'BIG_FIVE_EXTRAVERSION', label: 'Extraversion' },
      { key: 'BIG_FIVE_AGREEABLENESS', label: 'Agreeableness' },
      { key: 'BIG_FIVE_NEUROTICISM', label: 'Neuroticism' },
    ],
    schwartz: [
      { key: 'SCHWARTZ_SELF_DIRECTION', label: 'Self-direction' },
      { key: 'SCHWARTZ_STIMULATION', label: 'Stimulation' },
      { key: 'SCHWARTZ_HEDONISM', label: 'Hedonism' },
      { key: 'SCHWARTZ_ACHIEVEMENT', label: 'Achievement' },
      { key: 'SCHWARTZ_POWER', label: 'Power' },
      { key: 'SCHWARTZ_SECURITY', label: 'Security' },
      { key: 'SCHWARTZ_CONFORMITY', label: 'Conformity' },
      { key: 'SCHWARTZ_TRADITION', label: 'Tradition' },
      { key: 'SCHWARTZ_BENEVOLENCE', label: 'Benevolence' },
      { key: 'SCHWARTZ_UNIVERSALISM', label: 'Universalism' },
    ],
    sdt: [
      { key: 'SDT_AUTONOMY', label: 'Autonomy' },
      { key: 'SDT_COMPETENCE', label: 'Competence' },
      { key: 'SDT_RELATEDNESS', label: 'Relatedness' },
    ],
  } as const;

  type SlidersKey = keyof Sliders;

  const ALL_KEYS = [...DIMENSIONS.bigFive, ...DIMENSIONS.schwartz, ...DIMENSIONS.sdt] as readonly {
    key: SlidersKey;
    label: string;
  }[];

  const jobId = $derived(($page.params as Record<string, string>).id ?? '');

  const fitQuery = createGetV1JobsIdFitProfile(
    jobId,
    { query: { enabled: browser && Boolean(jobId) } },
  );

  let sliders = $state<Sliders>({});

  // GET response groups sliders under `vector.{bigFive,schwartz,sdt}`; the
  // POST mutation expects them flat under `sliders`. Flatten on read.
  $effect(() => {
    const v = $fitQuery.data?.vector;
    if (v) sliders = { ...v.bigFive, ...v.schwartz, ...v.sdt };
  });

  let saving = $state(false);
  async function save() {
    saving = true;
    try {
      await postV1JobsIdFitProfile(jobId, { sliders });
      toastState.show('Perfil cultural salvo', 'success');
    } catch (err) {
      handleApiError(err);
    } finally {
      saving = false;
    }
  }

  function getValue(key: SlidersKey): number {
    return sliders[key] ?? 0.5;
  }
  function setValue(key: SlidersKey, value: number) {
    sliders = { ...sliders, [key]: value };
  }
</script>

<svelte:head>
  <title>Perfil Cultural · Vaga</title>
</svelte:head>

<div class="mx-auto max-w-3xl space-y-6 px-3 sm:px-6">
  <header class="space-y-1">
    <h1 class="text-2xl font-semibold text-gray-900 dark:text-neutral-100">
      Perfil Cultural da Vaga
    </h1>
    <p class="text-sm text-gray-500 dark:text-neutral-400">
      Ajuste os sliders entre 0 e 1 para definir o fit ideal por dimensão.
    </p>
  </header>

  {#if $fitQuery.isLoading}
    <div class="flex items-center justify-center py-20"><Loader size={20} /></div>
  {:else}
    <div class="space-y-6">
      {#each Object.entries(DIMENSIONS) as [bucket, items]}
        <section class="rounded-xl border border-border p-4 space-y-3">
          <h2 class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-500">
            {bucket}
          </h2>
          {#each items as item}
            <label class="block space-y-1">
              <div class="flex items-center justify-between text-sm">
                <span>{item.label}</span>
                <span class="font-mono text-xs">{getValue(item.key as SlidersKey).toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={getValue(item.key as SlidersKey)}
                oninput={(e) =>
                  setValue(item.key as SlidersKey, Number((e.target as HTMLInputElement).value))}
                class="w-full"
              />
            </label>
          {/each}
        </section>
      {/each}
    </div>

    <div class="flex justify-end">
      <Button onclick={save} disabled={saving}>
        {#if saving}<Loader size={14} />{:else}<Save size={14} />{/if}
        Salvar
      </Button>
    </div>
  {/if}
</div>
