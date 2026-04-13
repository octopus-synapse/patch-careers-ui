<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
		size?: 'sm' | 'md';
	};

	let { children, variant = 'default', size = 'sm' }: Props = $props();

	const variants = {
		default: 'bg-gray-100 text-gray-700 dark:bg-neutral-700/50 dark:text-neutral-300',
		success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
		danger: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
		warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
		info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
	};

	const sizes = {
		sm: 'rounded px-1.5 py-0.5 text-[9px] font-semibold',
		md: 'rounded-full px-2.5 py-1 text-[10px] font-semibold',
	};
</script>

<span class="{variants[variant]} {sizes[size]}">
	{@render children()}
</span>
