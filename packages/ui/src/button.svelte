<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { ColorSchema, ButtonVariant, ButtonSize } from './types';

	type Props = HTMLButtonAttributes & {
		colorSchema?: ColorSchema;
		variant?: ButtonVariant;
		size?: ButtonSize;
		fullWidth?: boolean;
		children: Snippet;
	};

	let {
		colorSchema = 'light',
		variant = 'solid',
		size = 'lg',
		fullWidth,
		children,
		class: className = '',
		...rest
	}: Props = $props();

	const cs = $derived(colorSchema);

	const variantStyles: Record<ButtonVariant, Record<ColorSchema, string>> = {
		solid: {
			light: 'bg-gray-800 text-gray-50 hover:bg-gray-700',
			dark: 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300',
		},
		outline: {
			light: 'border border-gray-300 text-gray-600 hover:bg-gray-50',
			dark: 'border border-neutral-600 text-neutral-300 hover:bg-neutral-700',
		},
		ghost: {
			light: 'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
			dark: 'text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200',
		},
		danger: {
			light: 'text-red-500 hover:bg-red-50',
			dark: 'text-red-400 hover:bg-red-900/20',
		},
		icon: {
			light: 'text-gray-400 hover:bg-gray-100 hover:text-gray-600',
			dark: 'text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200',
		},
		menu: {
			light: 'text-gray-700 hover:bg-gray-50',
			dark: 'text-neutral-300 hover:bg-neutral-700',
		},
	};

	const sizeStyles: Record<ButtonVariant, Record<ButtonSize, string>> = {
		solid: {
			xs: 'rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-widest',
			sm: 'rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest',
			md: 'rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-widest',
			lg: 'rounded-full py-3 text-xs font-bold uppercase tracking-widest',
		},
		outline: {
			xs: 'rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-widest',
			sm: 'rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest',
			md: 'rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-widest',
			lg: 'rounded-full py-3 text-xs font-bold uppercase tracking-widest',
		},
		ghost: {
			xs: 'rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-widest',
			sm: 'rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest',
			md: 'rounded-lg px-4 py-2.5 text-xs font-semibold uppercase tracking-widest',
			lg: 'rounded-lg py-3 text-xs font-semibold uppercase tracking-widest',
		},
		danger: {
			xs: 'rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-widest',
			sm: 'rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest',
			md: 'rounded-lg px-4 py-2.5 text-xs font-semibold uppercase tracking-widest',
			lg: 'rounded-lg py-3 text-xs font-semibold uppercase tracking-widest',
		},
		icon: {
			xs: 'rounded-lg p-1',
			sm: 'rounded-lg p-1.5',
			md: 'rounded-lg p-2',
			lg: 'rounded-lg p-2.5',
		},
		menu: {
			xs: 'w-full px-3 py-1.5 text-left text-[10px]',
			sm: 'w-full px-3 py-2 text-left text-xs',
			md: 'w-full px-4 py-2.5 text-left text-sm',
			lg: 'w-full px-4 py-3 text-left text-sm',
		},
	};

	const widthClass = $derived(
		fullWidth || (size === 'lg' && variant !== 'icon' && variant !== 'menu')
			? 'w-full'
			: ''
	);

	const baseClass = 'inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50';
	const menuBaseOverride = 'flex items-center gap-2 transition-colors disabled:opacity-50';

	const computedClass = $derived(
		`${variant === 'menu' ? menuBaseOverride : baseClass} ${variantStyles[variant][cs]} ${sizeStyles[variant][size]} ${widthClass} ${className}`.trim()
	);
</script>

<button
	class={computedClass}
	{...rest}
>
	{@render children()}
</button>
