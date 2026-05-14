<script lang="ts">
import { Moon, Sun } from 'lucide-svelte';
import { Button } from 'ui';
import { colorSchema } from '$lib/state/color-schema.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);
</script>

<Button
	variant="icon"
	size="md"
	onclick={colorSchema.toggle}
	aria-label={t('layout.toggleColorSchemaAria')}
>
	{#if colorSchema.mode === 'dark'}
		<Sun size={18} />
	{:else}
		<Moon size={18} />
	{/if}
</Button>
