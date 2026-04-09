<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { ColorSchema, ButtonVariant } from './types';

	type Props = HTMLButtonAttributes & {
		colorSchema?: ColorSchema;
		variant?: ButtonVariant;
		children: Snippet;
	};

	const variantStyles: Record<ButtonVariant, Record<ColorSchema, string>> = {
		solid: {
			light: 'bg-gray-800 text-gray-50',
			dark: 'bg-neutral-200 text-neutral-900'
		}
	};

	let {
		colorSchema = 'light',
		variant = 'solid',
		children,
		class: className = '',
		...rest
	}: Props = $props();
</script>

<button
	class="w-full rounded-full py-3 text-xs font-bold uppercase tracking-widest transition-transform active:scale-[0.98] disabled:opacity-50 {variantStyles[variant][colorSchema]} {className}"
	{...rest}
>
	{@render children()}
</button>
