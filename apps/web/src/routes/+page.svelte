<script lang="ts">
	import { loadDictionary, createTranslator, DEFAULT_LOCALE } from 'i18n';
	import type { Translator } from 'i18n';

	let t = $state<Translator | null>(null);

	$effect(() => {
		loadDictionary(DEFAULT_LOCALE).then((dict) => {
			t = createTranslator(dict);
		});
	});
</script>

<svelte:head>
	<title>Patch Careers</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center">
	{#if t}
		<h1 class="text-4xl font-bold">{t('auth.greeting', { name: 'Patch Careers' })}</h1>
	{:else}
		<p>Loading...</p>
	{/if}
</main>
