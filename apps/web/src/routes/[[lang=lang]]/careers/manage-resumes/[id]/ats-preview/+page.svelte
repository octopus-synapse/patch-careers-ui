<!--
  ATS Simulator preview — shows the user how a generic ATS (Greenhouse,
  Workday, Lever style) would actually parse their resume. Surfaces the
  reordering of two-column layouts, decorative-glyph stripping, and
  unknown-section warnings.
-->
<script lang="ts">
import { getV1AtsSimulateResumeId, isApiError } from 'api-client';
import { AlertTriangle, Eye, ScanText } from 'lucide-svelte';
import { onMount } from 'svelte';
import { Button, Card, Loader, toastState } from 'ui';
import { browser } from '$app/environment';
import { page } from '$app/stores';

const resumeId = $derived($page.params.id);

interface SimulationItem {
  fields: Record<string, string>;
}
interface SimulationSection {
  title: string;
  semanticKind: string;
  column: 'main' | 'sidebar' | 'full-width';
  items: SimulationItem[];
}
interface SimulationResult {
  extractedText: string;
  sections: SimulationSection[];
  warnings: string[];
}

let loading = $state(true);
let running = $state(false);
let result = $state<SimulationResult | null>(null);

/**
 * Pull the user's compiled resume DSL/AST + run the simulator. The simulator
 * is a stateless POST taking a layout + sections object — we feed it the
 * shape that the DSL renderer already produces server-side.
 */
async function simulate() {
  if (!browser || !resumeId) return;
  running = true;
  try {
    const body = await getV1AtsSimulateResumeId(resumeId);
    result = (body.data as SimulationResult | undefined) ?? null;
  } catch (err) {
    toastState.show(
      isApiError(err) ? err.message : 'Falha na simulação.',
      'danger',
    );
  } finally {
    running = false;
    loading = false;
  }
}

onMount(simulate);
</script>

<svelte:head>
  <title>Pré-visualização ATS · Patch Careers</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 pt-20 pb-12">
  <header class="mb-6 flex items-start justify-between gap-4">
    <div>
      <h1 class="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-neutral-100">
        <ScanText size={20} />
        Pré-visualização ATS
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-neutral-500">
        O que um parser ATS típico (Greenhouse, Workday, Lever) extrai do seu currículo.
      </p>
    </div>
    <Button variant="outline" size="sm" onclick={simulate} disabled={running}>
      {#if running}
        <Loader size={14} class="mr-2" />
      {:else}
        <Eye size={14} class="mr-2" />
      {/if}
      Re-simular
    </Button>
  </header>

  <div class="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
    <p class="font-medium">O que é ATS?</p>
    <p class="mt-1 text-amber-800 dark:text-amber-300/90">
      ATS (<i>Applicant Tracking System</i>) é o software que recrutadores usam pra filtrar currículos
      antes de olhar um por um. Ele ignora design e lê seu CV como texto cru. Palavras-chave
      faltando reduzem seu score e tiram você da pilha. O que você vê abaixo é como esse
      sistema enxerga o seu currículo.
    </p>
  </div>

  {#if loading || running}
    <div class="flex justify-center py-16">
      <Loader size={20} />
    </div>
  {:else if !result}
    <p class="rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-neutral-800">
      Sem dados para mostrar.
    </p>
  {:else}
    {#if result.warnings.length > 0}
      <Card>
        <header class="flex items-center gap-2 pb-3">
          <AlertTriangle size={16} class="text-amber-500" />
          <h2 class="text-sm font-semibold text-gray-900 dark:text-neutral-100">
            Atenção ({result.warnings.length})
          </h2>
        </header>
        <ul class="space-y-2 text-xs text-gray-700 dark:text-neutral-300">
          {#each result.warnings as w}
            <li class="rounded-md bg-amber-500/5 px-3 py-2">{w}</li>
          {/each}
        </ul>
      </Card>
    {/if}

    <section class="mt-6">
      <h2 class="mb-2 text-sm font-semibold text-gray-900 dark:text-neutral-100">
        Texto que o ATS vê
      </h2>
      <pre class="max-h-96 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4 font-mono text-[11px] text-gray-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 whitespace-pre-wrap">{result.extractedText}</pre>
    </section>

    <section class="mt-6">
      <h2 class="mb-2 text-sm font-semibold text-gray-900 dark:text-neutral-100">
        Estrutura reordenada
      </h2>
      <p class="mb-3 text-[11px] text-gray-500 dark:text-neutral-500">
        Em layouts de duas colunas o ATS lê a coluna principal antes da sidebar — esta é a ordem real que o parser segue.
      </p>
      <ol class="space-y-2">
        {#each result.sections as section, i}
          <li class="rounded-lg border border-gray-200 px-3 py-2 dark:border-neutral-800">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-900 dark:text-neutral-100">
                {i + 1}. {section.title || '(sem título)'}
              </span>
              <span
                class="rounded px-2 py-0.5 text-[10px] uppercase tracking-wide"
                class:bg-emerald-500-10={section.semanticKind !== 'MISC'}
                class:text-emerald-600={section.semanticKind !== 'MISC'}
                class:bg-red-500-10={section.semanticKind === 'MISC'}
                class:text-red-600={section.semanticKind === 'MISC'}
              >
                {section.semanticKind}
              </span>
            </div>
            <p class="mt-1 text-[11px] text-gray-500 dark:text-neutral-500">
              {section.items.length} itens · coluna: {section.column}
            </p>
          </li>
        {/each}
      </ol>
    </section>
  {/if}
</div>
