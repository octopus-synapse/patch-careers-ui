<script lang="ts">
	import '../app.css';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { setBaseUrl } from 'api-client/client';
	import { colorSchema } from '$lib/color-schema.svelte';
	import { locale } from '$lib/locale.svelte';
	import Navbar from '$lib/components/navbar.svelte';
	import ChatWidget from '$lib/components/chat/chat-widget.svelte';
	import OnboardingGuard from '$lib/components/onboarding-guard.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const apiUrl = import.meta.env.VITE_API_URL;
	if (apiUrl) setBaseUrl(apiUrl);

	colorSchema.init();
	locale.init();

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60 * 1000,
				retry: 1
			}
		}
	});

	const bg = {
		light: 'bg-gray-50 text-gray-800',
		dark: 'bg-neutral-900 text-neutral-200'
	};
</script>

<div class="min-h-screen transition-colors duration-200 {bg[colorSchema.mode]}">
	<QueryClientProvider client={queryClient}>
		<OnboardingGuard />
		<Navbar />
		{@render children()}
		<ChatWidget />
	</QueryClientProvider>
</div>
