<script lang="ts">
import type { Snippet } from 'svelte';
import type { HTMLButtonAttributes } from 'svelte/elements';
import { type ButtonCase, getButtonClasses } from './button-intents';
import type { IntentKey } from './design';
import type { ButtonSize, ButtonVariant } from './types';

type Props = HTMLButtonAttributes & {
  variant?: ButtonVariant;
  intent?: IntentKey;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Selected state (visually relevant for `variant="tab"`). */
  selected?: boolean;
  /**
   * `upper` (default) keeps the app-wide caps + wide tracking. `normal`
   * opts into sentence case for surfaces that prefer it (e.g., mynetwork).
   */
  textCase?: ButtonCase;
  children: Snippet;
};

let {
  variant = 'solid',
  intent = 'neutral',
  size = 'lg',
  fullWidth = false,
  selected = false,
  textCase = 'upper',
  children,
  class: className = '',
  ...rest
}: Props = $props();

const computedClass = $derived(
  getButtonClasses(
    variant,
    intent,
    size,
    fullWidth,
    selected,
    typeof className === 'string' ? className : '',
    textCase,
  ),
);
</script>

<button class={computedClass} {...rest}>
	{@render children()}
</button>
