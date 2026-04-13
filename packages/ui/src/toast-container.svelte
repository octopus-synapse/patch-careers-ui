<script lang="ts">
	import Toast from './toast.svelte';
	import { toastState } from './toast-state.svelte';
</script>

{#if toastState.items.length > 0}
	<div class="fixed bottom-4 right-4 z-[200] flex flex-col gap-2">
		{#each toastState.items as toast (toast.id)}
			<Toast message={toast.message} type={toast.type} onClose={() => toastState.remove(toast.id)} />
		{/each}
	</div>
{/if}
