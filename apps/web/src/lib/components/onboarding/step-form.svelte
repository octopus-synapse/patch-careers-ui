<script lang="ts">
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
		onupdate: (data: Record<string, string>) => void;
	};

	let { fields, data, onupdate }: Props = $props();

	function handleFieldChange(key: string, value: string) {
		onupdate({ ...data, [key]: value });
	}
</script>

<div class="space-y-5">
	{#each fields as field}
		<FieldRenderer
			{field}
			value={data[field.key] ?? ''}
			onchange={(v) => handleFieldChange(field.key, v)}
		/>
	{/each}
</div>
