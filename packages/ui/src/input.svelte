<script lang="ts">
import type { HTMLInputAttributes } from 'svelte/elements';
import type { IntentKey } from './design';
import { getInputClasses } from './input-intents';

type Props = Omit<HTMLInputAttributes, 'value'> & {
  value?: string;
  intent?: IntentKey;
};

let { value = $bindable(''), intent = 'neutral', class: className = '', ...rest }: Props = $props();

const computedClass = $derived(
  getInputClasses(intent, typeof className === 'string' ? className : ''),
);
</script>

<input bind:value class={computedClass} {...rest} />
