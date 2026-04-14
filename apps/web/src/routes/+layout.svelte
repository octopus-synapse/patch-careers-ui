<script lang="ts">
	import '../app.css';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { setBaseUrl } from 'api-client/client';
	import { colorSchema } from '$lib/color-schema.svelte';
	import { locale } from '$lib/locale.svelte';
	import { page } from '$app/stores';
	import { isLocale } from 'i18n';
	import Navbar from '$lib/components/navbar.svelte';
	import ChatWidget from '$lib/components/chat/chat-widget.svelte';
	import OnboardingGuard from '$lib/components/onboarding-guard.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const apiUrl = import.meta.env.VITE_API_URL;
	if (apiUrl) setBaseUrl(apiUrl);

	colorSchema.init();

	const initialLang = $page.params.lang;
	locale.init(initialLang && isLocale(initialLang) ? initialLang : undefined);
	$effect(() => {
		const lang = $page.params.lang;
		if (lang && isLocale(lang) && lang !== locale.current) {
			locale.set(lang);
		}
	});

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60 * 1000,
				retry: 1
			}
		}
	});

	const isLanding = $derived($page.url.pathname === '/');
</script>

{#if isLanding}
	<QueryClientProvider client={queryClient}>
		<Navbar />
		{@render children()}
	</QueryClientProvider>
{:else}
	<div class="min-h-screen transition-colors duration-200 bg-gray-50 text-gray-800 dark:bg-neutral-900 dark:text-neutral-200">
		<QueryClientProvider client={queryClient}>
			<OnboardingGuard />
			<Navbar />
			{@render children()}
			<ChatWidget />
		</QueryClientProvider>
	</div>
{/if}
