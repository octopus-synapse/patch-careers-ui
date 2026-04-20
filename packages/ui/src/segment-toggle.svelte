<script lang="ts">
import Button from './button.svelte';

type Option = {
  value: string;
  label: string;
};

type Props = {
  options: Option[];
  selected: string;
  size?: 'xs' | 'sm';
  onchange: (value: string) => void;
};

let { options, selected, size = 'xs', onchange }: Props = $props();
</script>

<div class="flex rounded-md p-0.5 bg-gray-100 dark:bg-neutral-700/50">
	{#each options as option}
		<Button
			variant="tab"
			{size}
			selected={selected === option.value}
			onclick={() => onchange(option.value)}
		>
			{option.label}
		</Button>
	{/each}
</div>
