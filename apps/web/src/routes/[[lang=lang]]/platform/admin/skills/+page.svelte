<script lang="ts">
  /**
   * Admin skills hub — burra: tabs entre catálogos (areas, niches, skills,
   * programming-languages, spoken-languages). Lista + delete em cada tab.
   * Backend retorna `void` no schema OpenAPI; cast local da resposta.
   */
  import { useQueryClient } from '@tanstack/svelte-query';
  import {
    adminProgrammingLanguagesDelete,
    adminSpokenLanguagesDelete,
    adminTechAreasDelete,
    adminTechNichesDelete,
    adminTechSkillsDelete,
    createAdminProgrammingLanguagesList,
    createAdminSpokenLanguagesList,
    createAdminTechAreasList,
    createAdminTechNichesList,
    createAdminTechSkillsList,
    getAdminProgrammingLanguagesListQueryKey,
    getAdminSpokenLanguagesListQueryKey,
    getAdminTechAreasListQueryKey,
    getAdminTechNichesListQueryKey,
    getAdminTechSkillsListQueryKey,
  } from 'api-client';
  import { Trash2 } from 'lucide-svelte';
  import { Button, Loader, toastState } from 'ui';
  import { browser } from '$app/environment';
  import { locale } from '$lib/state/locale.svelte';

  type Item = {
    id?: string;
    slug?: string;
    code?: string;
    name?: string;
    nameEn?: string;
    namePtBr?: string;
    isActive?: boolean;
  };

  const t = $derived(locale.t);
  const queryClient = useQueryClient();

  type Tab = 'areas' | 'niches' | 'skills' | 'programming' | 'spoken';
  let tab = $state<Tab>('areas');
  let search = $state('');

  const params = $derived({ page: '1', pageSize: '50', search: search || undefined });

  const areasQuery = createAdminTechAreasList(
    () => params,
    () => ({ query: { enabled: browser && tab === 'areas' } }),
  );
  const nichesQuery = createAdminTechNichesList(
    () => params,
    () => ({ query: { enabled: browser && tab === 'niches' } }),
  );
  const skillsQuery = createAdminTechSkillsList(
    () => params,
    () => ({ query: { enabled: browser && tab === 'skills' } }),
  );
  const progQuery = createAdminProgrammingLanguagesList(
    () => params,
    () => ({ query: { enabled: browser && tab === 'programming' } }),
  );
  const spokenQuery = createAdminSpokenLanguagesList(
    () => params,
    () => ({ query: { enabled: browser && tab === 'spoken' } }),
  );

  function items(data: unknown): Item[] {
    return (data as { items?: Item[] } | undefined)?.items ?? [];
  }

  let deleting = $state<string | null>(null);
  async function handleDelete(id: string) {
    deleting = id;
    try {
      switch (tab) {
        case 'areas':
          await adminTechAreasDelete(id);
          await queryClient.invalidateQueries({ queryKey: getAdminTechAreasListQueryKey() });
          break;
        case 'niches':
          await adminTechNichesDelete(id);
          await queryClient.invalidateQueries({ queryKey: getAdminTechNichesListQueryKey() });
          break;
        case 'skills':
          await adminTechSkillsDelete(id);
          await queryClient.invalidateQueries({ queryKey: getAdminTechSkillsListQueryKey() });
          break;
        case 'programming':
          await adminProgrammingLanguagesDelete(id);
          await queryClient.invalidateQueries({
            queryKey: getAdminProgrammingLanguagesListQueryKey(),
          });
          break;
        case 'spoken':
          await adminSpokenLanguagesDelete(id);
          await queryClient.invalidateQueries({ queryKey: getAdminSpokenLanguagesListQueryKey() });
          break;
      }
      toastState.show('Item excluído', 'success');
    } catch {
      toastState.show('Falha ao excluir', 'danger');
    } finally {
      deleting = null;
    }
  }

  const tabs: { value: Tab; label: string }[] = [
    { value: 'areas', label: 'Áreas' },
    { value: 'niches', label: 'Nichos' },
    { value: 'skills', label: 'Skills' },
    { value: 'programming', label: 'Linguagens de prog.' },
    { value: 'spoken', label: 'Idiomas falados' },
  ];

  const currentItems = $derived.by(() => {
    switch (tab) {
      case 'areas':
        return items(areasQuery.data);
      case 'niches':
        return items(nichesQuery.data);
      case 'skills':
        return items(skillsQuery.data);
      case 'programming':
        return items(progQuery.data);
      case 'spoken':
        return items(spokenQuery.data);
    }
  });

  const isLoading = $derived(
    tab === 'areas'
      ? areasQuery.isLoading
      : tab === 'niches'
        ? nichesQuery.isLoading
        : tab === 'skills'
          ? skillsQuery.isLoading
          : tab === 'programming'
            ? progQuery.isLoading
            : spokenQuery.isLoading,
  );

  function getKey(item: Item): string {
    return item.id ?? item.slug ?? item.code ?? '';
  }
</script>

<svelte:head>
  <title>{t('admin.skills.title')}</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
    {t('admin.skills.title')}
  </h1>

  <div class="flex flex-wrap gap-2">
    {#each tabs as t}
      <button
        type="button"
        class="rounded-md border px-3 py-1.5 text-xs transition-colors {tab === t.value
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-gray-500 hover:bg-muted dark:text-neutral-500'}"
        onclick={() => (tab = t.value)}
      >
        {t.label}
      </button>
    {/each}
  </div>

  <input
    type="search"
    placeholder="Buscar..."
    bind:value={search}
    class="w-full max-w-sm rounded-md border border-border bg-background px-3 py-1.5 text-sm"
  />

  {#if isLoading}
    <div class="flex items-center justify-center py-12"><Loader size={20} /></div>
  {:else}
    <div class="rounded-xl border border-border">
      <table class="w-full text-sm">
        <thead class="bg-muted/40">
          <tr class="text-left text-xs text-gray-500 dark:text-neutral-500">
            <th class="px-3 py-2">Identificador</th>
            <th class="px-3 py-2">Nome</th>
            <th class="px-3 py-2">Ativo</th>
            <th class="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {#each currentItems as item}
            {@const key = getKey(item)}
            <tr class="border-t border-border">
              <td class="px-3 py-2 font-mono text-xs">{key}</td>
              <td class="px-3 py-2">{item.namePtBr ?? item.nameEn ?? item.name ?? '—'}</td>
              <td class="px-3 py-2 text-xs">{item.isActive ? 'Sim' : 'Não'}</td>
              <td class="px-3 py-2 text-right">
                <Button
                  size="sm"
                  variant="ghost"
                  onclick={() => handleDelete(key)}
                  disabled={deleting === key}
                >
                  <Trash2 class="size-3" />
                </Button>
              </td>
            </tr>
          {:else}
            <tr><td colspan="4" class="px-3 py-6 text-center text-xs text-gray-500 dark:text-neutral-500">{t('admin.skills.noItems')}</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
