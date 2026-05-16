<script lang="ts">
import { buildZodFromFields, type FieldDescriptor } from '$lib/utils/build-zod-from-fields';
import FieldRenderer from './field-renderer.svelte';

type Field = FieldDescriptor & {
  options?: string[];
  widget?: string;
};

type Props = {
  fields: Field[];
  data: Record<string, string>;
  onupdate: (data: Record<string, string>) => void;
  // Flipped to true by the parent stepper when the user clicks Continue;
  // switches every visible error from a soft amber hint to a hard red
  // error. Stays false while the user is still typing, so we don't
  // shout at empty required fields they haven't reached yet.
  submitted?: boolean;
};

let { fields, data, onupdate, submitted = false }: Props = $props();

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

// Whenever the parent's `data` changes (e.g. the stepper repopulates from
// saved progress, or we just landed on this step), refresh the validation
// snapshot so errors stay in sync.
$effect(() => {
  errors = validate(data);
});

const severity = $derived<'warning' | 'error'>(submitted ? 'error' : 'warning');
</script>

<div class="space-y-5">
	{#each fields as field}
		<FieldRenderer
			{field}
			value={data[field.key] ?? ''}
			error={errors[field.key]}
			{severity}
			onchange={(v) => handleFieldChange(field.key, v)}
		/>
	{/each}
</div>
