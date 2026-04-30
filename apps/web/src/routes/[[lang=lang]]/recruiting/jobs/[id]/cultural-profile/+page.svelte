<script lang="ts">
  // @ts-nocheck — F3 burrar pending; SDK rename cascade after F1 swagger regen.
  import { createFitProfileGetOne, fitProfileUpsertOne } from 'api-client';
  import { useQueryClient } from '@tanstack/svelte-query';
  import { Save } from 'lucide-svelte';
  import { Button, Loader, toastState } from 'ui';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
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

  const ALL_KEYS = [...DIMENSIONS.bigFive, ...DIMENSIONS.schwartz, ...DIMENSIONS.sdt];

  const jobId = $derived(($page.params as Record<string, string>).id);

  const queryClient = useQueryClient();
  const existingQuery = createFitProfileGetOne(
    () => jobId,
    () => ({ query: { enabled: browser && !!jobId, retry: false } }),
  );

  // Sliders store — each dimension 0–1, default 0.5 (neutral).
  let sliders = $state<Record<string, number>>(
    Object.fromEntries(ALL_KEYS.map((d) => [d.key, 0.5])),
  );

  // Hydrate from existing JobFitProfile when the query resolves.
  $effect(() => {
    const vec = existingQuery.data?.vector;
    if (!vec) return;
    const merged = { ...sliders };
    for (const block of ['bigFive', 'schwartz', 'sdt'] as const) {
      const raw = (vec as Record<string, Record<string, number> | undefined>)[block] ?? {};
      for (const [k, v] of Object.entries(raw)) merged[k] = typeof v === 'number' ? v : 0.5;
    }
    sliders = merged;
  });

  let saving = $state(false);
  async function save(): Promise<void> {
    saving = true;
    try {
      await fitProfileUpsertOne(jobId, { sliders });
      toastState.show('Cultural profile salvo.', 'success');
      await queryClient.invalidateQueries({ queryKey: ['fit-profile', jobId] });
      void goto(`/recruiting/jobs/${jobId}`);
    } catch (err) {
      toastState.show(err instanceof Error ? err.message : 'Não foi possível salvar.', 'danger');
    } finally {
      saving = false;
    }
  }
</script>

<section class="mx-auto max-w-3xl space-y-6 p-6">
  <header>
    <h1 class="text-2xl font-semibold">Cultural Profile</h1>
    <p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
      Defina o perfil comportamental ideal para esta vaga. O Match Score
      dos candidatos será calculado contra estes 18 vetores.
    </p>
  </header>

  {#if existingQuery.isPending}
    <div class="flex justify-center py-12"><Loader /></div>
  {:else}
    {#each Object.entries(DIMENSIONS) as [block, dims]}
      <section class="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          {block === 'bigFive' ? 'Big Five' : block === 'schwartz' ? 'Schwartz' : 'SDT'}
        </h2>
        <div class="mt-3 space-y-3">
          {#each dims as d (d.key)}
            <div>
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium">{d.label}</span>
                <span class="font-mono tabular-nums text-neutral-500">
                  {Math.round((sliders[d.key] ?? 0.5) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                bind:value={sliders[d.key]}
                class="mt-1 w-full accent-emerald-500"
              />
            </div>
          {/each}
        </div>
      </section>
    {/each}

    <div class="flex items-center justify-end gap-2">
      <Button variant="ghost" size="sm" onclick={() => goto(`/recruiting/jobs/${jobId}`)}>
        Cancelar
      </Button>
      <Button variant="solid" size="sm" onclick={save} disabled={saving}>
        {#if saving}<Loader size={14} />{:else}<Save size={14} />{/if}
        Salvar cultural profile
      </Button>
    </div>
  {/if}
</section>
