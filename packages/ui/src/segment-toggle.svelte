<script lang="ts">
	import type { ColorSchema } from './types';

	type Option = {
		value: string;
		label: string;
	};

	type Props = {
		options: Option[];
		selected: string;
		colorSchema?: ColorSchema;
		size?: 'sm' | 'md';
		onchange: (value: string) => void;
	};

	let { options, selected, colorSchema = 'light', size = 'sm', onchange }: Props = $props();

	const bg = { light: 'bg-gray-100', dark: 'bg-neutral-700/50' };
	const active = { light: 'bg-white shadow-sm', dark: 'bg-neutral-600' };
	const text = { light: 'text-gray-800', dark: 'text-neutral-200' };
	const muted = { light: 'text-gray-500', dark: 'text-neutral-500' };
	const sizeClass = { sm: 'px-2 py-0.5 text-[10px]', md: 'px-3 py-1 text-xs' };
</script>

<div class="flex rounded-md p-0.5 {bg[colorSchema]}">
	{#each options as option}
		<button
			onclick={() => onchange(option.value)}
			class="rounded font-semibold transition-all {sizeClass[size]} {selected === option.value ? active[colorSchema] + ' ' + text[colorSchema] : muted[colorSchema]}"
		>{option.label}</button>
	{/each}
</div>
