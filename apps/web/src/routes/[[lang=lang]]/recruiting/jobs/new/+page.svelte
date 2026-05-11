<script lang="ts">
  /**
   * Recruiting jobs/new — burra: form de criação. Backend (T11.11) já expõe
   * /recruiting/jobs/form-config para wizard dinâmico, mas mantemos aqui um
   * form mínimo até o componente genérico de form-config-driven existir.
   */
  import { useQueryClient } from '@tanstack/svelte-query';
  import {
    getV1JobsApplicationsQueryKey,
    postV1Jobs,
    type PostV1JobsMutationRequest,
    type CreateJobRequestJobTypeEnumKey,
    type CreateJobRequestRemotePolicyEnumKey,
  } from 'api-client';
  import { ArrowLeft, ArrowRight, Check } from 'lucide-svelte';
  import { Badge, Button, Input, Label, Loader, Select, Textarea, toastState } from 'ui';
  import { goto } from '$app/navigation';
  import { locale } from '$lib/state/locale.svelte';

  const t = $derived(locale.t);
  const queryClient = useQueryClient();

  const DRAFT_KEY = 'patch:jobDraft';

  type Draft = {
    title: string;
    company: string;
    location: string;
    description: string;
    jobType: CreateJobRequestJobTypeEnumKey;
    remotePolicy: CreateJobRequestRemotePolicyEnumKey;
    salaryRange: string;
    applyUrl: string;
    skillsCsv: string;
    requirementsCsv: string;
  };

  const EMPTY: Draft = {
    title: '',
    company: '',
    location: '',
    description: '',
    jobType: 'FULL_TIME',
    remotePolicy: 'REMOTE',
    salaryRange: '',
    applyUrl: '',
    skillsCsv: '',
    requirementsCsv: '',
  };

  let draft = $state<Draft>({ ...EMPTY });
  let step = $state(1);
  let serverError = $state('');
  let submitting = $state(false);

  $effect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Draft>;
        draft = { ...EMPTY, ...parsed };
      }
    } catch {
      /* corrupt — ignore */
    }
  });

  $effect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* quota — ignore */
    }
  });

  const steps = [
    { id: 1, label: 'Básico' },
    { id: 2, label: 'Detalhes' },
    { id: 3, label: 'Skills' },
    { id: 4, label: 'Salário' },
  ];

  const canGoNext = $derived.by(() => {
    if (step === 1) return draft.title.trim() && draft.company.trim();
    if (step === 2) return draft.description.trim().length >= 20;
    return true;
  });

  function splitCsv(s: string): string[] {
    return s
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  async function submitDraft() {
    serverError = '';
    submitting = true;
    const body: PostV1JobsMutationRequest = {
      title: draft.title.trim(),
      company: draft.company.trim(),
      location: draft.location.trim() || undefined,
      description: draft.description.trim(),
      jobType: draft.jobType,
      remotePolicy: draft.remotePolicy,
      salaryRange: draft.salaryRange.trim() || undefined,
      applyUrl: draft.applyUrl.trim() || undefined,
      skills: splitCsv(draft.skillsCsv),
      requirements: splitCsv(draft.requirementsCsv),
    };
    try {
      await postV1Jobs(body);
      await queryClient.invalidateQueries({ queryKey: getV1JobsApplicationsQueryKey() });
      if (typeof window !== 'undefined') window.localStorage.removeItem(DRAFT_KEY);
      toastState.show(t('jobs.publishedSuccess'), 'success');
      void goto('/recruiting/jobs');
    } catch (err) {
      serverError = err instanceof Error ? err.message : t('errors.network');
    } finally {
      submitting = false;
    }
  }

  function next() {
    if (step < 4) step += 1;
    else void submitDraft();
  }

  function back() {
    if (step > 1) step -= 1;
  }
</script>

<svelte:head>
  <title>{t('company.jobs.new.pageTitle')}</title>
</svelte:head>

<div class="max-w-2xl space-y-6">
  <header class="space-y-3">
    <h1 class="text-2xl font-semibold text-gray-900 dark:text-neutral-100">
      {t('company.jobs.new.title')}
    </h1>
    <ol class="flex items-center gap-2 text-[11px] font-medium">
      {#each steps as s}
        {@const active = s.id === step}
        {@const done = s.id < step}
        <li class="flex items-center gap-2">
          <span
            class="flex h-5 w-5 items-center justify-center rounded-full border {active
              ? 'border-cyan-500 bg-cyan-500 text-white'
              : done
                ? 'border-cyan-500 bg-white text-cyan-600 dark:bg-neutral-900 dark:text-cyan-400'
                : 'border-gray-300 text-gray-400 dark:border-neutral-700 dark:text-neutral-600'}"
          >
            {#if done}
              <Check size={10} />
            {:else}
              {s.id}
            {/if}
          </span>
          <span
            class={active
              ? 'text-gray-800 dark:text-neutral-200'
              : 'text-gray-400 dark:text-neutral-600'}
          >
            {s.label}
          </span>
          {#if s.id < 4}
            <span class="h-px w-5 bg-gray-200 dark:bg-neutral-700"></span>
          {/if}
        </li>
      {/each}
    </ol>
  </header>

  <form
    onsubmit={(e) => {
      e.preventDefault();
      next();
    }}
    class="space-y-4"
  >
    {#if step === 1}
      <div>
        <Label for="title">{t('company.jobs.field.title')}</Label>
        <Input id="title" bind:value={draft.title} required />
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <Label for="company">{t('company.jobs.field.company')}</Label>
          <Input id="company" bind:value={draft.company} required />
        </div>
        <div>
          <Label for="location">{t('company.jobs.field.location')}</Label>
          <Input id="location" bind:value={draft.location} />
        </div>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <Label for="jobType">{t('company.jobs.field.jobType')}</Label>
          <Select id="jobType" bind:value={draft.jobType}>
            <option value="FULL_TIME">Full-time</option>
            <option value="PART_TIME">Part-time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="FREELANCE">Freelance</option>
            <option value="VOLUNTEER">Volunteer</option>
          </Select>
        </div>
        <div>
          <Label for="remotePolicy">{t('company.jobs.field.remotePolicy')}</Label>
          <Select id="remotePolicy" bind:value={draft.remotePolicy}>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">On-site</option>
          </Select>
        </div>
      </div>
    {:else if step === 2}
      <div>
        <Label for="description">{t('company.jobs.field.description')}</Label>
        <Textarea id="description" bind:value={draft.description} rows={10} />
        <p class="mt-1 text-[11px] text-gray-500 dark:text-neutral-500">
          {draft.description.trim().length} caracteres — mínimo 20.
        </p>
      </div>
      <div>
        <Label for="requirements">Requisitos</Label>
        <Input
          id="requirements"
          bind:value={draft.requirementsCsv}
          placeholder="3+ anos com React, inglês intermediário"
        />
        <p class="text-[11px] text-gray-500 dark:text-neutral-500">Separe por vírgula.</p>
      </div>
    {:else if step === 3}
      <div>
        <Label for="skills">{t('company.jobs.field.skills')}</Label>
        <Input id="skills" bind:value={draft.skillsCsv} placeholder="react, typescript, postgres" />
        <p class="text-[11px] text-gray-500 dark:text-neutral-500">
          Separe por vírgula. Esses skills viram filtros pro candidato.
        </p>
      </div>
      {#if splitCsv(draft.skillsCsv).length > 0}
        <div class="flex flex-wrap gap-1.5">
          {#each splitCsv(draft.skillsCsv) as skill}
            <Badge intent="neutral" size="md">{skill}</Badge>
          {/each}
        </div>
      {/if}
    {:else if step === 4}
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <Label for="salaryRange">{t('company.jobs.field.salaryRange')}</Label>
          <Input id="salaryRange" bind:value={draft.salaryRange} placeholder="R$ 8k - 12k" />
        </div>
        <div>
          <Label for="applyUrl">{t('company.jobs.field.applyUrl')}</Label>
          <Input
            id="applyUrl"
            type="url"
            bind:value={draft.applyUrl}
            placeholder="https://empresa.com/vagas/..."
          />
        </div>
      </div>
    {/if}

    {#if serverError}
      <p role="alert" class="text-xs font-medium text-red-500/80">{serverError}</p>
    {/if}

    <div class="flex items-center justify-between pt-2">
      <Button type="button" variant="ghost" onclick={back} disabled={step === 1}>
        <ArrowLeft size={14} />
        Voltar
      </Button>
      <div class="flex gap-2">
        <a href="/recruiting/jobs">
          <Button type="button" variant="ghost">{t('common.cancel')}</Button>
        </a>
        <Button type="submit" disabled={!canGoNext || submitting}>
          {#if submitting}
            <Loader size={14} />
          {:else if step === 4}
            {t('company.jobs.new.submit')}
          {:else}
            Avançar
            <ArrowRight size={14} />
          {/if}
        </Button>
      </div>
    </div>
  </form>
</div>
