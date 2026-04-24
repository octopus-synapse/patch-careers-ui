<script lang="ts">
import { Moon, Sun } from 'lucide-svelte';
import { Button } from 'ui';
import { colorSchema } from '$lib/state/color-schema.svelte';
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
