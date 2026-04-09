<script lang="ts">
	import '../app.css';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { colorSchema } from '$lib/color-schema.svelte';
	import Navbar from '$lib/components/navbar.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	colorSchema.init();

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
	<Navbar />
	<QueryClientProvider client={queryClient}>
		{@render children()}
	</QueryClientProvider>
</div>
