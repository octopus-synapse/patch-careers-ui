<script lang="ts">
	import type { ColorSchema } from 'ui';
	import { Loader2 } from 'lucide-svelte';

	type Props = {
		token?: string;
		colorSchema?: ColorSchema;
	};

	let { token, colorSchema = 'light' }: Props = $props();

	const bg = $derived(colorSchema === 'dark' ? 'bg-neutral-800/80' : 'bg-gray-100');
	const border = $derived(colorSchema === 'dark' ? 'border-neutral-700' : 'border-gray-200');
	const muted = $derived(colorSchema === 'dark' ? 'text-neutral-500' : 'text-gray-400');

	let imageUrl = $state<string | null>(null);
	let status = $state<'connecting' | 'waiting' | 'ready'>('connecting');
	let lastVersion = 0;

	$effect(() => {
		if (!token) return;

		const baseUrl = import.meta.env.VITE_API_URL ?? '';
		const url = `${baseUrl}/api/v1/onboarding/preview/stream`;

		const eventSource = new EventSource(url, { withCredentials: true });

		eventSource.onopen = () => {
			status = 'waiting';
		};

		eventSource.addEventListener('preview', (event) => {
			try {
				const data = JSON.parse(event.data);
				if (data.version <= lastVersion) return;
				lastVersion = data.version;
				imageUrl = `data:image/png;base64,${data.image}`;
				status = 'ready';
			} catch {
				// ignore parse errors
			}
		});

		eventSource.onerror = () => {
			status = 'waiting';
		};

		return () => {
			eventSource.close();
		};
	});
</script>

<div
	class="w-48 rounded-lg border shadow-sm overflow-hidden {bg} {border}"
>
	{#if status === 'ready' && imageUrl}
		<img
			src={imageUrl}
			alt="Resume preview"
			class="w-full"
			loading="eager"
		/>
	{:else}
		<div class="flex h-72 items-center justify-center">
			{#if status === 'connecting'}
				<Loader2 size={16} class="animate-spin {muted}" />
			{:else}
				<span class="text-[10px] uppercase tracking-widest {muted}">preview</span>
			{/if}
		</div>
	{/if}
</div>
