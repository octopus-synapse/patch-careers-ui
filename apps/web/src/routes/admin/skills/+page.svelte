<script lang="ts">
	import {
		createAdminTechAreasFindAll,
		createAdminTechNichesFindAll,
		createAdminTechSkillsFindAll,
		createAdminSpokenLanguagesFindAll,
		createAdminProgrammingLanguagesFindAll,
		adminTechAreasRemove,
		adminTechNichesRemove,
		adminTechSkillsRemove,
		adminSpokenLanguagesRemove,
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
	import { SegmentToggle } from 'ui';
	import { Loader2, Trash2, ToggleLeft, ToggleRight } from 'lucide-svelte';
	import ConfirmModal from '$lib/components/admin/confirm-modal.svelte';

	const cs = $derived(colorSchema.mode);
	const t = $derived(locale.t);
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');
	const cardBg = $derived(cs === 'dark' ? 'bg-neutral-800/50' : 'bg-white');
	const cardBorder = $derived(cs === 'dark' ? 'border-neutral-700/50' : 'border-gray-200');
	const itemHover = $derived(cs === 'dark' ? 'hover:bg-neutral-700/50' : 'hover:bg-gray-50');
	const activeBg = $derived(cs === 'dark' ? 'bg-neutral-700' : 'bg-gray-100');
	const queryClient = useQueryClient();

	let activeTab = $state<'hierarchy' | 'languages'>('hierarchy');
	let selectedAreaId = $state<string | null>(null);
	let selectedNicheId = $state<string | null>(null);

	const tabOptions = [
		{ value: 'hierarchy', label: t?.('admin.skills.hierarchy') ?? 'Hierarchy' },
		{ value: 'languages', label: t?.('admin.skills.languages') ?? 'Languages' },
	];

	// Hierarchy queries
	const areasQuery = createAdminTechAreasFindAll(() => ({ pageSize: 100 }), () => ({
		query: { enabled: browser && activeTab === 'hierarchy' }
	}));
	const nichesQuery = createAdminTechNichesFindAll(() => ({
		pageSize: 100,
		areaId: selectedAreaId ?? undefined,
	}), () => ({
		query: { enabled: browser && activeTab === 'hierarchy' && !!selectedAreaId }
	}));
	const skillsQuery = createAdminTechSkillsFindAll(() => ({
		pageSize: 100,
		nicheId: selectedNicheId ?? undefined,
	}), () => ({
		query: { enabled: browser && activeTab === 'hierarchy' && !!selectedNicheId }
	}));

	// Language queries
	const spokenQuery = createAdminSpokenLanguagesFindAll(() => ({ pageSize: 100 }), () => ({
		query: { enabled: browser && activeTab === 'languages' }
	}));
	const progQuery = createAdminProgrammingLanguagesFindAll(() => ({ pageSize: 100 }), () => ({
		query: { enabled: browser && activeTab === 'languages' }
	}));

	const areas = $derived(((areasQuery.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.items as Record<string, unknown>[] ?? []);
	const niches = $derived(((nichesQuery.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.items as Record<string, unknown>[] ?? []);
	const skills = $derived(((skillsQuery.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.items as Record<string, unknown>[] ?? []);
	const spokenLangs = $derived(((spokenQuery.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.items as Record<string, unknown>[] ?? []);
	const progLangs = $derived(((progQuery.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.items as Record<string, unknown>[] ?? []);

	let deleteTarget = $state<{ type: string; id: string } | null>(null);
	let deleteLoading = $state(false);

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
</script>

<svelte:head>
	<title>{t?.('admin.skills.title') ?? 'Skills'}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-semibold tracking-tight {text}">
			{t?.('admin.skills.title') ?? 'Skills Catalog'}
		</h1>
		<SegmentToggle
			options={tabOptions}
			selected={activeTab}
			colorSchema={cs}
			onchange={(v) => { activeTab = v as 'hierarchy' | 'languages'; selectedAreaId = null; selectedNicheId = null; }}
		/>
	</div>

	{#if activeTab === 'hierarchy'}
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
			<!-- Areas -->
			<div class="rounded-xl border {cardBg} {cardBorder}">
				<div class="border-b px-4 py-3 {cardBorder}">
					<span class="text-[10px] font-bold uppercase tracking-widest {muted}">
						{t?.('admin.skills.areas') ?? 'Tech Areas'}
					</span>
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
								role="button"
								tabindex="0"
								class="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm transition-colors {selectedAreaId === area.id ? activeBg : itemHover} {text}"
							>
								<div>
									<span>{area.nameEn}</span>
									<span class="ml-2 text-xs {muted}">{area.namePtBr}</span>
								</div>
								<div class="flex items-center gap-1">
									{#if area.isActive}
										<ToggleRight size={14} class="text-emerald-500" />
									{:else}
										<ToggleLeft size={14} class={muted} />
									{/if}
									<button onclick={(e) => { e.stopPropagation(); deleteTarget = { type: 'area', id: area.id as string }; }} class="rounded p-0.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
										<Trash2 size={12} />
									</button>
								</div>
							</div>
						{/each}
						{#if areas.length === 0}
							<p class="px-4 py-8 text-center text-xs {muted}">{t?.('admin.skills.noItems') ?? 'No items'}</p>
						{/if}
					{/if}
				</div>
			</div>

			<!-- Niches -->
			<div class="rounded-xl border {cardBg} {cardBorder}">
				<div class="border-b px-4 py-3 {cardBorder}">
					<span class="text-[10px] font-bold uppercase tracking-widest {muted}">
						{t?.('admin.skills.niches') ?? 'Tech Niches'}
					</span>
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
								role="button"
								tabindex="0"
								class="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm transition-colors {selectedNicheId === niche.id ? activeBg : itemHover} {text}"
							>
								<div>
									<span>{niche.nameEn}</span>
									<span class="ml-2 text-xs {muted}">{niche.namePtBr}</span>
								</div>
								<button onclick={(e) => { e.stopPropagation(); deleteTarget = { type: 'niche', id: niche.id as string }; }} class="rounded p-0.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
									<Trash2 size={12} />
								</button>
							</div>
						{/each}
						{#if niches.length === 0}
							<p class="px-4 py-8 text-center text-xs {muted}">{t?.('admin.skills.noItems') ?? 'No items'}</p>
						{/if}
					{/if}
				</div>
			</div>

			<!-- Skills -->
			<div class="rounded-xl border {cardBg} {cardBorder}">
				<div class="border-b px-4 py-3 {cardBorder}">
					<span class="text-[10px] font-bold uppercase tracking-widest {muted}">
						{t?.('admin.skills.skillsList') ?? 'Skills'}
					</span>
				</div>
				<div class="max-h-[500px] overflow-y-auto">
					{#if !selectedNicheId}
						<p class="px-4 py-8 text-center text-xs {muted}">Select a niche</p>
					{:else if skillsQuery.isLoading}
						<div class="flex justify-center py-8"><Loader2 size={16} class="animate-spin {muted}" /></div>
					{:else}
						{#each skills as skill}
							<div class="flex items-center justify-between px-4 py-2.5 text-sm {text}">
								<div>
									<span>{skill.nameEn}</span>
									<span class="ml-2 text-xs {muted}">{skill.namePtBr}</span>
								</div>
								<div class="flex items-center gap-1">
									{#if skill.isActive}
										<ToggleRight size={14} class="text-emerald-500" />
									{:else}
										<ToggleLeft size={14} class={muted} />
									{/if}
									<button onclick={() => deleteTarget = { type: 'skill', id: skill.id as string }} class="rounded p-0.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
										<Trash2 size={12} />
									</button>
								</div>
							</div>
						{/each}
						{#if skills.length === 0}
							<p class="px-4 py-8 text-center text-xs {muted}">{t?.('admin.skills.noItems') ?? 'No items'}</p>
						{/if}
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Spoken Languages -->
			<div class="rounded-xl border {cardBg} {cardBorder}">
				<div class="border-b px-4 py-3 {cardBorder}">
					<span class="text-[10px] font-bold uppercase tracking-widest {muted}">
						{t?.('admin.skills.spokenLanguages') ?? 'Spoken Languages'}
					</span>
				</div>
				<div class="max-h-[400px] overflow-y-auto">
					{#if spokenQuery.isLoading}
						<div class="flex justify-center py-8"><Loader2 size={16} class="animate-spin {muted}" /></div>
					{:else}
						{#each spokenLangs as lang}
							<div class="flex items-center justify-between px-4 py-2.5 text-sm {text}">
								<div>
									<span class="font-mono text-xs {muted}">{lang.code}</span>
									<span class="ml-2">{lang.nameEn}</span>
									<span class="ml-1 text-xs {muted}">{lang.namePtBr}</span>
								</div>
								<button onclick={() => deleteTarget = { type: 'spoken', id: lang.code as string }} class="rounded p-0.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
									<Trash2 size={12} />
								</button>
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<!-- Programming Languages -->
			<div class="rounded-xl border {cardBg} {cardBorder}">
				<div class="border-b px-4 py-3 {cardBorder}">
					<span class="text-[10px] font-bold uppercase tracking-widest {muted}">
						{t?.('admin.skills.programmingLanguages') ?? 'Programming Languages'}
					</span>
				</div>
				<div class="max-h-[400px] overflow-y-auto">
					{#if progQuery.isLoading}
						<div class="flex justify-center py-8"><Loader2 size={16} class="animate-spin {muted}" /></div>
					{:else}
						{#each progLangs as lang}
							<div class="flex items-center justify-between px-4 py-2.5 text-sm {text}">
								<div>
									<span>{lang.nameEn}</span>
									<span class="ml-2 text-xs {muted}">{lang.namePtBr}</span>
								</div>
								<button onclick={() => deleteTarget = { type: 'programming', id: lang.slug as string }} class="rounded p-0.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
									<Trash2 size={12} />
								</button>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<ConfirmModal
	open={deleteTarget !== null}
	title={t?.('admin.skills.confirmDelete') ?? 'Delete Item'}
	message={t?.('admin.skills.confirmDelete') ?? 'Are you sure you want to delete this item?'}
	loading={deleteLoading}
	colorSchema={cs}
	onconfirm={handleDelete}
	oncancel={() => deleteTarget = null}
/>
