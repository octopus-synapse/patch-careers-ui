<script lang="ts">
	type Props = {
		message: string;
		type?: 'success' | 'error' | 'info';
		onClose: () => void;
	};

	let { message, type = 'info', onClose }: Props = $props();

	const variants = {
		success: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
		error: 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300',
		info: 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
	};

	$effect(() => {
		const timer = setTimeout(onClose, 3000);
		return () => clearTimeout(timer);
	});
</script>

<div class="flex items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-lg {variants[type]}" role="alert">
	{#if type === 'success'}
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
	{:else if type === 'error'}
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
	{:else}
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
	{/if}
	<span class="flex-1">{message}</span>
	<button onclick={onClose} class="rounded p-0.5 transition-opacity hover:opacity-60" aria-label="Close">
		<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
	</button>
</div>
