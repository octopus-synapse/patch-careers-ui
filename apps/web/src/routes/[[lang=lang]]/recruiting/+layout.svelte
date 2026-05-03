<script lang="ts">
import { Loader } from 'ui';

import type { Snippet } from 'svelte';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { useAuth } from '$lib/state/auth.svelte';

let { children }: { children: Snippet } = $props();

const session = useAuth();

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
		<Loader size={24} />
	</div>
{:else if authenticated}
	<div class="pt-14 min-h-screen">
		<div class="mx-auto max-w-5xl px-4 py-6">
			{@render children()}
		</div>
	</div>
{/if}
