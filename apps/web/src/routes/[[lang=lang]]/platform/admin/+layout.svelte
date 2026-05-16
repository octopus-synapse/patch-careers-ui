<script lang="ts">
import { Loader } from 'ui';

import type { Snippet } from 'svelte';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { useAuth } from '$lib/state/auth.svelte';

let { children }: { children: Snippet } = $props();

const session = useAuth();

const user = $derived(session.user);
const authenticated = $derived(session.isAuthenticated);
const isAdmin = $derived(user?.isAdmin);

$effect(() => {
  if (!browser || session.isLoading) return;

  if (!authenticated) {
    goto('/identity/sign-in');
    return;
  }

  if (authenticated && !isAdmin) {
    goto('/my-profile/dashboard');
  }
});
</script>

{#if session.isLoading}
	<div class="flex min-h-screen items-center justify-center pt-14">
		<Loader size={24} />
	</div>
{:else if authenticated && isAdmin}
	<main class="mx-auto min-h-screen w-full max-w-7xl px-4 pt-14 pb-8 sm:px-6 md:px-8">
		{@render children()}
	</main>
{/if}
