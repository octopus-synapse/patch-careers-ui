<script lang="ts">
import type { Snippet } from 'svelte';
import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
import { getButtonClasses } from '../button/button.intents';
import type { ButtonCase, ButtonSize, ButtonVariant } from '../button/button.types';
import type { IntentKey } from '../../shared';

type SharedProps = {
  variant?: ButtonVariant;
  intent?: IntentKey;
  size?: ButtonSize;
  fullWidth?: boolean;
  selected?: boolean;
  textCase?: ButtonCase;
  children: Snippet;
};

type AnchorProps = SharedProps &
  Omit<HTMLAnchorAttributes, 'children'> & { href: string };
type ButtonProps = SharedProps &
  Omit<HTMLButtonAttributes, 'children'> & { href?: undefined };

type Props = AnchorProps | ButtonProps;

let {
  href,
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

{#if href != null}
	<a {href} class={computedClass} {...rest as HTMLAnchorAttributes}>
		{@render children()}
	</a>
{:else}
	{@const buttonRest = rest as HTMLButtonAttributes}
	<button type={buttonRest.type ?? 'button'} class={computedClass} {...buttonRest}>
		{@render children()}
	</button>
{/if}
