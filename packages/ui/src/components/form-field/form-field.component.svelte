<script lang="ts">
import { intents, resolveIntent } from '../../shared';
import Input from '../input/input.component.svelte';
import Label from '../label/label.component.svelte';

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
const errorText = resolveIntent(intents.danger, { mutedTextColor: true }).mutedTextColor;
</script>

<div>
	<Label for={fieldId}>{label}{#if required} *{/if}</Label>
	<div class="mt-1">
		<Input
			{type}
			bind:value
			id={fieldId}
			{placeholder}
			{required}
			{disabled}
			intent={error ? 'danger' : 'neutral'}
		/>
	</div>
	{#if error}
		<span class="mt-1 block text-xs {errorText}">{error}</span>
	{/if}
</div>
