<script lang="ts">
  import { createFitProfileMe, fitProfileDeleteMe } from 'api-client';
  import { useQueryClient } from '@tanstack/svelte-query';
  import { CheckCircle2, Clock, Loader2, Trash2 } from 'lucide-svelte';
  import { Button, toastState } from 'ui';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { getFitProfileMeQueryKey } from 'api-client';

  const queryClient = useQueryClient();
  const meQuery = createFitProfileMe(() => ({
    query: { enabled: browser, retry: false },
  }));

  const status = $derived<'responded' | 'expired' | 'never' | 'loading'>(
    meQuery.isPending
      ? 'loading'
      : ((meQuery.data?.status as 'responded' | 'expired' | 'never' | undefined) ?? 'never'),
  );
  const expiresAt = $derived(
    meQuery.data && 'expiresAt' in meQuery.data
      ? (meQuery.data as { expiresAt?: string | null }).expiresAt ?? null
      : null,
  );

  let deleting = $state(false);
  async function handleDelete(): Promise<void> {
    if (!confirm('Apagar seu Fit Profile? As respostas serão anonimizadas.')) return;
    deleting = true;
    try {
      await fitProfileDeleteMe();
      await queryClient.invalidateQueries({ queryKey: getFitProfileMeQueryKey() });
      toastState.show('Fit Profile apagado.' , 'success');
    } catch (err) {
      toastState.show(
        err instanceof Error ? err.message : 'Não foi possível apagar.',
        'danger',
      );
    } finally {
      deleting = false;
    }
  }
</script>

<section class="mx-auto max-w-2xl space-y-6 p-6">
  <header>
    <h1 class="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
      Fit Profile
    </h1>
    <p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
      Um vetor comportamental (Big Five + Schwartz + SDT) que destrava
      o Match Score, o tailor de currículo e o auto-apply.
    </p>
  </header>

  {#if status === 'loading'}
    <div class="flex items-center justify-center rounded-xl border border-neutral-200 p-10 dark:border-neutral-800">
      <Loader2 class="animate-spin text-neutral-500" size={20} />
    </div>
  {:else if status === 'responded'}
    <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/40">
      <div class="flex items-start gap-3">
        <CheckCircle2 class="mt-0.5 text-emerald-600 dark:text-emerald-300" size={20} />
        <div class="flex-1">
          <h2 class="font-semibold text-emerald-800 dark:text-emerald-200">Perfil ativo</h2>
          <p class="mt-1 text-sm text-emerald-700 dark:text-emerald-200/80">
            Match Score e tailor estão liberados.
            {#if expiresAt}
              Expira em {new Date(expiresAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.
            {/if}
          </p>
        </div>
      </div>
      <div class="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="solid" size="sm" onclick={() => goto('/my-profile/fit-profile/questions')}>
          Refazer questionário
        </Button>
        <Button variant="ghost" size="sm" onclick={handleDelete} disabled={deleting}>
          {#if deleting}<Loader2 size={14} class="animate-spin" />{:else}<Trash2 size={14} />{/if}
          Apagar perfil
        </Button>
      </div>
    </div>
  {:else}
    <div class="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950/40">
      <div class="flex items-start gap-3">
        <Clock class="mt-0.5 text-amber-700 dark:text-amber-300" size={20} />
        <div class="flex-1">
          <h2 class="font-semibold text-amber-800 dark:text-amber-200">
            {status === 'expired' ? 'Perfil expirado' : 'Perfil ainda não respondido'}
          </h2>
          <p class="mt-1 text-sm text-amber-700 dark:text-amber-200/80">
            {status === 'expired'
              ? 'Seu vetor expirou — refaça o questionário pra reativar o Match Score.'
              : 'Leva cerca de 5 minutos. São 25 perguntas em escala Likert (1–5).'}
          </p>
        </div>
      </div>
      <div class="mt-4">
        <Button variant="solid" size="sm" onclick={() => goto('/my-profile/fit-profile/questions')}>
          Começar agora
        </Button>
      </div>
    </div>
  {/if}
</section>
