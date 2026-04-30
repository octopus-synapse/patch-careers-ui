<script lang="ts">
import { Check, Shield } from 'lucide-svelte';
import { Badge } from 'ui';

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

<div class="flex flex-wrap justify-center gap-4">
	{#each themes as theme}
		{@const selected = theme.id === selectedThemeId}

		<button
			onclick={() => onselect(theme.id)}
			class="w-full max-w-xs overflow-hidden rounded-lg border text-left transition-all sm:w-64 bg-white dark:bg-neutral-800/50 {selected ? 'border-gray-800 ring-1 ring-gray-800 dark:border-neutral-200 dark:ring-1 dark:ring-neutral-200' : 'border-gray-200 dark:border-neutral-700'}"
		>
			{#if theme.thumbnailUrl}
				<div class="overflow-hidden border-b border-gray-200 dark:border-neutral-700">
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
					<span class="text-sm font-semibold text-gray-800 dark:text-neutral-200">{theme.name}</span>
					{#if selected}
						<Check size={14} class="text-gray-800 dark:text-neutral-200" />
					{/if}
				</div>

				{#if theme.description}
					<p class="mt-1 line-clamp-2 text-[10px] text-gray-500 dark:text-neutral-500">{theme.description}</p>
				{/if}

				{#if theme.atsScore}
					<div class="mt-3">
						<Badge intent="success" size="md">
							<span class="inline-flex items-center gap-1.5">
								<Shield size={11} />
								ATS {theme.atsScore}/100
							</span>
						</Badge>
					</div>
				{/if}

				{#if theme.tags?.length}
					<div class="mt-2 flex flex-wrap gap-1">
						{#each theme.tags.slice(0, 3) as tag}
							<Badge intent="neutral" size="sm">{tag}</Badge>
						{/each}
					</div>
				{/if}
			</div>
		</button>
	{/each}
</div>
