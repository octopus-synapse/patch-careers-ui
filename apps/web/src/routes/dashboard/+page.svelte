<script lang="ts">
	import { createAuthSession, createAuthLogout, getAuthSessionQueryKey } from 'api-client';
	import { Button } from 'ui';
	import { goto } from '$app/navigation';
	import { LogOut, Loader2 } from 'lucide-svelte';
	import { locale } from '$lib/locale.svelte';
	import { useQueryClient } from '@tanstack/svelte-query';

	const t = $derived(locale.t);

	const session = createAuthSession(() => ({
		query: {
			retry: false
		}
	}));
	const queryClient = useQueryClient();

	const user = $derived(session.data?.user);
	const authenticated = $derived(session.data?.authenticated);

	$effect(() => {
		if (!session.isLoading && !authenticated) {
			goto('/login');
		}
		if (!session.isLoading && authenticated && user?.needsOnboarding) {
			goto('/onboarding');
		}
	});

	const logout = createAuthLogout(() => ({
		mutation: {
			onSuccess() {
				queryClient.invalidateQueries({ queryKey: getAuthSessionQueryKey() });
				goto('/login');
			}
		}
	}));

	function handleLogout() {
		logout.mutate({ data: {} });
	}
</script>

<svelte:head>
	<title>{t('dashboard.pageTitle')}</title>
</svelte:head>

{#if session.isLoading}
	<div class="flex min-h-screen items-center justify-center pt-14">
		<Loader2 size={24} class="animate-spin text-gray-500 dark:text-neutral-500" />
	</div>
{:else if t && authenticated && user}
	<div class="min-h-screen font-sans antialiased transition-colors duration-300">
		<main class="mx-auto max-w-2xl px-4 pt-20 pb-12 sm:px-6 sm:pt-24">
			<h1 class="text-xl font-medium tracking-tight text-gray-800 dark:text-neutral-200">
				{t('dashboard.welcome', { name: user.name ?? user.email })}
			</h1>

			<div class="mt-6 sm:mt-8 rounded-xl border p-4 sm:p-6 bg-white dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700/50">
				<dl class="space-y-4">
					<div>
						<dt class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">Email</dt>
						<dd class="mt-1 text-sm text-gray-800 dark:text-neutral-200">{user.email}</dd>
					</div>
					{#if user.name}
						<div>
							<dt class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">Name</dt>
							<dd class="mt-1 text-sm text-gray-800 dark:text-neutral-200">{user.name}</dd>
						</div>
					{/if}
					<div>
						<dt class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">Role</dt>
						<dd class="mt-1 text-sm text-gray-800 dark:text-neutral-200">{user.role}</dd>
					</div>
				</dl>
			</div>

			<div class="mt-8 max-w-[200px]">
				<Button
					onclick={handleLogout}
					disabled={logout.isPending}
					variant="solid"
				>
					{#if logout.isPending}
						<Loader2 size={14} class="mx-auto animate-spin" />
					{:else}
						<span class="flex items-center justify-center gap-2">
							<LogOut size={14} />
							{t('dashboard.logout')}
						</span>
					{/if}
				</Button>
			</div>
		</main>
	</div>
{/if}
