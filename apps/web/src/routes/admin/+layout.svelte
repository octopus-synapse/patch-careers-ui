<script lang="ts">
	import { createAuthSession } from 'api-client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { Loader2 } from 'lucide-svelte';
	import { colorSchema } from '$lib/color-schema.svelte';
	import { locale } from '$lib/locale.svelte';
	import AdminSidebar from '$lib/components/admin/admin-sidebar.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const session = createAuthSession(() => ({
		query: { retry: false, enabled: browser }
	}));

	const user = $derived(session.data?.data?.data?.user as Record<string, unknown> | null);
	const authenticated = $derived(session.data?.data?.data?.authenticated ?? false);
	const isAdmin = $derived(user?.isAdmin ?? false);

	const cs = $derived(colorSchema.mode);
	const t = $derived(locale.t);
	const currentPath = $derived($page.url.pathname);
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');

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
		<Loader2 size={24} class="animate-spin {muted}" />
	</div>
{:else if authenticated && isAdmin}
	<div class="flex min-h-screen pt-14">
		<AdminSidebar {currentPath} colorSchema={cs} />
		<main class="flex-1 overflow-auto p-6">
			{@render children()}
		</main>
	</div>
{/if}
