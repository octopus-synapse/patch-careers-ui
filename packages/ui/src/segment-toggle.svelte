<script lang="ts">
	type Option = {
		value: string;
		label: string;
	};

	type Props = {
		options: Option[];
		selected: string;
		size?: 'sm' | 'md';
		onchange: (value: string) => void;
	};

	let { options, selected, size = 'sm', onchange }: Props = $props();

	const sizeClass = { sm: 'px-2 py-0.5 text-[10px]', md: 'px-3 py-1 text-xs' };
</script>

<div class="flex rounded-md p-0.5 bg-gray-100 dark:bg-neutral-700/50">
	{#each options as option}
		<button
			onclick={() => onchange(option.value)}
			class="rounded font-semibold transition-all {sizeClass[size]} {selected === option.value
				? 'bg-white shadow-sm text-gray-800 dark:bg-neutral-600 dark:text-neutral-200'
				: 'text-gray-500 dark:text-neutral-500'}"
		>{option.label}</button>
	{/each}
</div>
