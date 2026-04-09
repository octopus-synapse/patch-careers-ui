<script lang="ts">
	import { locale } from '$lib/locale.svelte';

	const t = $derived(locale.t);
</script>

<svelte:head>
	<title>Patch Careers</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center">
	{#if t}
		<h1 class="text-4xl font-bold">{t('auth.greeting', { name: 'Patch Careers' })}</h1>
	{/if}
</main>
