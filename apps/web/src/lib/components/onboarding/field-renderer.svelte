<script lang="ts">
	import { Input, Label } from 'ui';
	import type { ColorSchema } from 'ui';

	type Field = {
		key: string;
		type: string;
		label: string;
		required: boolean;
		options?: string[];
		widget?: string;
		examples?: string[];
	};

	type Props = {
		field: Field;
		value: string;
		colorSchema?: ColorSchema;
		onchange: (value: string) => void;
	};

	let { field, value, colorSchema = 'light', onchange }: Props = $props();

	const muted = $derived(colorSchema === 'dark' ? 'text-neutral-500' : 'text-gray-400');

	const selectStyles = {
		light: 'border-gray-300 text-gray-900 focus:border-gray-900',
		dark: 'border-neutral-700 text-neutral-200 focus:border-neutral-200'
	};

	const textareaStyles = {
		light: 'border-gray-300 text-gray-900 placeholder:text-gray-500/50 focus:border-gray-900',
		dark: 'border-neutral-700 text-neutral-200 placeholder:text-neutral-500/50 focus:border-neutral-200'
	};

	const examples = $derived(field.examples ?? []);
	let exampleIndex = $state(0);
	let focused = $state(false);
	const placeholder = $derived(
		focused || !examples.length ? '' : examples[exampleIndex % examples.length]
	);

	$effect(() => {
		if (!examples.length) return;
		const interval = setInterval(() => {
			exampleIndex = (exampleIndex + 1) % examples.length;
		}, 5000);
		return () => clearInterval(interval);
	});

	const isSummary = $derived(field.type === 'textarea' || field.widget === 'textarea');
	const summaryExamples = $derived(isSummary && examples.length ? examples : []);
	let showSummaryExamples = $state(false);

	function inputType(fieldType: string): string {
		if (fieldType === 'email') return 'email';
		if (fieldType === 'url') return 'url';
		if (fieldType === 'number') return 'number';
		if (fieldType === 'date') return 'date';
		return 'text';
	}
</script>

<div>
	<Label for={field.key} {colorSchema}>
		{field.label}
	</Label>

	{#if isSummary}
		<textarea
			id={field.key}
			{value}
			{placeholder}
			required={field.required}
			onfocus={() => (focused = true)}
			onblur={() => (focused = false)}
			oninput={(e) => onchange(e.currentTarget.value)}
			rows={3}
			class="w-full resize-none rounded-none border-b bg-transparent py-2 text-sm outline-none transition-all {textareaStyles[colorSchema]}"
		></textarea>
		{#if summaryExamples.length && !value}
			<button
				type="button"
				onclick={() => (showSummaryExamples = !showSummaryExamples)}
				class="mt-1 text-[10px] font-semibold uppercase tracking-widest underline transition-opacity hover:opacity-60 {muted}"
			>
				{showSummaryExamples ? 'hide' : 'see example'}
			</button>
			{#if showSummaryExamples}
				<div class="mt-2 space-y-2">
					{#each summaryExamples as example}
						<p class="text-[11px] leading-relaxed {muted}">{example}</p>
					{/each}
				</div>
			{/if}
		{/if}
	{:else if field.type === 'select' || (field.options && field.options.length > 0)}
		<select
			id={field.key}
			{value}
			required={field.required}
			onchange={(e) => onchange(e.currentTarget.value)}
			class="w-full rounded-none border-b bg-transparent py-2 text-sm outline-none transition-all {selectStyles[colorSchema]}"
		>
			<option value="">—</option>
			{#each field.options ?? [] as opt}
				<option value={opt}>{opt}</option>
			{/each}
		</select>
	{:else}
		<Input
			id={field.key}
			type={inputType(field.type)}
			{value}
			{placeholder}
			required={field.required}
			onfocus={() => (focused = true)}
			onblur={() => (focused = false)}
			oninput={(e) => onchange(e.currentTarget.value)}
			{colorSchema}
		/>
	{/if}
</div>
