<script lang="ts">
import type { HTMLTextareaAttributes } from 'svelte/elements';
import type { IntentKey } from '../../shared';
import { getInputClasses } from './input.intents';

type Props = Omit<HTMLTextareaAttributes, 'value'> & {
  value?: string;
  intent?: IntentKey;
};

let { value = $bindable(''), intent = 'neutral', class: className = '', ...rest }: Props = $props();

const computedClass = $derived(
  `resize-none ${getInputClasses(intent, typeof className === 'string' ? className : '')}`,
);
</script>

<textarea bind:value class={computedClass} {...rest}></textarea>
