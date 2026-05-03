<script lang="ts">
import { Loader } from 'ui';

import type { Snippet } from 'svelte';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import SettingsSidebar from './_components/settings-sidebar.svelte';
import { useAuth } from '$lib/state/auth.svelte';

let { children }: { children: Snippet } = $props();

const session = useAuth();

const authenticated = $derived(session.data?.authenticated ?? false);
const currentPath = $derived($page.url.pathname);

$effect(() => {
  if (!browser || session.isLoading) return;
  if (!authenticated) goto('/identity/sign-in');
});
</script>

{#if session.isLoading}
	<div class="flex min-h-screen items-center justify-center pt-14">
		<Loader size={24} />
	</div>
{:else if authenticated}
	<div class="flex min-h-screen pt-14">
		<div class="hidden md:block">
			<SettingsSidebar {currentPath} />
		</div>
		<main class="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
			{@render children()}
		</main>
	</div>
{/if}
