<script lang="ts">
	import { createAuthSession } from 'api-client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { Loader2 } from 'lucide-svelte';
	import { locale } from '$lib/locale.svelte';
	import AdminSidebar from '$lib/components/admin/admin-sidebar.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const session = createAuthSession(() => ({
		query: { retry: false, enabled: browser }
	}));

	const user = $derived(session.data?.user);
	const authenticated = $derived(session.data?.authenticated);
	const isAdmin = $derived(user?.isAdmin);

	const t = $derived(locale.t);
	const currentPath = $derived($page.url.pathname);

	$effect(() => {
		if (!browser || session.isLoading) return;

		if (!authenticated) {
			goto('/login');
			return;
		}

		if (authenticated && !isAdmin) {
			goto('/dashboard');
		}
	});
</script>

{#if session.isLoading}
	<div class="flex min-h-screen items-center justify-center pt-14">
		<Loader2 size={24} class="animate-spin text-gray-500 dark:text-neutral-500" />
	</div>
{:else if authenticated && isAdmin}
	<div class="flex min-h-screen pt-14">
		<div class="hidden md:block">
			<AdminSidebar {currentPath} />
		</div>
		<main class="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
			{@render children()}
		</main>
	</div>
{/if}
