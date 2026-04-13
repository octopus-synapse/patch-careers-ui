<script lang="ts">
	import {
		createAdminTechAreasFindAll,
		createAdminTechNichesFindAll,
		createAdminTechSkillsFindAll,
		createAdminSpokenLanguagesFindAll,
		createAdminProgrammingLanguagesFindAll,
		adminTechAreasCreate,
		adminTechAreasUpdate,
		adminTechAreasRemove,
		adminTechNichesCreate,
		adminTechNichesUpdate,
		adminTechNichesRemove,
		adminTechSkillsCreate,
		adminTechSkillsUpdate,
		adminTechSkillsRemove,
		adminSpokenLanguagesCreate,
		adminSpokenLanguagesUpdate,
		adminSpokenLanguagesRemove,
		adminProgrammingLanguagesCreate,
		adminProgrammingLanguagesUpdate,
		adminProgrammingLanguagesRemove,
		getAdminTechAreasFindAllQueryKey,
		getAdminTechNichesFindAllQueryKey,
		getAdminTechSkillsFindAllQueryKey,
		getAdminSpokenLanguagesFindAllQueryKey,
		getAdminProgrammingLanguagesFindAllQueryKey,
	} from 'api-client';
	import { browser } from '$app/environment';
	import { colorSchema } from '$lib/color-schema.svelte';
	import { locale } from '$lib/locale.svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { SegmentToggle, Input } from 'ui';
	import { Loader2, Trash2, Pencil, Plus, ToggleLeft, ToggleRight } from 'lucide-svelte';
	import ConfirmModal from '$lib/components/admin/confirm-modal.svelte';
	import FormModal from '$lib/components/admin/form-modal.svelte';
	import ExportButton from '$lib/components/admin/export-button.svelte';

	const cs = $derived(colorSchema.mode);
	const t = $derived(locale.t);
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');
	const cardBg = $derived(cs === 'dark' ? 'bg-neutral-800/50' : 'bg-white');
	const cardBorder = $derived(cs === 'dark' ? 'border-neutral-700/50' : 'border-gray-200');
	const itemHover = $derived(cs === 'dark' ? 'hover:bg-neutral-700/50' : 'hover:bg-gray-50');
	const activeBg = $derived(cs === 'dark' ? 'bg-neutral-700' : 'bg-gray-100');
	const labelClass = $derived(`text-[10px] font-bold uppercase tracking-widest ${muted}`);
	const addBtnClass = $derived(cs === 'dark' ? 'text-neutral-400 hover:bg-neutral-700' : 'text-gray-500 hover:bg-gray-100');
	const queryClient = useQueryClient();

	let activeTab = $state<'hierarchy' | 'languages'>('hierarchy');
	let selectedAreaId = $state<string | null>(null);
	let selectedNicheId = $state<string | null>(null);

	const tabOptions = [
		{ value: 'hierarchy', label: t?.('admin.skills.hierarchy') ?? 'Hierarchy' },
		{ value: 'languages', label: t?.('admin.skills.languages') ?? 'Languages' },
	];

	// --- Queries ---
	const areasQuery = createAdminTechAreasFindAll(() => ({ pageSize: 100 }), () => ({ query: { enabled: browser && activeTab === 'hierarchy' } }));
	const nichesQuery = createAdminTechNichesFindAll(() => ({ pageSize: 100, areaId: selectedAreaId ?? undefined }), () => ({ query: { enabled: browser && activeTab === 'hierarchy' && !!selectedAreaId } }));
	const skillsQuery = createAdminTechSkillsFindAll(() => ({ pageSize: 100, nicheId: selectedNicheId ?? undefined }), () => ({ query: { enabled: browser && activeTab === 'hierarchy' && !!selectedNicheId } }));
	const spokenQuery = createAdminSpokenLanguagesFindAll(() => ({ pageSize: 100 }), () => ({ query: { enabled: browser && activeTab === 'languages' } }));
	const progQuery = createAdminProgrammingLanguagesFindAll(() => ({ pageSize: 100 }), () => ({ query: { enabled: browser && activeTab === 'languages' } }));

	const areas = $derived(((areasQuery.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.items as Record<string, unknown>[] ?? []);
	const niches = $derived(((nichesQuery.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.items as Record<string, unknown>[] ?? []);
	const skills = $derived(((skillsQuery.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.items as Record<string, unknown>[] ?? []);
	const spokenLangs = $derived(((spokenQuery.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.items as Record<string, unknown>[] ?? []);
	const progLangs = $derived(((progQuery.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.items as Record<string, unknown>[] ?? []);

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
		formNameEn = ''; formNamePtBr = ''; formSlug = ''; formCode = '';
		formIcon = ''; formColor = ''; formOrder = '0'; formNameEs = ''; formNativeName = '';
	}

	function openEdit(type: FormType, item: Record<string, unknown>) {
		const id = (type === 'spoken' ? item.code : type === 'programming' ? item.slug : item.id) as string;
		formModal = { type, mode: 'edit', id };
		formNameEn = (item.nameEn as string) ?? '';
		formNamePtBr = (item.namePtBr as string) ?? '';
		formSlug = (item.slug as string) ?? '';
		formCode = (item.code as string) ?? '';
		formIcon = (item.icon as string) ?? '';
		formColor = (item.color as string) ?? '';
		formOrder = String((item.order as number) ?? 0);
		formNameEs = (item.nameEs as string) ?? '';
		formNativeName = (item.nativeName as string) ?? '';
	}

	async function handleFormSubmit() {
		if (!formModal) return;
		formLoading = true;
		try {
			if (formModal.type === 'area') {
				const data = { nameEn: formNameEn, namePtBr: formNamePtBr, icon: formIcon || undefined, color: formColor || undefined, order: Number(formOrder) };
				if (formModal.mode === 'create') await adminTechAreasCreate(jsonBody(data));
				else await adminTechAreasUpdate(formModal.id!, jsonBody(data));
				queryClient.invalidateQueries({ queryKey: getAdminTechAreasFindAllQueryKey() });
			} else if (formModal.type === 'niche') {
				const data = { nameEn: formNameEn, namePtBr: formNamePtBr, areaId: selectedAreaId, order: Number(formOrder) };
				if (formModal.mode === 'create') await adminTechNichesCreate(jsonBody(data));
				else await adminTechNichesUpdate(formModal.id!, jsonBody(data));
				queryClient.invalidateQueries({ queryKey: getAdminTechNichesFindAllQueryKey() });
			} else if (formModal.type === 'skill') {
				const data = { nameEn: formNameEn, namePtBr: formNamePtBr, slug: formSlug, nicheId: selectedNicheId, order: Number(formOrder) };
				if (formModal.mode === 'create') await adminTechSkillsCreate(jsonBody(data));
				else await adminTechSkillsUpdate(formModal.id!, jsonBody(data));
				queryClient.invalidateQueries({ queryKey: getAdminTechSkillsFindAllQueryKey() });
			} else if (formModal.type === 'spoken') {
				const data = { code: formCode, nameEn: formNameEn, namePtBr: formNamePtBr, nameEs: formNameEs, nativeName: formNativeName };
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
		if (type === 'area') {
			await adminTechAreasUpdate(item.id as string, jsonBody({ isActive: newActive }));
			queryClient.invalidateQueries({ queryKey: getAdminTechAreasFindAllQueryKey() });
		} else if (type === 'skill') {
			await adminTechSkillsUpdate(item.id as string, jsonBody({ isActive: newActive }));
			queryClient.invalidateQueries({ queryKey: getAdminTechSkillsFindAllQueryKey() });
		}
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		deleteLoading = true;
		try {
			if (deleteTarget.type === 'area') { await adminTechAreasRemove(deleteTarget.id); queryClient.invalidateQueries({ queryKey: getAdminTechAreasFindAllQueryKey() }); selectedAreaId = null; }
			else if (deleteTarget.type === 'niche') { await adminTechNichesRemove(deleteTarget.id); queryClient.invalidateQueries({ queryKey: getAdminTechNichesFindAllQueryKey() }); selectedNicheId = null; }
			else if (deleteTarget.type === 'skill') { await adminTechSkillsRemove(deleteTarget.id); queryClient.invalidateQueries({ queryKey: getAdminTechSkillsFindAllQueryKey() }); }
			else if (deleteTarget.type === 'spoken') { await adminSpokenLanguagesRemove(deleteTarget.id); queryClient.invalidateQueries({ queryKey: getAdminSpokenLanguagesFindAllQueryKey() }); }
			else if (deleteTarget.type === 'programming') { await adminProgrammingLanguagesRemove(deleteTarget.id); queryClient.invalidateQueries({ queryKey: getAdminProgrammingLanguagesFindAllQueryKey() }); }
		} finally { deleteLoading = false; deleteTarget = null; }
	}

	const formTitle = $derived(formModal ? `${formModal.mode === 'create' ? 'Add' : 'Edit'} ${formModal.type}` : '');
</script>

<svelte:head>
	<title>{t?.('admin.skills.title') ?? 'Skills'}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-semibold tracking-tight {text}">{t?.('admin.skills.title') ?? 'Skills Catalog'}</h1>
		<div class="flex items-center gap-2">
			<ExportButton data={activeTab === 'hierarchy' ? [...areas, ...niches, ...skills] : [...spokenLangs, ...progLangs]} filename="skills.csv" colorSchema={cs} />
			<SegmentToggle options={tabOptions} selected={activeTab} colorSchema={cs} onchange={(v) => { activeTab = v as 'hierarchy' | 'languages'; selectedAreaId = null; selectedNicheId = null; }} />
		</div>
	</div>

	{#if activeTab === 'hierarchy'}
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
			<!-- Areas -->
			<div class="rounded-xl border {cardBg} {cardBorder}">
				<div class="flex items-center justify-between border-b px-4 py-3 {cardBorder}">
					<span class="text-[10px] font-bold uppercase tracking-widest {muted}">{t?.('admin.skills.areas') ?? 'Tech Areas'}</span>
					<button onclick={() => openCreate('area')} class="rounded p-1 transition-colors {addBtnClass}"><Plus size={14} /></button>
				</div>
				<div class="max-h-[500px] overflow-y-auto">
					{#if areasQuery.isLoading}
						<div class="flex justify-center py-8"><Loader2 size={16} class="animate-spin {muted}" /></div>
					{:else}
						{#each areas as area}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => { selectedAreaId = area.id as string; selectedNicheId = null; }}
								onkeydown={(e) => { if (e.key === 'Enter') { selectedAreaId = area.id as string; selectedNicheId = null; } }}
								role="button" tabindex="0"
								class="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm transition-colors {selectedAreaId === area.id ? activeBg : itemHover} {text}"
							>
								<div>
									<span>{area.nameEn}</span>
									<span class="ml-2 text-xs {muted}">{area.namePtBr}</span>
								</div>
								<div class="flex items-center gap-1">
									<button onclick={(e) => { e.stopPropagation(); handleToggleActive('area', area); }} class="transition-colors">
										{#if area.isActive}<ToggleRight size={14} class="text-emerald-500" />{:else}<ToggleLeft size={14} class={muted} />{/if}
									</button>
									<button onclick={(e) => { e.stopPropagation(); openEdit('area', area); }} class="rounded p-0.5 transition-colors {addBtnClass}"><Pencil size={12} /></button>
									<button onclick={(e) => { e.stopPropagation(); deleteTarget = { type: 'area', id: area.id as string }; }} class="rounded p-0.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={12} /></button>
								</div>
							</div>
						{/each}
						{#if areas.length === 0}<p class="px-4 py-8 text-center text-xs {muted}">{t?.('admin.skills.noItems') ?? 'No items'}</p>{/if}
					{/if}
				</div>
			</div>

			<!-- Niches -->
			<div class="rounded-xl border {cardBg} {cardBorder}">
				<div class="flex items-center justify-between border-b px-4 py-3 {cardBorder}">
					<span class="text-[10px] font-bold uppercase tracking-widest {muted}">{t?.('admin.skills.niches') ?? 'Tech Niches'}</span>
					{#if selectedAreaId}<button onclick={() => openCreate('niche')} class="rounded p-1 transition-colors {addBtnClass}"><Plus size={14} /></button>{/if}
				</div>
				<div class="max-h-[500px] overflow-y-auto">
					{#if !selectedAreaId}
						<p class="px-4 py-8 text-center text-xs {muted}">Select an area</p>
					{:else if nichesQuery.isLoading}
						<div class="flex justify-center py-8"><Loader2 size={16} class="animate-spin {muted}" /></div>
					{:else}
						{#each niches as niche}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								onclick={() => selectedNicheId = niche.id as string}
								onkeydown={(e) => { if (e.key === 'Enter') selectedNicheId = niche.id as string; }}
								role="button" tabindex="0"
								class="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm transition-colors {selectedNicheId === niche.id ? activeBg : itemHover} {text}"
							>
								<div><span>{niche.nameEn}</span><span class="ml-2 text-xs {muted}">{niche.namePtBr}</span></div>
								<div class="flex items-center gap-1">
									<button onclick={(e) => { e.stopPropagation(); openEdit('niche', niche); }} class="rounded p-0.5 transition-colors {addBtnClass}"><Pencil size={12} /></button>
									<button onclick={(e) => { e.stopPropagation(); deleteTarget = { type: 'niche', id: niche.id as string }; }} class="rounded p-0.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={12} /></button>
								</div>
							</div>
						{/each}
						{#if niches.length === 0}<p class="px-4 py-8 text-center text-xs {muted}">{t?.('admin.skills.noItems') ?? 'No items'}</p>{/if}
					{/if}
				</div>
			</div>

			<!-- Skills -->
			<div class="rounded-xl border {cardBg} {cardBorder}">
				<div class="flex items-center justify-between border-b px-4 py-3 {cardBorder}">
					<span class="text-[10px] font-bold uppercase tracking-widest {muted}">{t?.('admin.skills.skillsList') ?? 'Skills'}</span>
					{#if selectedNicheId}<button onclick={() => openCreate('skill')} class="rounded p-1 transition-colors {addBtnClass}"><Plus size={14} /></button>{/if}
				</div>
				<div class="max-h-[500px] overflow-y-auto">
					{#if !selectedNicheId}
						<p class="px-4 py-8 text-center text-xs {muted}">Select a niche</p>
					{:else if skillsQuery.isLoading}
						<div class="flex justify-center py-8"><Loader2 size={16} class="animate-spin {muted}" /></div>
					{:else}
						{#each skills as skill}
							<div class="flex items-center justify-between px-4 py-2.5 text-sm {text}">
								<div><span>{skill.nameEn}</span><span class="ml-2 text-xs {muted}">{skill.namePtBr}</span></div>
								<div class="flex items-center gap-1">
									<button onclick={() => handleToggleActive('skill', skill)} class="transition-colors">
										{#if skill.isActive}<ToggleRight size={14} class="text-emerald-500" />{:else}<ToggleLeft size={14} class={muted} />{/if}
									</button>
									<button onclick={() => openEdit('skill', skill)} class="rounded p-0.5 transition-colors {addBtnClass}"><Pencil size={12} /></button>
									<button onclick={() => deleteTarget = { type: 'skill', id: skill.id as string }} class="rounded p-0.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={12} /></button>
								</div>
							</div>
						{/each}
						{#if skills.length === 0}<p class="px-4 py-8 text-center text-xs {muted}">{t?.('admin.skills.noItems') ?? 'No items'}</p>{/if}
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Spoken Languages -->
			<div class="rounded-xl border {cardBg} {cardBorder}">
				<div class="flex items-center justify-between border-b px-4 py-3 {cardBorder}">
					<span class="text-[10px] font-bold uppercase tracking-widest {muted}">{t?.('admin.skills.spokenLanguages') ?? 'Spoken Languages'}</span>
					<button onclick={() => openCreate('spoken')} class="rounded p-1 transition-colors {addBtnClass}"><Plus size={14} /></button>
				</div>
				<div class="max-h-[400px] overflow-y-auto">
					{#if spokenQuery.isLoading}
						<div class="flex justify-center py-8"><Loader2 size={16} class="animate-spin {muted}" /></div>
					{:else}
						{#each spokenLangs as lang}
							<div class="flex items-center justify-between px-4 py-2.5 text-sm {text}">
								<div><span class="font-mono text-xs {muted}">{lang.code}</span><span class="ml-2">{lang.nameEn}</span><span class="ml-1 text-xs {muted}">{lang.namePtBr}</span></div>
								<div class="flex items-center gap-1">
									<button onclick={() => openEdit('spoken', lang)} class="rounded p-0.5 transition-colors {addBtnClass}"><Pencil size={12} /></button>
									<button onclick={() => deleteTarget = { type: 'spoken', id: lang.code as string }} class="rounded p-0.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={12} /></button>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<!-- Programming Languages -->
			<div class="rounded-xl border {cardBg} {cardBorder}">
				<div class="flex items-center justify-between border-b px-4 py-3 {cardBorder}">
					<span class="text-[10px] font-bold uppercase tracking-widest {muted}">{t?.('admin.skills.programmingLanguages') ?? 'Programming Languages'}</span>
					<button onclick={() => openCreate('programming')} class="rounded p-1 transition-colors {addBtnClass}"><Plus size={14} /></button>
				</div>
				<div class="max-h-[400px] overflow-y-auto">
					{#if progQuery.isLoading}
						<div class="flex justify-center py-8"><Loader2 size={16} class="animate-spin {muted}" /></div>
					{:else}
						{#each progLangs as lang}
							<div class="flex items-center justify-between px-4 py-2.5 text-sm {text}">
								<div><span>{lang.nameEn}</span><span class="ml-2 text-xs {muted}">{lang.namePtBr}</span></div>
								<div class="flex items-center gap-1">
									<button onclick={() => openEdit('programming', lang)} class="rounded p-0.5 transition-colors {addBtnClass}"><Pencil size={12} /></button>
									<button onclick={() => deleteTarget = { type: 'programming', id: lang.slug as string }} class="rounded p-0.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={12} /></button>
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
<FormModal open={formModal !== null} title={formTitle} loading={formLoading} colorSchema={cs} onsubmit={handleFormSubmit} oncancel={() => formModal = null}>
	<div class="space-y-3">
		{#if formModal?.type === 'spoken'}
			<div><label class={labelClass}>Code *</label><Input bind:value={formCode} placeholder="en" required colorSchema={cs} disabled={formModal.mode === 'edit'} /></div>
			<div><label class={labelClass}>Name (EN) *</label><Input bind:value={formNameEn} placeholder="English" required colorSchema={cs} /></div>
			<div><label class={labelClass}>Name (PT) *</label><Input bind:value={formNamePtBr} placeholder="Inglês" required colorSchema={cs} /></div>
			<div><label class={labelClass}>Name (ES)</label><Input bind:value={formNameEs} placeholder="Inglés" colorSchema={cs} /></div>
			<div><label class={labelClass}>Native Name</label><Input bind:value={formNativeName} placeholder="English" colorSchema={cs} /></div>
		{:else if formModal?.type === 'programming'}
			<div><label class={labelClass}>Slug *</label><Input bind:value={formSlug} placeholder="javascript" required colorSchema={cs} disabled={formModal.mode === 'edit'} /></div>
			<div><label class={labelClass}>Name (EN) *</label><Input bind:value={formNameEn} placeholder="JavaScript" required colorSchema={cs} /></div>
			<div><label class={labelClass}>Name (PT) *</label><Input bind:value={formNamePtBr} placeholder="JavaScript" required colorSchema={cs} /></div>
		{:else if formModal?.type === 'skill'}
			<div><label class={labelClass}>Slug *</label><Input bind:value={formSlug} placeholder="react" required colorSchema={cs} /></div>
			<div><label class={labelClass}>Name (EN) *</label><Input bind:value={formNameEn} placeholder="React" required colorSchema={cs} /></div>
			<div><label class={labelClass}>Name (PT) *</label><Input bind:value={formNamePtBr} placeholder="React" required colorSchema={cs} /></div>
			<div><label class={labelClass}>Order</label><Input bind:value={formOrder} type="number" colorSchema={cs} /></div>
		{:else}
			<div><label class={labelClass}>Name (EN) *</label><Input bind:value={formNameEn} placeholder="Development" required colorSchema={cs} /></div>
			<div><label class={labelClass}>Name (PT) *</label><Input bind:value={formNamePtBr} placeholder="Desenvolvimento" required colorSchema={cs} /></div>
			<div><label class={labelClass}>Icon</label><Input bind:value={formIcon} placeholder="code" colorSchema={cs} /></div>
			<div><label class={labelClass}>Color</label><Input bind:value={formColor} placeholder="#3B82F6" colorSchema={cs} /></div>
			<div><label class={labelClass}>Order</label><Input bind:value={formOrder} type="number" colorSchema={cs} /></div>
		{/if}
	</div>
</FormModal>

<ConfirmModal open={deleteTarget !== null} title="Delete Item" message={t?.('admin.skills.confirmDelete') ?? 'Are you sure?'} loading={deleteLoading} colorSchema={cs} onconfirm={handleDelete} oncancel={() => deleteTarget = null} />
