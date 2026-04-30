<script lang="ts">
import { Loader2 } from 'lucide-svelte';
import type { IntentKey } from '../../shared';
import { getLoaderClasses } from './loader.intents';

type Props = {
  size?: number;
  intent?: IntentKey;
  class?: string;
  label?: string;
  role?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
};

let {
  size = 16,
  intent = 'neutral',
  class: className = '',
  label = 'Loading',
  role,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
}: Props = $props();

const computedClass = $derived(getLoaderClasses(intent, className));
</script>

<Loader2
	{size}
	class={computedClass}
	aria-label={ariaLabel ?? label}
	aria-hidden={ariaHidden}
	{role}
/>
