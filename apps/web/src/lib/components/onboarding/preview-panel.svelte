<script lang="ts">
	import { Loader2 } from 'lucide-svelte';

	type Props = {
		token?: string;
	};

	let { token }: Props = $props();

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
	class="w-48 rounded-lg border shadow-sm overflow-hidden bg-gray-100 dark:bg-neutral-800/80 border-gray-200 dark:border-neutral-700"
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
				<Loader2 size={16} class="animate-spin text-gray-400 dark:text-neutral-500" />
			{:else}
				<span class="text-[10px] uppercase tracking-widest text-gray-400 dark:text-neutral-500">preview</span>
			{/if}
		</div>
	{/if}
</div>
