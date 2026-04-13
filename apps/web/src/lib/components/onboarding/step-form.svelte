<script lang="ts">
	import { customFetch } from 'api-client';
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

	let errors = $state<Record<string, string>>({});
	let validateTimeout: ReturnType<typeof setTimeout> | null = null;

	function handleFieldChange(key: string, value: string) {
		const newData = { ...data, [key]: value };
		onupdate(newData);

		if (validateTimeout) clearTimeout(validateTimeout);
		validateTimeout = setTimeout(async () => {
			try {
				const res = await customFetch<{ valid: boolean; errors: Record<string, string> }>(
					'/api/v1/onboarding/session/validate',
					{ method: 'POST', body: JSON.stringify({ data: newData }) }
				);
				errors = res.errors ?? {};
			} catch {
				errors = {};
			}
		}, 800);
	}
</script>

<div class="space-y-5">
	{#each fields as field}
		<FieldRenderer
			{field}
			value={data[field.key] ?? ''}
			error={errors[field.key]}
			onchange={(v) => handleFieldChange(field.key, v)}
		/>
	{/each}
</div>
