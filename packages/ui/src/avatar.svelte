<script lang="ts">
	type Props = {
		name: string;
		photoURL?: string | null;
		size?: 'sm' | 'md' | 'lg';
	};

	let { name, photoURL, size = 'sm' }: Props = $props();

	const initial = $derived(name.charAt(0).toUpperCase());
	const sizeClass = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base' };
	const imgSize = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' };
</script>

{#if photoURL}
	<img
		src={photoURL}
		alt={name}
		class="rounded-full object-cover {imgSize[size]}"
	/>
{:else}
	<div class="flex items-center justify-center rounded-full font-bold bg-gray-800 text-gray-50 dark:bg-neutral-200 dark:text-neutral-900 {sizeClass[size]}">
		{initial}
	</div>
{/if}
