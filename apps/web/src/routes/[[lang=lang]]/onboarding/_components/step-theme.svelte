<script lang="ts">
import { Check, Shield } from 'lucide-svelte';
import { Badge } from 'ui';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

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
  onselect: (themeId: string) => void;
};

let { themes, selectedThemeId, onselect }: Props = $props();
</script>

<!--
  Layout split per the onboarding redesign: desktop renders a grid of
  template cards so the user can compare visually; mobile slides them
  horizontally with snap points so each card stays close to viewport
  width without forcing tiny thumbnails. `snap-x snap-mandatory` keeps
  the swipe gesture predictable.
-->
<div
	class="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-3"
>
	{#each themes as theme}
		{@const selected = theme.id === selectedThemeId}

		<button
			type="button"
			onclick={() => onselect(theme.id)}
			class="flex w-[78%] min-w-[78%] flex-shrink-0 snap-start flex-col overflow-hidden rounded-xl border bg-white text-left transition-all hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:bg-neutral-800/50 md:w-auto md:min-w-0 {selected ? 'border-gray-800 ring-1 ring-gray-800 dark:border-neutral-200 dark:ring-neutral-200' : 'border-gray-200 dark:border-neutral-700'}"
		>
			{#if theme.thumbnailUrl}
				<div class="aspect-[3/4] overflow-hidden border-b border-gray-200 bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900">
					<img
						src={theme.thumbnailUrl}
						alt={t('onboarding.theme.previewAlt', { name: theme.name })}
						class="h-full w-full object-cover"
						loading="lazy"
					/>
				</div>
			{/if}

			<div class="flex flex-1 flex-col gap-2 p-4">
				<div class="flex items-center justify-between gap-2">
					<span class="text-sm font-semibold text-gray-800 dark:text-neutral-200">{theme.name}</span>
					{#if selected}
						<Check size={14} class="text-gray-800 dark:text-neutral-200" />
					{/if}
				</div>

				{#if theme.description}
					<p class="line-clamp-2 text-[11px] text-gray-500 dark:text-neutral-500">{theme.description}</p>
				{/if}

				<div class="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
					{#if theme.atsScore}
						<Badge intent="success" size="md">
							<span class="inline-flex items-center gap-1">
								<Shield size={10} />
								ATS {theme.atsScore}
							</span>
						</Badge>
					{/if}
					{#if theme.tags?.length}
						{#each theme.tags.slice(0, 2) as tag}
							<Badge intent="neutral" size="sm">{tag}</Badge>
						{/each}
					{/if}
				</div>
			</div>
		</button>
	{/each}
</div>
