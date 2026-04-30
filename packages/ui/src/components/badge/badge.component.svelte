<script lang="ts">
import type { Snippet } from 'svelte';
import { type BadgeSize, getBadgeClasses } from './badge.intents';
import type { IntentKey } from '../../shared';

type Props = {
  children: Snippet;
  intent?: IntentKey;
  size?: BadgeSize;
};

let { children, intent = 'neutral', size = 'sm' }: Props = $props();

const computedClass = $derived(getBadgeClasses(intent, size));
</script>

<span class={computedClass}>
	{@render children()}
</span>
