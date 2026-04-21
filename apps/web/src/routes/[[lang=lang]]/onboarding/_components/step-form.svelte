<script lang="ts">
import { buildZodFromFields, type FieldDescriptor } from '$lib/forms/build-zod-from-fields';
import FieldRenderer from './field-renderer.svelte';

type Field = FieldDescriptor & {
  options?: string[];
  widget?: string;
};

type Props = {
  fields: Field[];
  data: Record<string, string>;
  onupdate: (data: Record<string, string>) => void;
};

let { fields, data, onupdate }: Props = $props();

const schema = $derived(buildZodFromFields(fields));
let errors = $state<Record<string, string>>({});

function validate(values: Record<string, string>): Record<string, string> {
  const result = schema.safeParse(values);
  if (result.success) return {};
  const flat: Record<string, string> = {};
  for (const [key, messages] of Object.entries(result.error.flatten().fieldErrors)) {
    if (messages && messages.length > 0) flat[key] = messages[0];
  }
  return flat;
}

function handleFieldChange(key: string, value: string) {
  const newData = { ...data, [key]: value };
  onupdate(newData);
  errors = validate(newData);
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
