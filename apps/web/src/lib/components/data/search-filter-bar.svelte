<script lang="ts">
import { Search } from 'lucide-svelte';
import { Input } from 'ui';

type FilterOption = {
  value: string;
  label: string;
};

type FilterDef = {
  key: string;
  label: string;
  options: FilterOption[];
  value: string;
};

type Props = {
  search: string;
  filters?: FilterDef[];
  placeholder?: string;
  onsearch: (value: string) => void;
  onfilterchange?: (key: string, value: string) => void;
};

let { search, filters = [], placeholder = 'Search...', onsearch, onfilterchange }: Props = $props();

let debounceTimer: ReturnType<typeof setTimeout>;

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => onsearch(target.value), 300);
}
</script>

<div class="flex flex-wrap items-end gap-3">
	<div class="relative min-w-0 sm:min-w-[200px] flex-1">
		<Search size={14} class="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500" />
		<Input
			value={search}
			oninput={handleInput}
			{placeholder}
			class="pl-5"
		/>
	</div>

	{#each filters as filter}
		<select
			value={filter.value}
			onchange={(e) => onfilterchange?.(filter.key, (e.target as HTMLSelectElement).value)}
			class="rounded-lg border px-3 py-1.5 text-xs outline-none bg-white border-gray-200 text-gray-800 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
		>
			<option value="">{filter.label}</option>
			{#each filter.options as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	{/each}
</div>
