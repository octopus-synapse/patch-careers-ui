<script lang="ts">
import type { StatItem } from './stat-grid.types';

type Props = {
  title?: string;
  items: StatItem[];
  /** Desktop column count. Default 4. Mobile is always 2. */
  columns?: 2 | 3 | 4;
};

let { title, items, columns = 4 }: Props = $props();

const colClass = $derived(
  {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
  }[columns],
);
</script>

<section
	class="rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-800/50"
>
	{#if title}
		<h2 class="px-5 pt-4 pb-2 text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
			{title}
		</h2>
	{/if}
	<div class="grid grid-cols-2 gap-px border-t border-gray-200 bg-gray-200 dark:border-neutral-800 dark:bg-neutral-800 {colClass}">
		{#each items as item (item.label)}
			{#snippet cellBody()}
				<span class="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-neutral-500">
					{#if item.icon}
						{@const Icon = item.icon}
						<Icon size={12} />
					{/if}
					{item.label}
				</span>
				<span
					class="text-xl font-semibold tabular-nums {item.highlight
						? 'text-red-500 dark:text-red-400'
						: 'text-gray-900 dark:text-neutral-100'}"
				>
					{item.value}
				</span>
			{/snippet}
			{#if item.href}
				<a
					href={item.href}
					class="flex flex-col gap-1 bg-white px-4 py-3 transition-colors hover:bg-gray-50 dark:bg-neutral-800/50 dark:hover:bg-neutral-800"
				>
					{@render cellBody()}
				</a>
			{:else}
				<div class="flex flex-col gap-1 bg-white px-4 py-3 dark:bg-neutral-800/50">
					{@render cellBody()}
				</div>
			{/if}
		{/each}
	</div>
</section>
