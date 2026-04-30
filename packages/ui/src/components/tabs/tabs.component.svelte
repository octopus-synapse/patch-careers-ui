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

let tablistEl = $state<HTMLDivElement | null>(null);

function handleKeydown(e: KeyboardEvent) {
  const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
  if (!keys.includes(e.key)) return;

  const currentIdx = tabs.findIndex((t) => t.value === selected);
  if (currentIdx === -1) return;

  let nextIdx = currentIdx;
  if (e.key === 'ArrowLeft') nextIdx = currentIdx === 0 ? tabs.length - 1 : currentIdx - 1;
  else if (e.key === 'ArrowRight') nextIdx = (currentIdx + 1) % tabs.length;
  else if (e.key === 'Home') nextIdx = 0;
  else if (e.key === 'End') nextIdx = tabs.length - 1;

  if (nextIdx === currentIdx) return;
  const nextTab = tabs[nextIdx];
  if (!nextTab) return;
  e.preventDefault();
  const nextValue = nextTab.value;
  onchange(nextValue);
  // Move focus to the newly-selected tab so roving tabindex keeps the user
  // on the active element.
  queueMicrotask(() => {
    const btn = tablistEl?.querySelector<HTMLButtonElement>(
      `button[data-tab-value="${CSS.escape(nextValue)}"]`,
    );
    btn?.focus();
  });
}
</script>

<div
	bind:this={tablistEl}
	class="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-gray-200 dark:border-neutral-800"
	role="tablist"
	tabindex="-1"
	onkeydown={handleKeydown}
>
	{#each tabs as tab}
		{@const active = tab.value === selected}
		<button
			type="button"
			role="tab"
			aria-selected={active}
			tabindex={active ? 0 : -1}
			data-tab-value={tab.value}
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
