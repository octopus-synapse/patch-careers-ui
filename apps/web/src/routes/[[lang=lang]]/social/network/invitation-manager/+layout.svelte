<script lang="ts">
import type { Snippet } from 'svelte';
import { page } from '$app/stores';
import { locale } from '$lib/state/locale.svelte';

let { children }: { children: Snippet } = $props();

const t = $derived(locale.t);
const currentPath = $derived($page.url.pathname);
const isReceived = $derived(currentPath.endsWith('/received'));
const isSent = $derived(currentPath.endsWith('/sent'));
</script>

<div class="min-h-screen pt-20 pb-12">
	<div class="mx-auto max-w-3xl px-3 sm:px-6">
		<section
			class="rounded-xl border overflow-hidden border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50"
		>
			<header class="flex items-center justify-between px-4 pt-5 pb-3 sm:px-6">
				<h1 class="text-base font-semibold text-gray-800 dark:text-neutral-200">
					{t?.('network.manageInvitations')}
				</h1>
			</header>

			<nav class="flex items-center gap-6 border-b px-4 sm:px-6 border-gray-200 dark:border-neutral-800">
				<a
					href="/social/network/invitation-manager/received"
					class="-mb-px border-b-2 px-1 py-3 text-xs font-semibold transition-colors {isReceived ? 'border-emerald-500 text-emerald-600 dark:text-emerald-300' : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200'}"
				>
					{t?.('network.received')}
				</a>
				<a
					href="/social/network/invitation-manager/sent"
					class="-mb-px border-b-2 px-1 py-3 text-xs font-semibold transition-colors {isSent ? 'border-emerald-500 text-emerald-600 dark:text-emerald-300' : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200'}"
				>
					{t?.('network.sent')}
				</a>
			</nav>

			{@render children()}
		</section>
	</div>
</div>
