<script lang="ts">
  /**
   * /my-profile/fit-profile/questions — burra: 25 perguntas Likert.
   */
  import {
    createGetV1FitProfileQuestions,
    getV1FitProfileMeQueryKey,
    postV1FitProfileAnswers,
  } from 'api-client';
  import { useQueryClient } from '@tanstack/svelte-query';
  import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-svelte';
  import { Button, Loader, toastState } from 'ui';
  import { handleApiError } from '$lib/components/errors/error-renderer.svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { locale } from '$lib/state/locale.svelte';

  const t = $derived(locale.t);

  const LIKERT_OPTIONS = $derived([
    { value: 1, label: t('fitProfileMine.questions.scaleDisagreeStrongly') },
    { value: 2, label: 'Discordo' },
    { value: 3, label: 'Neutro' },
    { value: 4, label: 'Concordo' },
    { value: 5, label: t('fitProfileMine.questions.scaleAgreeStrongly') },
  ] as const);

  const questionsQuery = createGetV1FitProfileQuestions({
      query: { enabled: browser, retry: false, refetchOnWindowFocus: false },
    });

  const queryClient = useQueryClient();

  const questionsData = $derived($questionsQuery.data);
  const questionSetId = $derived(questionsData?.questionSetId ?? '');
  const questions = $derived(questionsData?.questions);
  const total = $derived(questions ? questions.length : 0);

  let submitting = $state(false);

  let currentIndex = $state(0);
  let answers = $state<Map<string, number>>(new Map());

  const currentQuestion = $derived(questions?.[currentIndex]);
  const currentAnswer = $derived(
    currentQuestion ? (answers.get(currentQuestion.id) ?? null) : null,
  );
  const progress = $derived(total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0);
  const canAdvance = $derived(typeof currentAnswer === 'number');
  const isLast = $derived(currentIndex === total - 1);
  const localeTag = $derived(locale.current === 'en' ? 'en' : 'pt-BR');

  function pick(value: number): void {
    if (!currentQuestion) return;
    const next = new Map(answers);
    next.set(currentQuestion.id, value);
    answers = next;
  }

  function prev(): void {
    if (currentIndex > 0) currentIndex--;
  }

  function advance(): void {
    if (!canAdvance) return;
    if (!isLast) {
      currentIndex++;
      return;
    }
    void commit();
  }

  async function commit(): Promise<void> {
    submitting = true;
    try {
      await postV1FitProfileAnswers({
        questionSetId,
        answers: Array.from(answers, ([questionId, rawValue]) => ({ questionId, rawValue })),
      });
      await queryClient.invalidateQueries({ queryKey: getV1FitProfileMeQueryKey() });
      toastState.show(t('fitProfileMine.savedToast'), 'success');
      void goto('/my-profile/scores');
    } catch (err) {
      handleApiError(err);
    } finally {
      submitting = false;
    }
  }
</script>

<section class="mx-auto flex max-w-xl flex-col px-6 py-10">
  {#if $questionsQuery.isPending}
    <div class="flex items-center justify-center py-16">
      <Loader size={24} />
    </div>
  {:else if $questionsQuery.isError || total === 0}
    <div class="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
      Não conseguimos carregar o questionário. Tente recarregar a página.
    </div>
  {:else}
    <header class="mb-8 space-y-3">
      <div class="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        <span>Fit Profile</span>
        <span>{currentIndex + 1} / {total}</span>
      </div>
      <div class="h-1 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          class="h-full bg-emerald-500 transition-all"
          style="width: {progress}%"
        ></div>
      </div>
    </header>

    {#if currentQuestion}
      <h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
        {localeTag === 'en' ? currentQuestion.textEn : currentQuestion.textPtBr}
      </h1>

      <ul class="mt-6 space-y-2">
        {#each LIKERT_OPTIONS as opt (opt.value)}
          {@const selected = currentAnswer === opt.value}
          <li>
            <button
              type="button"
              class="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition {selected
                ? 'border-emerald-500 bg-emerald-50 font-semibold text-emerald-800 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-200'
                : 'border-neutral-200 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-500'}"
              onclick={() => pick(opt.value)}
            >
              <span>{opt.label}</span>
              {#if selected}
                <CheckCircle2 size={16} />
              {/if}
            </button>
          </li>
        {/each}
      </ul>

      <div class="mt-8 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onclick={prev}
          disabled={currentIndex === 0}
        >
          <ArrowLeft size={14} />
          Voltar
        </Button>
        <Button
          variant="solid"
          size="sm"
          onclick={advance}
          disabled={!canAdvance || submitting}
        >
          {#if submitting}
            <Loader size={14} />
          {/if}
          {isLast ? 'Salvar' : t('fitProfileMine.questions.nextButton')}
          {#if !isLast}<ArrowRight size={14} />{/if}
        </Button>
      </div>
    {/if}
  {/if}
</section>
