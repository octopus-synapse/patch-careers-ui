<script lang="ts">
	import { Sun, Moon } from 'lucide-svelte';
	import { colorSchema } from '$lib/color-schema.svelte';
	import { Button } from 'ui';
</script>

<Button
	variant="icon"
	size="md"
	onclick={colorSchema.toggle}
	aria-label="Toggle color schema"
>
	{#if colorSchema.mode === 'dark'}
		<Sun size={18} />
	{:else}
		<Moon size={18} />
	{/if}
</Button>
