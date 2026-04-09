<script lang="ts">
	import type { ColorSchema } from 'ui';
	import { Shield, Check } from 'lucide-svelte';

	type ThemeOption = {
		id: string;
		name: string;
		description?: string | null;
		category: string;
		tags: string[];
		atsScore?: number | null;
		thumbnailUrl?: string | null;
	};

	type Props = {
		themes: ThemeOption[];
		selectedThemeId: string;
		colorSchema?: ColorSchema;
		onselect: (themeId: string) => void;
	};

	let { themes, selectedThemeId, colorSchema = 'light', onselect }: Props = $props();

	const cs = colorSchema;
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');
	const cardBg = $derived(cs === 'dark' ? 'bg-neutral-800/50' : 'bg-white');
	const cardBorder = $derived(cs === 'dark' ? 'border-neutral-700' : 'border-gray-200');
	const cardSelected = $derived(cs === 'dark' ? 'border-neutral-200 ring-1 ring-neutral-200' : 'border-gray-800 ring-1 ring-gray-800');
	const badgeBg = $derived(cs === 'dark' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700');
	const tagBg = $derived(cs === 'dark' ? 'bg-neutral-700/50' : 'bg-gray-100');
	const previewBg = $derived(cs === 'dark' ? 'bg-neutral-700/30' : 'bg-gray-50');
</script>

<div class="flex flex-wrap justify-center gap-4">
	{#each themes as theme}
		{@const selected = theme.id === selectedThemeId}

		<button
			onclick={() => onselect(theme.id)}
			class="w-full max-w-xs overflow-hidden rounded-lg border text-left transition-all sm:w-64 {cardBg} {selected ? cardSelected : cardBorder}"
		>
			{#if theme.thumbnailUrl}
				<div class="overflow-hidden border-b {cardBorder}">
					<img
						src={theme.thumbnailUrl}
						alt="Preview of {theme.name}"
						class="w-full"
						loading="lazy"
					/>
				</div>
			{/if}

			<div class="p-4">
				<div class="flex items-center gap-2">
					<span class="text-sm font-semibold {text}">{theme.name}</span>
					{#if selected}
						<Check size={14} class={text} />
					{/if}
				</div>

				{#if theme.description}
					<p class="mt-1 line-clamp-2 text-[10px] {muted}">{theme.description}</p>
				{/if}

				{#if theme.atsScore}
					<div class="mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold {badgeBg}">
						<Shield size={11} />
						ATS {theme.atsScore}/100
					</div>
				{/if}

				{#if theme.tags?.length}
					<div class="mt-2 flex flex-wrap gap-1">
						{#each theme.tags.slice(0, 3) as tag}
							<span class="rounded px-1.5 py-0.5 text-[9px] {muted} {tagBg}">{tag}</span>
						{/each}
					</div>
				{/if}
			</div>
		</button>
	{/each}
</div>
