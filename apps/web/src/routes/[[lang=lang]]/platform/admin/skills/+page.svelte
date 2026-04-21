<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  adminProgrammingLanguagesCreate,
  adminProgrammingLanguagesRemove,
  adminProgrammingLanguagesUpdate,
  adminSpokenLanguagesCreate,
  adminSpokenLanguagesRemove,
  adminSpokenLanguagesUpdate,
  adminTechAreasCreate,
  adminTechAreasRemove,
  adminTechAreasUpdate,
  adminTechNichesCreate,
  adminTechNichesRemove,
  adminTechNichesUpdate,
  adminTechSkillsCreate,
  adminTechSkillsRemove,
  adminTechSkillsUpdate,
  createAdminProgrammingLanguagesFindAll,
  createAdminSpokenLanguagesFindAll,
  createAdminTechAreasFindAll,
  createAdminTechNichesFindAll,
  createAdminTechSkillsFindAll,
  getAdminProgrammingLanguagesFindAllQueryKey,
  getAdminSpokenLanguagesFindAllQueryKey,
  getAdminTechAreasFindAllQueryKey,
  getAdminTechNichesFindAllQueryKey,
  getAdminTechSkillsFindAllQueryKey,
} from 'api-client';
import { Loader2, Pencil, Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-svelte';
import { Button, ConfirmModal, FormModal, Input, Label, SegmentToggle } from 'ui';
import { browser } from '$app/environment';
import ExportButton from '$lib/components/data/export-button.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);
const queryClient = useQueryClient();

let activeTab = $state<'hierarchy' | 'languages'>('hierarchy');
let selectedAreaId = $state<string | null>(null);
let selectedNicheId = $state<string | null>(null);

const tabOptions = $derived([
  { value: 'hierarchy', label: t('admin.skills.hierarchy') },
  { value: 'languages', label: t('admin.skills.languages') },
]);

// --- Queries ---
const areasQuery = createAdminTechAreasFindAll(
  () => ({ pageSize: 100 }),
  () => ({ query: { enabled: browser && activeTab === 'hierarchy' } }),
);
const nichesQuery = createAdminTechNichesFindAll(
  () => ({ pageSize: 100, areaId: selectedAreaId ?? undefined }),
  () => ({ query: { enabled: browser && activeTab === 'hierarchy' && !!selectedAreaId } }),
);
const skillsQuery = createAdminTechSkillsFindAll(
  () => ({ pageSize: 100, nicheId: selectedNicheId ?? undefined }),
  () => ({ query: { enabled: browser && activeTab === 'hierarchy' && !!selectedNicheId } }),
);
const spokenQuery = createAdminSpokenLanguagesFindAll(
  () => ({ pageSize: 100 }),
  () => ({ query: { enabled: browser && activeTab === 'languages' } }),
);
const progQuery = createAdminProgrammingLanguagesFindAll(
  () => ({ pageSize: 100 }),
  () => ({ query: { enabled: browser && activeTab === 'languages' } }),
);

const areas = $derived(areasQuery.data?.items);
const niches = $derived(nichesQuery.data?.items);
const skills = $derived(skillsQuery.data?.items);
const spokenLangs = $derived(spokenQuery.data?.items);
const progLangs = $derived(progQuery.data?.items);

// --- Delete ---
let deleteTarget = $state<{ type: string; id: string } | null>(null);
let deleteLoading = $state(false);

// --- Form modal ---
type FormType = 'area' | 'niche' | 'skill' | 'spoken' | 'programming';
let formModal = $state<{ type: FormType; mode: 'create' | 'edit'; id?: string } | null>(null);
let formLoading = $state(false);
let formNameEn = $state('');
let formNamePtBr = $state('');
let formSlug = $state('');
let formCode = $state('');
let formIcon = $state('');
let formColor = $state('');
let formOrder = $state('0');
let formNameEs = $state('');
let formNativeName = $state('');

function jsonBody(data: Record<string, unknown>): RequestInit {
  return { body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } };
}

function openCreate(type: FormType) {
  formModal = { type, mode: 'create' };
  formNameEn = '';
  formNamePtBr = '';
  formSlug = '';
  formCode = '';
  formIcon = '';
  formColor = '';
  formOrder = '0';
  formNameEs = '';
  formNativeName = '';
}

function openEdit(type: FormType, item: Record<string, unknown>) {
  const id = String(type === 'spoken' ? item.code : type === 'programming' ? item.slug : item.id);
  formModal = { type, mode: 'edit', id };
  formNameEn = String(item.nameEn ?? '');
  formNamePtBr = String(item.namePtBr ?? '');
  formSlug = String(item.slug ?? '');
  formCode = String(item.code ?? '');
  formIcon = String(item.icon ?? '');
  formColor = String(item.color ?? '');
  formOrder = String(item.order ?? 0);
  formNameEs = String(item.nameEs ?? '');
  formNativeName = String(item.nativeName ?? '');
}

async function handleFormSubmit() {
  if (!formModal) return;
  formLoading = true;
  try {
    if (formModal.type === 'area') {
      const data = {
        nameEn: formNameEn,
        namePtBr: formNamePtBr,
        icon: formIcon || undefined,
        color: formColor || undefined,
        order: Number(formOrder),
      };
      if (formModal.mode === 'create') await adminTechAreasCreate(jsonBody(data));
      else await adminTechAreasUpdate(formModal.id!, jsonBody(data));
      queryClient.invalidateQueries({ queryKey: getAdminTechAreasFindAllQueryKey() });
    } else if (formModal.type === 'niche') {
      const data = {
        nameEn: formNameEn,
        namePtBr: formNamePtBr,
        areaId: selectedAreaId,
        order: Number(formOrder),
      };
      if (formModal.mode === 'create') await adminTechNichesCreate(jsonBody(data));
      else await adminTechNichesUpdate(formModal.id!, jsonBody(data));
      queryClient.invalidateQueries({ queryKey: getAdminTechNichesFindAllQueryKey() });
    } else if (formModal.type === 'skill') {
      const data = {
        nameEn: formNameEn,
        namePtBr: formNamePtBr,
        slug: formSlug,
        nicheId: selectedNicheId,
        order: Number(formOrder),
      };
      if (formModal.mode === 'create') await adminTechSkillsCreate(jsonBody(data));
      else await adminTechSkillsUpdate(formModal.id!, jsonBody(data));
      queryClient.invalidateQueries({ queryKey: getAdminTechSkillsFindAllQueryKey() });
    } else if (formModal.type === 'spoken') {
      const data = {
        code: formCode,
        nameEn: formNameEn,
        namePtBr: formNamePtBr,
        nameEs: formNameEs,
        nativeName: formNativeName,
      };
      if (formModal.mode === 'create') await adminSpokenLanguagesCreate(jsonBody(data));
      else await adminSpokenLanguagesUpdate(formModal.id!, jsonBody(data));
      queryClient.invalidateQueries({ queryKey: getAdminSpokenLanguagesFindAllQueryKey() });
    } else if (formModal.type === 'programming') {
      const data = { slug: formSlug, nameEn: formNameEn, namePtBr: formNamePtBr };
      if (formModal.mode === 'create') await adminProgrammingLanguagesCreate(jsonBody(data));
      else await adminProgrammingLanguagesUpdate(formModal.id!, jsonBody(data));
      queryClient.invalidateQueries({ queryKey: getAdminProgrammingLanguagesFindAllQueryKey() });
    }
    formModal = null;
  } finally {
    formLoading = false;
  }
}

async function handleToggleActive(type: FormType, item: Record<string, unknown>) {
  const newActive = !item.isActive;
  const id = String(item.id);
  if (type === 'area') {
    await adminTechAreasUpdate(id, jsonBody({ isActive: newActive }));
    queryClient.invalidateQueries({ queryKey: getAdminTechAreasFindAllQueryKey() });
  } else if (type === 'skill') {
    await adminTechSkillsUpdate(id, jsonBody({ isActive: newActive }));
    queryClient.invalidateQueries({ queryKey: getAdminTechSkillsFindAllQueryKey() });
  }
}

async function handleDelete() {
  if (!deleteTarget) return;
  deleteLoading = true;
  try {
    if (deleteTarget.type === 'area') {
      await adminTechAreasRemove(deleteTarget.id);
      queryClient.invalidateQueries({ queryKey: getAdminTechAreasFindAllQueryKey() });
      selectedAreaId = null;
    } else if (deleteTarget.type === 'niche') {
      await adminTechNichesRemove(deleteTarget.id);
      queryClient.invalidateQueries({ queryKey: getAdminTechNichesFindAllQueryKey() });
      selectedNicheId = null;
    } else if (deleteTarget.type === 'skill') {
      await adminTechSkillsRemove(deleteTarget.id);
      queryClient.invalidateQueries({ queryKey: getAdminTechSkillsFindAllQueryKey() });
    } else if (deleteTarget.type === 'spoken') {
      await adminSpokenLanguagesRemove(deleteTarget.id);
      queryClient.invalidateQueries({ queryKey: getAdminSpokenLanguagesFindAllQueryKey() });
    } else if (deleteTarget.type === 'programming') {
      await adminProgrammingLanguagesRemove(deleteTarget.id);
      queryClient.invalidateQueries({ queryKey: getAdminProgrammingLanguagesFindAllQueryKey() });
    }
  } finally {
    deleteLoading = false;
    deleteTarget = null;
  }
}

const formTitle = $derived(
  formModal ? `${formModal.mode === 'create' ? 'Add' : 'Edit'} ${formModal.type}` : '',
);
</script>

<svelte:head>
	<title>{t('admin.skills.title')}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">{t('admin.skills.title')}</h1>
		<div class="flex flex-wrap items-center gap-2">
			<ExportButton data={activeTab === 'hierarchy' ? [...(areas ?? []), ...(niches ?? []), ...(skills ?? [])] : [...(spokenLangs ?? []), ...(progLangs ?? [])]} filename="skills.csv" />
			<SegmentToggle options={tabOptions} selected={activeTab} onchange={(v) => { activeTab = v as 'hierarchy' | 'languages'; selectedAreaId = null; selectedNicheId = null; }} />
		</div>
	</div>

	{#if activeTab === 'hierarchy'}
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
			<!-- Areas -->
			<div class="rounded-xl border bg-white dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700/50">
				<div class="flex items-center justify-between border-b px-4 py-3 border-gray-200 dark:border-neutral-700/50">
					<span class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">{t('admin.skills.areas')}</span>
					<Button variant="icon" size="xs" onclick={() => openCreate('area')}><Plus size={14} /></Button>
				</div>
				<div class="max-h-[60vh] sm:max-h-[500px] overflow-y-auto">
					{#if areasQuery.isLoading}
						<div class="flex justify-center py-8"><Loader2 size={16} class="animate-spin text-gray-500 dark:text-neutral-500" /></div>
					{:else}
						{#each areas ?? [] as area}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => { selectedAreaId = area.id; selectedNicheId = null; }}
								onkeydown={(e) => { if (e.key === 'Enter') { selectedAreaId = area.id; selectedNicheId = null; } }}
								role="button" tabindex="0"
								class="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm transition-colors text-gray-800 dark:text-neutral-200 {selectedAreaId === area.id ? 'bg-gray-100 dark:bg-neutral-700' : 'hover:bg-gray-50 dark:hover:bg-neutral-700/50'}"
							>
								<div>
									<span>{area.nameEn}</span>
									<span class="ml-2 text-xs text-gray-500 dark:text-neutral-500">{area.namePtBr}</span>
								</div>
								<div class="flex items-center gap-1">
									<Button variant="icon" size="xs" onclick={(e) => { e.stopPropagation(); handleToggleActive('area', area); }}>
										{#if area.isActive}<ToggleRight size={14} class="text-emerald-500" />{:else}<ToggleLeft size={14} class="text-gray-500 dark:text-neutral-500" />{/if}
									</Button>
									<Button variant="icon" size="xs" onclick={(e) => { e.stopPropagation(); openEdit('area', area); }}><Pencil size={12} /></Button>
									<Button variant="ghost" intent="danger" size="xs" onclick={(e) => { e.stopPropagation(); deleteTarget = { type: 'area', id: area.id }; }}><Trash2 size={12} /></Button>
								</div>
							</div>
						{/each}
						{#if !areas?.length}<p class="px-4 py-8 text-center text-xs text-gray-500 dark:text-neutral-500">{t('admin.skills.noItems')}</p>{/if}
					{/if}
				</div>
			</div>

			<!-- Niches -->
			<div class="rounded-xl border bg-white dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700/50">
				<div class="flex items-center justify-between border-b px-4 py-3 border-gray-200 dark:border-neutral-700/50">
					<span class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">{t('admin.skills.niches')}</span>
					{#if selectedAreaId}<Button variant="icon" size="xs" onclick={() => openCreate('niche')}><Plus size={14} /></Button>{/if}
				</div>
				<div class="max-h-[500px] overflow-y-auto">
					{#if !selectedAreaId}
						<p class="px-4 py-8 text-center text-xs text-gray-500 dark:text-neutral-500">Select an area</p>
					{:else if nichesQuery.isLoading}
						<div class="flex justify-center py-8"><Loader2 size={16} class="animate-spin text-gray-500 dark:text-neutral-500" /></div>
					{:else}
						{#each niches ?? [] as niche}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => selectedNicheId = niche.id}
								onkeydown={(e) => { if (e.key === 'Enter') selectedNicheId = niche.id; }}
								role="button" tabindex="0"
								class="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm transition-colors text-gray-800 dark:text-neutral-200 {selectedNicheId === niche.id ? 'bg-gray-100 dark:bg-neutral-700' : 'hover:bg-gray-50 dark:hover:bg-neutral-700/50'}"
							>
								<div><span>{niche.nameEn}</span><span class="ml-2 text-xs text-gray-500 dark:text-neutral-500">{niche.namePtBr}</span></div>
								<div class="flex items-center gap-1">
									<Button variant="icon" size="xs" onclick={(e) => { e.stopPropagation(); openEdit('niche', niche); }}><Pencil size={12} /></Button>
									<Button variant="ghost" intent="danger" size="xs" onclick={(e) => { e.stopPropagation(); deleteTarget = { type: 'niche', id: niche.id }; }}><Trash2 size={12} /></Button>
								</div>
							</div>
						{/each}
						{#if !niches?.length}<p class="px-4 py-8 text-center text-xs text-gray-500 dark:text-neutral-500">{t('admin.skills.noItems')}</p>{/if}
					{/if}
				</div>
			</div>

			<!-- Skills -->
			<div class="rounded-xl border bg-white dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700/50">
				<div class="flex items-center justify-between border-b px-4 py-3 border-gray-200 dark:border-neutral-700/50">
					<span class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">{t('admin.skills.skillsList')}</span>
					{#if selectedNicheId}<Button variant="icon" size="xs" onclick={() => openCreate('skill')}><Plus size={14} /></Button>{/if}
				</div>
				<div class="max-h-[500px] overflow-y-auto">
					{#if !selectedNicheId}
						<p class="px-4 py-8 text-center text-xs text-gray-500 dark:text-neutral-500">Select a niche</p>
					{:else if skillsQuery.isLoading}
						<div class="flex justify-center py-8"><Loader2 size={16} class="animate-spin text-gray-500 dark:text-neutral-500" /></div>
					{:else}
						{#each skills ?? [] as skill}
							<div class="flex items-center justify-between px-4 py-2.5 text-sm text-gray-800 dark:text-neutral-200">
								<div><span>{skill.nameEn}</span><span class="ml-2 text-xs text-gray-500 dark:text-neutral-500">{skill.namePtBr}</span></div>
								<div class="flex items-center gap-1">
									<Button variant="icon" size="xs" onclick={() => handleToggleActive('skill', skill)}>
										{#if skill.isActive}<ToggleRight size={14} class="text-emerald-500" />{:else}<ToggleLeft size={14} class="text-gray-500 dark:text-neutral-500" />{/if}
									</Button>
									<Button variant="icon" size="xs" onclick={() => openEdit('skill', skill)}><Pencil size={12} /></Button>
									<Button variant="ghost" intent="danger" size="xs" onclick={() => deleteTarget = { type: 'skill', id: skill.id }}><Trash2 size={12} /></Button>
								</div>
							</div>
						{/each}
						{#if !skills?.length}<p class="px-4 py-8 text-center text-xs text-gray-500 dark:text-neutral-500">{t('admin.skills.noItems')}</p>{/if}
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Spoken Languages -->
			<div class="rounded-xl border bg-white dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700/50">
				<div class="flex items-center justify-between border-b px-4 py-3 border-gray-200 dark:border-neutral-700/50">
					<span class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">{t('admin.skills.spokenLanguages')}</span>
					<Button variant="icon" size="xs" onclick={() => openCreate('spoken')}><Plus size={14} /></Button>
				</div>
				<div class="max-h-[400px] overflow-y-auto">
					{#if spokenQuery.isLoading}
						<div class="flex justify-center py-8"><Loader2 size={16} class="animate-spin text-gray-500 dark:text-neutral-500" /></div>
					{:else}
						{#each spokenLangs ?? [] as lang}
							<div class="flex items-center justify-between px-4 py-2.5 text-sm text-gray-800 dark:text-neutral-200">
								<div><span class="font-mono text-xs text-gray-500 dark:text-neutral-500">{lang.code}</span><span class="ml-2">{lang.nameEn}</span><span class="ml-1 text-xs text-gray-500 dark:text-neutral-500">{lang.namePtBr}</span></div>
								<div class="flex items-center gap-1">
									<Button variant="icon" size="xs" onclick={() => openEdit('spoken', lang)}><Pencil size={12} /></Button>
									<Button variant="ghost" intent="danger" size="xs" onclick={() => deleteTarget = { type: 'spoken', id: lang.code }}><Trash2 size={12} /></Button>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<!-- Programming Languages -->
			<div class="rounded-xl border bg-white dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700/50">
				<div class="flex items-center justify-between border-b px-4 py-3 border-gray-200 dark:border-neutral-700/50">
					<span class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">{t('admin.skills.programmingLanguages')}</span>
					<Button variant="icon" size="xs" onclick={() => openCreate('programming')}><Plus size={14} /></Button>
				</div>
				<div class="max-h-[400px] overflow-y-auto">
					{#if progQuery.isLoading}
						<div class="flex justify-center py-8"><Loader2 size={16} class="animate-spin text-gray-500 dark:text-neutral-500" /></div>
					{:else}
						{#each progLangs ?? [] as lang}
							<div class="flex items-center justify-between px-4 py-2.5 text-sm text-gray-800 dark:text-neutral-200">
								<div><span>{lang.nameEn}</span><span class="ml-2 text-xs text-gray-500 dark:text-neutral-500">{lang.namePtBr}</span></div>
								<div class="flex items-center gap-1">
									<Button variant="icon" size="xs" onclick={() => openEdit('programming', lang)}><Pencil size={12} /></Button>
									<Button variant="ghost" intent="danger" size="xs" onclick={() => deleteTarget = { type: 'programming', id: lang.slug }}><Trash2 size={12} /></Button>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Form Modal -->
<FormModal open={formModal !== null} title={formTitle} loading={formLoading} onSubmit={handleFormSubmit} onClose={() => formModal = null}>
	<div class="space-y-3">
		{#if formModal?.type === 'spoken'}
			<div><Label>Code *</Label><Input bind:value={formCode} placeholder="en" required disabled={formModal.mode === 'edit'} /></div>
			<div><Label>Name (EN) *</Label><Input bind:value={formNameEn} placeholder="English" required /></div>
			<div><Label>Name (PT) *</Label><Input bind:value={formNamePtBr} placeholder="Inglês" required /></div>
			<div><Label>Name (ES)</Label><Input bind:value={formNameEs} placeholder="Inglés" /></div>
			<div><Label>Native Name</Label><Input bind:value={formNativeName} placeholder="English" /></div>
		{:else if formModal?.type === 'programming'}
			<div><Label>Slug *</Label><Input bind:value={formSlug} placeholder="javascript" required disabled={formModal.mode === 'edit'} /></div>
			<div><Label>Name (EN) *</Label><Input bind:value={formNameEn} placeholder="JavaScript" required /></div>
			<div><Label>Name (PT) *</Label><Input bind:value={formNamePtBr} placeholder="JavaScript" required /></div>
		{:else if formModal?.type === 'skill'}
			<div><Label>Slug *</Label><Input bind:value={formSlug} placeholder="react" required /></div>
			<div><Label>Name (EN) *</Label><Input bind:value={formNameEn} placeholder="React" required /></div>
			<div><Label>Name (PT) *</Label><Input bind:value={formNamePtBr} placeholder="React" required /></div>
			<div><Label>Order</Label><Input bind:value={formOrder} type="number" /></div>
		{:else}
			<div><Label>Name (EN) *</Label><Input bind:value={formNameEn} placeholder="Development" required /></div>
			<div><Label>Name (PT) *</Label><Input bind:value={formNamePtBr} placeholder="Desenvolvimento" required /></div>
			<div><Label>Icon</Label><Input bind:value={formIcon} placeholder="code" /></div>
			<div><Label>Color</Label><Input bind:value={formColor} placeholder="#3B82F6" /></div>
			<div><Label>Order</Label><Input bind:value={formOrder} type="number" /></div>
		{/if}
	</div>
</FormModal>

<ConfirmModal open={deleteTarget !== null} title="Delete Item" message={t('admin.skills.confirmDelete')} loading={deleteLoading} onConfirm={handleDelete} onClose={() => deleteTarget = null} />
