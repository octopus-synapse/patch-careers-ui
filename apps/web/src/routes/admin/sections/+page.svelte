<script lang="ts">
	import {
		createAdminSectionTypesFindAll,
		adminSectionTypesCreate,
		adminSectionTypesUpdate,
		adminSectionTypesRemove,
		getAdminSectionTypesFindAllQueryKey,
	} from 'api-client';
	import { browser } from '$app/environment';
	import { colorSchema } from '$lib/color-schema.svelte';
	import { locale } from '$lib/locale.svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-svelte';
	import { Input } from 'ui';
	import DataTable from '$lib/components/admin/data-table.svelte';
	import SearchFilterBar from '$lib/components/admin/search-filter-bar.svelte';
	import Pagination from '$lib/components/admin/pagination.svelte';
	import ConfirmModal from '$lib/components/admin/confirm-modal.svelte';
	import FormModal from '$lib/components/admin/form-modal.svelte';
	import ExportButton from '$lib/components/admin/export-button.svelte';

	const cs = $derived(colorSchema.mode);
	const t = $derived(locale.t);
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');
	const labelClass = $derived(`text-[10px] font-bold uppercase tracking-widest ${muted}`);
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

	const rawData = $derived(((sectionsQuery.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined);
	const sections = $derived((rawData?.items as Record<string, unknown>[]) ?? []);
	const totalPages = $derived((rawData?.totalPages as number) ?? 1);

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

	function openEdit(section: Record<string, unknown>) {
		formModal = { mode: 'edit', key: section.key as string };
		formKey = (section.key as string) ?? '';
		formSlug = (section.slug as string) ?? '';
		formTitle = (section.title as string) ?? '';
		formDescription = (section.description as string) ?? '';
		formSemanticKind = (section.semanticKind as string) ?? '';
		formIsActive = (section.isActive as boolean) ?? true;
		formIsRepeatable = (section.isRepeatable as boolean) ?? true;
		formVersion = String((section.version as number) ?? 1);
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

	async function handleToggleActive(section: Record<string, unknown>) {
		await adminSectionTypesUpdate(section.key as string, jsonBody({ isActive: !section.isActive }));
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
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-semibold tracking-tight {text}">Section Types</h1>
		<div class="flex items-center gap-2">
			<ExportButton data={sections} filename="section-types.csv" colorSchema={cs} />
			<button onclick={openCreate} class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors {cs === 'dark' ? 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300' : 'bg-gray-800 text-gray-50 hover:bg-gray-700'}">
				<Plus size={14} /> Add
			</button>
		</div>
	</div>

	<SearchFilterBar
		{search}
		placeholder="Search by key, title, or slug..."
		colorSchema={cs}
		onsearch={(v) => { search = v; page = 1; }}
	/>

	<DataTable {columns} data={sections} loading={sectionsQuery.isLoading} emptyMessage="No section types" colorSchema={cs}>
		{#snippet cell({ row, key })}
			{#if key === 'isActive'}
				<button onclick={() => handleToggleActive(row)} class="transition-colors">
					{#if row.isActive}<ToggleRight size={18} class="text-emerald-500" />{:else}<ToggleLeft size={18} class={muted} />{/if}
				</button>
			{:else if key === 'isSystem'}
				<span class="text-xs {row.isSystem ? 'text-amber-500' : muted}">{row.isSystem ? 'Yes' : 'No'}</span>
			{:else if key === 'actions'}
				<div class="flex items-center gap-1">
					<button onclick={() => openEdit(row)} class="rounded p-1 transition-colors {cs === 'dark' ? 'hover:bg-neutral-700' : 'hover:bg-gray-100'} {muted}" title="Edit"><Pencil size={14} /></button>
					{#if !row.isSystem}
						<button onclick={() => deleteKey = row.key as string} class="rounded p-1 text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete"><Trash2 size={14} /></button>
					{/if}
				</div>
			{:else}
				{row[key] ?? '—'}
			{/if}
		{/snippet}
	</DataTable>

	{#if totalPages > 1}
		<div class="flex justify-center">
			<Pagination {page} {totalPages} colorSchema={cs} onpagechange={(p) => page = p} />
		</div>
	{/if}
</div>

<FormModal open={formModal !== null} title={formModal?.mode === 'create' ? 'Add Section Type' : 'Edit Section Type'} loading={formLoading} colorSchema={cs} onsubmit={handleFormSubmit} oncancel={() => formModal = null}>
	<div class="space-y-3">
		<div><label class={labelClass}>Key *</label><Input bind:value={formKey} placeholder="work_experience_v1" required colorSchema={cs} disabled={formModal?.mode === 'edit'} /></div>
		<div><label class={labelClass}>Slug *</label><Input bind:value={formSlug} placeholder="work-experience" required colorSchema={cs} /></div>
		<div><label class={labelClass}>Title *</label><Input bind:value={formTitle} placeholder="Work Experience" required colorSchema={cs} /></div>
		<div><label class={labelClass}>Description</label><Input bind:value={formDescription} placeholder="Professional experience section" colorSchema={cs} /></div>
		<div class="grid grid-cols-2 gap-3">
			<div><label class={labelClass}>Semantic Kind *</label><Input bind:value={formSemanticKind} placeholder="experience" required colorSchema={cs} /></div>
			{#if formModal?.mode === 'create'}
				<div><label class={labelClass}>Version</label><Input bind:value={formVersion} type="number" colorSchema={cs} /></div>
			{/if}
		</div>
		<div class="flex items-center gap-4">
			<label class="flex items-center gap-2 text-sm {text}"><input type="checkbox" bind:checked={formIsActive} class="rounded" /> Active</label>
			<label class="flex items-center gap-2 text-sm {text}"><input type="checkbox" bind:checked={formIsRepeatable} class="rounded" /> Repeatable</label>
		</div>
	</div>
</FormModal>

<ConfirmModal open={deleteKey !== null} title="Delete Section Type" message="Are you sure? This cannot be undone." loading={deleteLoading} colorSchema={cs} onconfirm={handleDelete} oncancel={() => deleteKey = null} />
