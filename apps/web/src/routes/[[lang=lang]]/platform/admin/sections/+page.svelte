<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import type { SectionTypeListDataDtoItemsItem } from 'api-client';
import {
  adminSectionTypesCreate,
  adminSectionTypesFindAll,
  adminSectionTypesRemove,
  adminSectionTypesUpdate,
  createAdminSectionTypesFindAll,
  getAdminSectionTypesFindAllQueryKey,
} from 'api-client';
import { Pencil, Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-svelte';
import { Button, ConfirmModal, FormModal, Input, Label, Tooltip } from 'ui';
import { browser } from '$app/environment';
import DataTable from '$lib/components/data/data-table.svelte';
import ExportButton from '$lib/components/data/export-button.svelte';
import Pagination from '$lib/components/data/pagination.svelte';
import SearchFilterBar from '$lib/components/data/search-filter-bar.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);
const queryClient = useQueryClient();

let page = $state(1);
let pageSize = $state(20);
let search = $state('');
let statusFilter = $state<'' | 'active' | 'inactive'>('');
let systemFilter = $state<'' | 'system' | 'user'>('');

const sectionsQuery = createAdminSectionTypesFindAll(
  () => ({
    page,
    pageSize,
    search: search || undefined,
    isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
  }),
  () => ({
    query: { enabled: browser },
  }),
);

const rawSections = $derived(sectionsQuery.data?.items);

async function fetchAllSectionsWithFilters(): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = [];
  let currentPage = 1;
  const batchSize = 100;
  while (true) {
    const result = await adminSectionTypesFindAll({
      page: currentPage,
      pageSize: batchSize,
      search: search || undefined,
      isActive:
        statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
    });
    const batch = (result.items ?? []) as Record<string, unknown>[];
    const filtered =
      systemFilter === 'system'
        ? batch.filter((s) => s.isSystem)
        : systemFilter === 'user'
          ? batch.filter((s) => !s.isSystem)
          : batch;
    all.push(...filtered);
    const totalPagesFetched = result.totalPages ?? 1;
    if (currentPage >= totalPagesFetched || batch.length === 0) break;
    currentPage += 1;
  }
  return all;
}
const sections = $derived(
  systemFilter === 'system'
    ? rawSections?.filter((s) => s.isSystem)
    : systemFilter === 'user'
      ? rawSections?.filter((s) => !s.isSystem)
      : rawSections,
);
const totalPages = $derived(sectionsQuery.data?.totalPages);

function jsonBody(data: Record<string, unknown>): RequestInit {
  return { body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } };
}

function invalidate() {
  queryClient.invalidateQueries({ queryKey: getAdminSectionTypesFindAllQueryKey() });
}

// --- Delete ---
let deleteKey = $state<string | null>(null);
let deleteLoading = $state(false);

// --- Form ---
let formModal = $state<{ mode: 'create' | 'edit'; key?: string } | null>(null);
let formLoading = $state(false);
let formKey = $state('');
let formSlug = $state('');
let formTitle = $state('');
let formDescription = $state('');
let formSemanticKind = $state('');
let formIsActive = $state(true);
let formIsRepeatable = $state(true);
let formVersion = $state('1');

function openCreate() {
  formModal = { mode: 'create' };
  formKey = '';
  formSlug = '';
  formTitle = '';
  formDescription = '';
  formSemanticKind = '';
  formIsActive = true;
  formIsRepeatable = true;
  formVersion = '1';
}

function openEdit(section: SectionTypeListDataDtoItemsItem) {
  formModal = { mode: 'edit', key: section.key };
  formKey = section.key;
  formSlug = section.slug;
  formTitle = section.title;
  formDescription = section.description ?? '';
  formSemanticKind = section.semanticKind;
  formIsActive = section.isActive;
  formIsRepeatable = section.isRepeatable;
  formVersion = String(section.version);
}

async function handleFormSubmit() {
  formLoading = true;
  try {
    const data: Record<string, unknown> = {
      slug: formSlug,
      title: formTitle,
      description: formDescription,
      semanticKind: formSemanticKind,
      isActive: formIsActive,
      isRepeatable: formIsRepeatable,
      definition: {},
      translations: {},
    };
    if (formModal?.mode === 'create') {
      await adminSectionTypesCreate(
        jsonBody({ ...data, key: formKey, version: Number(formVersion) }),
      );
    } else {
      await adminSectionTypesUpdate(formModal!.key!, jsonBody(data));
    }
    invalidate();
    formModal = null;
  } finally {
    formLoading = false;
  }
}

async function handleToggleActive(section: SectionTypeListDataDtoItemsItem) {
  await adminSectionTypesUpdate(section.key, jsonBody({ isActive: !section.isActive }));
  invalidate();
}

async function handleDelete() {
  if (!deleteKey) return;
  deleteLoading = true;
  try {
    await adminSectionTypesRemove(deleteKey);
    invalidate();
  } finally {
    deleteLoading = false;
    deleteKey = null;
  }
}

const columns = [
  { key: 'key', label: 'Key', sortable: true },
  { key: 'title', label: 'Title', sortable: true },
  { key: 'semanticKind', label: 'Kind', sortable: true, hideOnMobile: true },
  { key: 'isActive', label: 'Active', width: '80px' },
  { key: 'isSystem', label: 'System', width: '80px', hideOnMobile: true },
  { key: 'actions', label: '', width: '120px' },
];
</script>

<svelte:head>
	<title>Section Types</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">Section Types</h1>
		<div class="flex flex-wrap items-center gap-2">
			<ExportButton data={sections} filename="section-types.csv" fetchAll={fetchAllSectionsWithFilters} />
			<Button variant="solid" size="sm" onclick={openCreate}>
				<Plus size={14} /> Add
			</Button>
		</div>
	</div>

	<SearchFilterBar
		{search}
		placeholder="Search by key, title, or slug..."
		filters={[
			{
				key: 'status',
				label: 'All Statuses',
				options: [
					{ value: 'active', label: 'Active' },
					{ value: 'inactive', label: 'Inactive' },
				],
				value: statusFilter,
			},
			{
				key: 'system',
				label: 'All Types',
				options: [
					{ value: 'system', label: 'System' },
					{ value: 'user', label: 'User' },
				],
				value: systemFilter,
			},
		]}
		onsearch={(v) => { search = v; page = 1; }}
		onfilterchange={(key, value) => {
			if (key === 'status') statusFilter = value as '' | 'active' | 'inactive';
			if (key === 'system') systemFilter = value as '' | 'system' | 'user';
			page = 1;
		}}
	/>

	<DataTable {columns} data={sections} loading={sectionsQuery.isLoading} emptyMessage="No section types">
		{#snippet cell({ row, key, value })}
			{#if key === 'isActive'}
				<Button variant="icon" size="xs" onclick={() => handleToggleActive(row)}>
					{#if row.isActive}<ToggleRight size={18} class="text-emerald-500" />{:else}<ToggleLeft size={18} class="text-gray-500 dark:text-neutral-500" />{/if}
				</Button>
			{:else if key === 'isSystem'}
				<span class="text-xs {row.isSystem ? 'text-amber-500' : 'text-gray-500 dark:text-neutral-500'}">{row.isSystem ? 'Yes' : 'No'}</span>
			{:else if key === 'actions'}
				<div class="flex items-center gap-1">
					<Tooltip text="Edit">
						<Button variant="icon" size="xs" onclick={() => openEdit(row)}><Pencil size={14} /></Button>
					</Tooltip>
					{#if !row.isSystem}
						<Tooltip text="Delete">
							<Button variant="ghost" intent="danger" size="xs" onclick={() => deleteKey = row.key}><Trash2 size={14} /></Button>
						</Tooltip>
					{/if}
				</div>
			{:else}
				{value ?? '—'}
			{/if}
		{/snippet}
	</DataTable>

	{#if totalPages}
		<div class="flex justify-center">
			<Pagination
				{page}
				totalPages={totalPages ?? 1}
				onpagechange={(p) => page = p}
				{pageSize}
				pageSizeOptions={[10, 20, 50, 100]}
				onpagesizechange={(s) => { pageSize = s; page = 1; }}
			/>
		</div>
	{/if}
</div>

<FormModal open={formModal !== null} title={formModal?.mode === 'create' ? 'Add Section Type' : 'Edit Section Type'} loading={formLoading} onSubmit={handleFormSubmit} onClose={() => formModal = null}>
	<div class="space-y-3">
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			<div><Label>Key *</Label><Input bind:value={formKey} placeholder="work_experience_v1" required disabled={formModal?.mode === 'edit'} /></div>
			<div><Label>Slug *</Label><Input bind:value={formSlug} placeholder="work-experience" required /></div>
		</div>
		<div><Label>Title *</Label><Input bind:value={formTitle} placeholder="Work Experience" required /></div>
		<div><Label>Description</Label><Input bind:value={formDescription} placeholder="Professional experience section" /></div>
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			<div><Label>Semantic Kind *</Label><Input bind:value={formSemanticKind} placeholder="experience" required /></div>
			{#if formModal?.mode === 'create'}
				<div><Label>Version</Label><Input bind:value={formVersion} type="number" /></div>
			{/if}
		</div>
		<div class="flex items-center gap-4">
			<label class="flex items-center gap-2 text-sm text-gray-800 dark:text-neutral-200"><input type="checkbox" bind:checked={formIsActive} class="rounded" /> Active</label>
			<label class="flex items-center gap-2 text-sm text-gray-800 dark:text-neutral-200"><input type="checkbox" bind:checked={formIsRepeatable} class="rounded" /> Repeatable</label>
		</div>
	</div>
</FormModal>

<ConfirmModal open={deleteKey !== null} title="Delete Section Type" message="Are you sure? This cannot be undone." loading={deleteLoading} onConfirm={handleDelete} onClose={() => deleteKey = null} />
