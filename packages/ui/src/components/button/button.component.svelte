<script lang="ts">
import type { Snippet } from 'svelte';
import type { HTMLButtonAttributes } from 'svelte/elements';
import { getButtonClasses } from './button.intents';
import type { ButtonCase, ButtonSize, ButtonVariant } from './button.types';
import type { IntentKey } from '../../shared';

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
  // P0-#18: HTML defaults a bare `<button>` to `type='submit'`. Every
  // `<Button>` placed inside a `<form>` previously submitted that form on
  // click, breaking apply-modal "Cancel", comment-section close buttons,
  // settings actions, etc. Default to `'button'` and force callers that
  // genuinely want submit semantics to declare `type='submit'`.
  type = 'button',
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

<button {type} class={computedClass} {...rest}>
	{@render children()}
</button>
