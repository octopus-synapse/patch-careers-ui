<script lang="ts">
import Button from './button.svelte';
import type { IntentKey } from './design';
import { getToastClasses } from './toast-intents';
import type { ToastAction } from './toast-state.svelte';

type Props = {
  message: string;
  intent?: IntentKey;
  action?: ToastAction;
  /** ms before auto-dismiss. 0 disables. */
  duration?: number;
  onClose: () => void;
};

let { message, intent = 'info', action, duration = 3000, onClose }: Props = $props();

const classes = $derived(getToastClasses(intent));

$effect(() => {
  if (duration <= 0) return;
  const timer = setTimeout(onClose, duration);
  return () => clearTimeout(timer);
});

function handleAction() {
  action?.onClick();
  onClose();
}
</script>

<div
	class="flex items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-lg {classes.container}"
	role="alert"
>
	{#if intent === 'success'}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class={classes.icon}
		>
			<path d="M20 6 9 17l-5-5" />
		</svg>
	{:else if intent === 'danger'}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class={classes.icon}
		>
			<path d="M18 6 6 18" /><path d="m6 6 12 12" />
		</svg>
	{:else}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class={classes.icon}
		>
			<circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
		</svg>
	{/if}
	<span class="flex-1">{message}</span>
	{#if action}
		<Button variant="ghost" size="xs" onclick={handleAction} class="font-semibold">
			{action.label}
		</Button>
	{/if}
	<Button variant="icon" size="xs" onclick={onClose} aria-label="Close">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M18 6 6 18" /><path d="m6 6 12 12" />
		</svg>
	</Button>
</div>
