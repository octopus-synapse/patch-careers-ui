<script lang="ts">
	import { colorSchema } from '$lib/color-schema.svelte';

	const cs = $derived(colorSchema.mode);
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');
</script>

<svelte:head>
	<title>404 — Page not found</title>
</svelte:head>

<div class="flex flex-col items-center justify-center gap-3" style="min-height: calc(100vh - 3.5rem); padding-top: 3.5rem;">
	<span class="text-6xl font-bold {text}">404</span>
	<span class="text-[11px] uppercase tracking-widest {muted}">page not found</span>
	<a href="/" class="mt-4 text-[11px] uppercase tracking-widest {muted} underline hover:opacity-70">
		go home
	</a>
</div>
