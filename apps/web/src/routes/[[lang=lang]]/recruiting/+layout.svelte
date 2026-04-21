<script lang="ts">
import { createAuthSession } from 'api-client';
import { Loader2 } from 'lucide-svelte';
import type { Snippet } from 'svelte';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

let { children }: { children: Snippet } = $props();

const session = createAuthSession(() => ({
  query: { retry: false, enabled: browser },
}));

const authenticated = $derived(session.data?.authenticated);

$effect(() => {
  if (!browser || session.isLoading) return;
  if (!authenticated) {
    goto('/identity/sign-in');
  }
});
</script>

{#if session.isLoading}
	<div class="flex min-h-screen items-center justify-center pt-14">
		<Loader2 size={24} class="animate-spin text-gray-500 dark:text-neutral-500" />
	</div>
{:else if authenticated}
	<div class="pt-14 min-h-screen">
		<div class="mx-auto max-w-5xl px-4 py-6">
			{@render children()}
		</div>
	</div>
{/if}
