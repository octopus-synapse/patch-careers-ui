<script lang="ts">
	import Label from './label.svelte';
	import Input from './input.svelte';

	type Props = {
		label: string;
		id?: string;
		type?: string;
		value?: string;
		placeholder?: string;
		error?: string;
		required?: boolean;
		disabled?: boolean;
	};

	let {
		label,
		id,
		type = 'text',
		value = $bindable(''),
		placeholder,
		error,
		required,
		disabled,
	}: Props = $props();

	const fieldId = $derived(id ?? `field-${label.toLowerCase().replace(/\s+/g, '-')}`);
</script>

<div>
	<Label for={fieldId}>{label}{#if required} *{/if}</Label>
	<div class="mt-1">
		<Input {type} bind:value id={fieldId} {placeholder} {required} {disabled}
			class={error ? 'border-red-500 dark:border-red-400' : ''} />
	</div>
	{#if error}
		<span class="mt-1 block text-xs text-red-500 dark:text-red-400">{error}</span>
	{/if}
</div>
