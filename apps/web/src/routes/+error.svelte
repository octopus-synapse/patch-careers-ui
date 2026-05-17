<script lang="ts">
	import { page } from '$app/stores';
	import { locale } from '$lib/state/locale.svelte';

	const t = $derived(locale.t);
	const message = $derived(
		$page.status === 404
			? t('errorPage.notFound')
			: ($page.error?.message ?? t('errorPage.somethingWentWrong'))
	);
</script>

<svelte:head>
	<title>{$page.status} — {message}</title>
</svelte:head>

<div
	class="flex flex-col items-center justify-center gap-3 min-h-[calc(100vh_-_3.5rem)] pt-[3.5rem]"
>
	<span class="text-6xl font-bold text-gray-800 dark:text-neutral-200">{$page.status}</span>
	<span
		class="text-xs text-gray-500 dark:text-neutral-500"
		role="alert"
	>
		{message}
	</span>
	<a
		href="/"
		aria-label={t('errorPage.goHomeAria')}
		title={t('errorPage.goHomeAria')}
		class="mt-4 text-xs text-gray-500 dark:text-neutral-500 underline hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
	>
		{t('errorPage.goHome')}
	</a>
</div>
