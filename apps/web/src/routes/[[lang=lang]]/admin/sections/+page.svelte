<script lang="ts">
	import {
		createAdminSectionTypesFindAll,
		adminSectionTypesCreate,
		adminSectionTypesUpdate,
		adminSectionTypesRemove,
		getAdminSectionTypesFindAllQueryKey,
	} from 'api-client';
	import type { SectionTypeListDataDtoItemsItem } from 'api-client';
	import { browser } from '$app/environment';
	import { locale } from '$lib/locale.svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-svelte';
	import { Button, Input, Label, Tooltip, ConfirmModal, FormModal } from 'ui';
	import DataTable from '$lib/components/admin/data-table.svelte';
	import SearchFilterBar from '$lib/components/admin/search-filter-bar.svelte';
	import Pagination from '$lib/components/admin/pagination.svelte';
	import ExportButton from '$lib/components/admin/export-button.svelte';

	const t = $derived(locale.t);
	const queryClient = useQueryClient();

	let page = $state(1);
	let search = $state('');

	const sectionsQuery = createAdminSectionTypesFindAll(() => ({
		page,
		pageSize: 20,
		search: search || undefined,
	}), () => ({
		query: { enabled: browser }
	}));

	const sections = $derived(sectionsQuery.data?.items);
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
		formKey = ''; formSlug = ''; formTitle = ''; formDescription = '';
		formSemanticKind = ''; formIsActive = true; formIsRepeatable = true; formVersion = '1';
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
				await adminSectionTypesCreate(jsonBody({ ...data, key: formKey, version: Number(formVersion) }));
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
		} finally { deleteLoading = false; deleteKey = null; }
	}

	const columns = [
		{ key: 'key', label: 'Key' },
		{ key: 'title', label: 'Title' },
		{ key: 'semanticKind', label: 'Kind' },
		{ key: 'isActive', label: 'Active', width: '80px' },
		{ key: 'isSystem', label: 'System', width: '80px' },
		{ key: 'actions', label: '', width: '120px' },
	];
</script>

<svelte:head>
	<title>Section Types</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">Section Types</h1>
		<div class="flex items-center gap-2">
			<ExportButton data={sections} filename="section-types.csv" />
			<Button variant="solid" size="sm" onclick={openCreate}>
				<Plus size={14} /> Add
			</Button>
		</div>
	</div>

	<SearchFilterBar
		{search}
		placeholder="Search by key, title, or slug..."
		onsearch={(v) => { search = v; page = 1; }}
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
							<Button variant="danger" size="xs" onclick={() => deleteKey = row.key}><Trash2 size={14} /></Button>
						</Tooltip>
					{/if}
				</div>
			{:else}
				{value ?? '—'}
			{/if}
		{/snippet}
	</DataTable>

	{#if totalPages && totalPages > 1}
		<div class="flex justify-center">
			<Pagination {page} {totalPages} onpagechange={(p) => page = p} />
		</div>
	{/if}
</div>

<FormModal open={formModal !== null} title={formModal?.mode === 'create' ? 'Add Section Type' : 'Edit Section Type'} loading={formLoading} onSubmit={handleFormSubmit} onClose={() => formModal = null}>
	<div class="space-y-3">
		<div><Label>Key *</Label><Input bind:value={formKey} placeholder="work_experience_v1" required disabled={formModal?.mode === 'edit'} /></div>
		<div><Label>Slug *</Label><Input bind:value={formSlug} placeholder="work-experience" required /></div>
		<div><Label>Title *</Label><Input bind:value={formTitle} placeholder="Work Experience" required /></div>
		<div><Label>Description</Label><Input bind:value={formDescription} placeholder="Professional experience section" /></div>
		<div class="grid grid-cols-2 gap-3">
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
