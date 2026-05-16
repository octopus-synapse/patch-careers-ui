<script lang="ts">
import { Check } from 'lucide-svelte';
import { untrack } from 'svelte';
import { locale } from '$lib/state/locale.svelte';

type ExtraOption = {
  id: string;
  label: string;
  description?: string;
  icon?: string;
};

type Props = {
  availableExtras: ExtraOption[];
  initialSelected: string[];
  onchange: (extras: string[]) => void;
};

let { availableExtras, initialSelected, onchange }: Props = $props();

const t = $derived(locale.t);

// Snapshot the initial selection once at mount; the parent owns the
// authoritative draft via `onchange`. Subsequent prop changes are
// intentionally ignored (the stepper resets the gate when the user
// navigates away and back).
let selected = $state<Set<string>>(new Set(untrack(() => initialSelected)));

function toggle(id: string) {
  // Mutate via cloned set so the reactive derivation re-runs (Svelte 5
  // tracks identity, not internal Set state).
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selected = next;
  onchange([...next]);
}
</script>

<div class="space-y-3">
	<p class="text-xs text-gray-500 dark:text-neutral-500">
		{t('onboarding.extrasGate.hint')}
	</p>

	<div class="space-y-2">
		{#each availableExtras as extra}
			{@const isSelected = selected.has(extra.id)}
			<button
				type="button"
				onclick={() => toggle(extra.id)}
				class="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all {isSelected ? 'border-gray-800 bg-gray-50 dark:border-neutral-200 dark:bg-neutral-800/60' : 'border-gray-200 bg-white hover:border-gray-300 dark:border-neutral-700 dark:bg-neutral-800/40 dark:hover:border-neutral-600'}"
				aria-pressed={isSelected}
			>
				<span class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-base dark:bg-neutral-900">
					{extra.icon ?? '➕'}
				</span>
				<span class="flex-1 min-w-0">
					<span class="block text-sm font-semibold text-gray-900 dark:text-neutral-100">{extra.label}</span>
					{#if extra.description}
						<span class="mt-0.5 block text-xs text-gray-500 dark:text-neutral-400">{extra.description}</span>
					{/if}
				</span>
				<span
					class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-colors {isSelected ? 'border-gray-800 bg-gray-800 dark:border-neutral-200 dark:bg-neutral-200' : 'border-gray-300 dark:border-neutral-600'}"
				>
					{#if isSelected}
						<Check size={11} class="text-white dark:text-neutral-900" strokeWidth={3} />
					{/if}
				</span>
			</button>
		{/each}
	</div>

	{#if availableExtras.length === 0}
		<p class="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-xs text-gray-500 dark:border-neutral-700 dark:text-neutral-500">
			{t('onboarding.extrasGate.empty')}
		</p>
	{/if}
</div>
