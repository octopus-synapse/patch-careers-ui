<script lang="ts">
  /**
   * Recruiting jobs/edit — burra: hidrata via createGetV1JobsId e patch via
   * patchV1JobsId.
   */
  import { useQueryClient } from '@tanstack/svelte-query';
  import {
    createGetV1JobsId,
    getV1JobsIdQueryKey,
    getV1JobsApplicationsQueryKey,
    patchV1JobsId,
    type PatchV1JobsIdMutationRequest,
  } from 'api-client';
  import { Button, Input, Label, Loader, Textarea, toastState } from 'ui';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { locale } from '$lib/state/locale.svelte';

  const t = $derived(locale.t);
  const queryClient = useQueryClient();
  const jobId = $derived($page.params.id ?? '');

  const jobQuery = createGetV1JobsId(jobId);
  const job = $derived($jobQuery.data);

  let title = $state('');
  let company = $state('');
  let location = $state('');
  let description = $state('');
  let salaryRange = $state('');
  let applyUrl = $state('');
  let skillsCsv = $state('');
  let hydrated = $state(false);
  let serverError = $state('');
  let submitting = $state(false);

  $effect(() => {
    if (job && !hydrated) {
      title = job.title;
      company = job.company;
      location = job.location ?? '';
      description = job.description;
      salaryRange = job.salaryRange ?? '';
      applyUrl = job.applyUrl ?? '';
      skillsCsv = job.skills.join(', ');
      hydrated = true;
    }
  });

  function splitCsv(s: string): string[] {
    return s
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  async function onsubmit(e: Event) {
    e.preventDefault();
    serverError = '';
    submitting = true;
    const body: PatchV1JobsIdMutationRequest = {
      title: title.trim() || undefined,
      company: company.trim() || undefined,
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      salaryRange: salaryRange.trim() || undefined,
      applyUrl: applyUrl.trim() || undefined,
      skills: splitCsv(skillsCsv),
    };
    try {
      await patchV1JobsId(jobId, body);
      toastState.show('Vaga atualizada', 'success');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getV1JobsIdQueryKey(jobId) }),
        queryClient.invalidateQueries({ queryKey: getV1JobsApplicationsQueryKey() }),
      ]);
      void goto('/recruiting/jobs');
    } catch (err) {
      serverError = err instanceof Error ? err.message : t('auth.shared.errorGeneric');
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>{t('company.jobs.edit.pageTitle')}</title>
</svelte:head>

<div class="max-w-2xl space-y-6">
  <header>
    <h1 class="text-2xl font-semibold text-gray-900 dark:text-neutral-100">
      {t('company.jobs.edit.title')}
    </h1>
  </header>

  {#if $jobQuery.isLoading}
    <div class="flex items-center justify-center py-20"><Loader size={20} /></div>
  {:else if !job}
    <p class="text-sm text-gray-500 dark:text-neutral-400">{t('company.jobs.edit.notFound')}</p>
  {:else}
    <form {onsubmit} class="space-y-4">
      <div>
        <Label for="title">{t('company.jobs.field.title')}</Label>
        <Input id="title" bind:value={title} required />
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <Label for="company">{t('company.jobs.field.company')}</Label>
          <Input id="company" bind:value={company} required />
        </div>
        <div>
          <Label for="location">{t('company.jobs.field.location')}</Label>
          <Input id="location" bind:value={location} />
        </div>
      </div>
      <div>
        <Label for="description">{t('company.jobs.field.description')}</Label>
        <Textarea id="description" bind:value={description} rows={10} />
      </div>
      <div>
        <Label for="skills">{t('company.jobs.field.skills')}</Label>
        <Input id="skills" bind:value={skillsCsv} />
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <Label for="salaryRange">{t('company.jobs.field.salaryRange')}</Label>
          <Input id="salaryRange" bind:value={salaryRange} />
        </div>
        <div>
          <Label for="applyUrl">{t('company.jobs.field.applyUrl')}</Label>
          <Input id="applyUrl" type="url" bind:value={applyUrl} />
        </div>
      </div>

      {#if serverError}
        <p role="alert" class="text-xs font-medium text-red-500/80">{serverError}</p>
      {/if}

      <div class="flex items-center justify-end gap-2 pt-2">
        <a href="/recruiting/jobs">
          <Button type="button" variant="ghost">{t('common.cancel')}</Button>
        </a>
        <Button type="submit" disabled={submitting}>
          {#if submitting}<Loader size={14} />{/if}
          {t('company.jobs.edit.submit')}
        </Button>
      </div>
    </form>
  {/if}
</div>
