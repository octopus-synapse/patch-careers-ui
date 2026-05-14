<script lang="ts">
type Tab = {
  value: string;
  label: string;
  count?: number;
  /** Optional small badge text (e.g., "New") shown next to the label. */
  badge?: string;
};

/** `underline` keeps the legacy bottom-bar style. `glass-pill` is the
 *  premium feed treatment: a glass container with the active tab using
 *  the `.tab-active` utility from app.css. */
type TabsVariant = 'underline' | 'glass-pill';

type Props = {
  tabs: Tab[];
  selected: string;
  onchange: (value: string) => void;
  variant?: TabsVariant;
};

let { tabs, selected, onchange, variant = 'underline' }: Props = $props();

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

{#if variant === 'glass-pill'}
	<div
		bind:this={tablistEl}
		class="glass rounded-2xl p-1 grid"
		style:grid-template-columns="repeat({tabs.length}, minmax(0, 1fr))"
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
				class="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold whitespace-nowrap transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 {active
					? 'tab-active'
					: 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-200'}"
				onclick={() => onchange(tab.value)}
			>
				<span>{tab.label}</span>
				{#if tab.badge}
					<span class="rounded-full bg-blue-600 px-1.5 text-[9px] font-bold text-white">{tab.badge}</span>
				{/if}
				{#if tab.count !== undefined}
					<span
						class="inline-flex items-center justify-center rounded-full px-1.5 text-xs {active
							? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
							: 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-300'}"
					>
						{tab.count}
					</span>
				{/if}
			</button>
		{/each}
	</div>
{:else}
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
{/if}
