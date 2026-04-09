<script lang="ts">
	import type { ColorSchema } from 'ui';
	import FieldRenderer from './field-renderer.svelte';

	type Field = {
		key: string;
		type: string;
		label: string;
		required: boolean;
		options?: string[];
		widget?: string;
	};

	type Props = {
		fields: Field[];
		data: Record<string, string>;
		colorSchema?: ColorSchema;
		onupdate: (data: Record<string, string>) => void;
	};

	let { fields, data, colorSchema = 'light', onupdate }: Props = $props();

	function handleFieldChange(key: string, value: string) {
		onupdate({ ...data, [key]: value });
	}
</script>

<div class="space-y-5">
	{#each fields as field}
		<FieldRenderer
			{field}
			value={data[field.key] ?? ''}
			{colorSchema}
			onchange={(v) => handleFieldChange(field.key, v)}
		/>
	{/each}
</div>
