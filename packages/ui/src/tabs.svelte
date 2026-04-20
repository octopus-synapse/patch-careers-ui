<script lang="ts">
type Tab = {
  value: string;
  label: string;
  count?: number;
};

type Props = {
  tabs: Tab[];
  selected: string;
  onchange: (value: string) => void;
};

let { tabs, selected, onchange }: Props = $props();
</script>

<div
	class="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-neutral-800"
	role="tablist"
>
	{#each tabs as tab}
		{@const active = tab.value === selected}
		<button
			type="button"
			role="tab"
			aria-selected={active}
			class="relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 {active
				? 'text-cyan-600 dark:text-cyan-400'
				: 'text-gray-500 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-200'}"
			onclick={() => onchange(tab.value)}
		>
			<span>{tab.label}</span>
			{#if tab.count !== undefined}
				<span
					class="ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 text-xs {active
						? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300'
						: 'bg-gray-100 text-gray-600 dark:bg-neutral-700 dark:text-neutral-300'}"
				>
					{tab.count}
				</span>
			{/if}
			{#if active}
				<span
					class="absolute inset-x-0 -bottom-px h-0.5 bg-cyan-600 dark:bg-cyan-400"
					aria-hidden="true"
				></span>
			{/if}
		</button>
	{/each}
</div>
