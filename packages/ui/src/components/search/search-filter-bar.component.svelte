<script lang="ts">
import { ChevronDown, Search, X } from 'lucide-svelte';
import Button from '../button/button.component.svelte';
import Dropdown from '../dropdown/dropdown.component.svelte';
import Input from '../input/input.component.svelte';

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
  searchFields?: string[];
  onsearch: (value: string, field?: string) => void;
  onfilterchange?: (key: string, value: string) => void;
  onsearchfield?: (field: string, value: string) => void;
};

let {
  search,
  filters = [],
  placeholder = 'Search...',
  searchFields,
  onsearch,
  onfilterchange,
  onsearchfield,
}: Props = $props();

let debounceTimer: ReturnType<typeof setTimeout>;
let detectedField = $state<string | null>(null);
let openFilterKey = $state<string | null>(null);

function parseQuery(raw: string): { field: string | null; value: string } {
  if (!searchFields || searchFields.length === 0) return { field: null, value: raw };
  const match = raw.match(/^([a-zA-Z_]+):(.*)$/);
  if (!match) return { field: null, value: raw };
  const [, rawField, rawValue] = match;
  if (rawField === undefined || rawValue === undefined) return { field: null, value: raw };
  const field = rawField.toLowerCase();
  if (!searchFields.includes(field)) return { field: null, value: raw };
  return { field, value: rawValue.trim() };
}

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const { field, value } = parseQuery(target.value);
    detectedField = field;
    if (field && onsearchfield) {
      onsearchfield(field, value);
    } else {
      onsearch(value, field ?? undefined);
    }
  }, 300);
}

function clearField() {
  detectedField = null;
  onsearch('');
}
</script>

<div class="flex flex-wrap items-end gap-3">
	<div class="relative min-w-0 sm:min-w-[200px] flex-1">
		<Search size={14} class="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500" />
		<Input
			value={search}
			oninput={handleInput}
			{placeholder}
			class="pl-5 {detectedField ? 'pr-20' : ''}"
		/>
		{#if detectedField}
			<span class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
				{detectedField}
				<button type="button" onclick={clearField} aria-label="Clear search field">
					<X size={10} />
				</button>
			</span>
		{/if}
	</div>

	{#each filters as filter}
		{@const selectedOption = filter.options.find((o) => o.value === filter.value)}
		{@const isOpen = openFilterKey === filter.key}
		<Dropdown open={isOpen} onclose={() => { if (openFilterKey === filter.key) openFilterKey = null; }}>
			{#snippet trigger()}
				<button
					type="button"
					onclick={() => (openFilterKey = isOpen ? null : filter.key)}
					aria-haspopup="menu"
					aria-expanded={isOpen}
					class="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs outline-none bg-white border-gray-200 text-gray-800 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
				>
					<span>{selectedOption?.label ?? filter.label}</span>
					<ChevronDown size={12} class="opacity-60" />
				</button>
			{/snippet}

			<Button
				variant="menu"
				size="sm"
				intent="neutral"
				textCase="normal"
				selected={filter.value === ''}
				onclick={() => {
					onfilterchange?.(filter.key, '');
					openFilterKey = null;
				}}
			>
				{filter.label}
			</Button>
			{#each filter.options as option}
				<Button
					variant="menu"
					size="sm"
					intent="neutral"
					textCase="normal"
					selected={option.value === filter.value}
					onclick={() => {
						onfilterchange?.(filter.key, option.value);
						openFilterKey = null;
					}}
				>
					{option.label}
				</Button>
			{/each}
		</Dropdown>
	{/each}
</div>
