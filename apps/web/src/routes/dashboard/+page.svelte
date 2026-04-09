<script lang="ts">
	import { createAuthSession, createAuthLogout } from 'api-client';
	import { loadDictionary, createTranslator, DEFAULT_LOCALE } from 'i18n';
	import type { Translator } from 'i18n';
	import { Button } from 'ui';
	import { goto } from '$app/navigation';
	import { LogOut, Loader2 } from 'lucide-svelte';
	import { colorSchema } from '$lib/color-schema.svelte';
	import { useQueryClient } from '@tanstack/svelte-query';

	let t = $state<Translator | null>(null);

	const cs = $derived(colorSchema.mode);
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const cardBg = $derived(cs === 'dark' ? 'bg-neutral-800/50' : 'bg-white');
	const cardBorder = $derived(cs === 'dark' ? 'border-neutral-700/50' : 'border-gray-200');

	$effect(() => {
		loadDictionary(DEFAULT_LOCALE).then((dict) => {
			t = createTranslator(dict);
		});
	});

	const session = createAuthSession(() => ({
		query: {
			retry: false
		}
	}));
	const queryClient = useQueryClient();

	const user = $derived(session.data?.data?.data?.user);
	const authenticated = $derived(session.data?.data?.data?.authenticated);

	$effect(() => {
		if (!session.isLoading && !authenticated) {
			goto('/login');
		}
	});

	const logout = createAuthLogout(() => ({
		mutation: {
			onSuccess() {
				queryClient.invalidateQueries({ queryKey: ['authSession'] });
				goto('/login');
			}
		}
	}));

	function handleLogout() {
		logout.mutate({ data: {} });
	}
</script>

<svelte:head>
	<title>{t?.('dashboard.pageTitle') ?? ''}</title>
</svelte:head>

{#if session.isLoading}
	<div class="flex min-h-screen items-center justify-center pt-14">
		<Loader2 size={24} class="animate-spin {muted}" />
	</div>
{:else if t && authenticated && user}
	<div class="min-h-screen font-sans antialiased transition-colors duration-300">
		<main class="mx-auto max-w-2xl px-6 pt-24 pb-12">
			<h1 class="text-xl font-medium tracking-tight {text}">
				{t('dashboard.welcome', { name: user.name ?? user.email })}
			</h1>

			<div class="mt-8 rounded-xl border p-6 {cardBg} {cardBorder}">
				<dl class="space-y-4">
					<div>
						<dt class="text-[10px] font-bold uppercase tracking-widest {muted}">Email</dt>
						<dd class="mt-1 text-sm {text}">{user.email}</dd>
					</div>
					{#if user.name}
						<div>
							<dt class="text-[10px] font-bold uppercase tracking-widest {muted}">Name</dt>
							<dd class="mt-1 text-sm {text}">{user.name}</dd>
						</div>
					{/if}
					<div>
						<dt class="text-[10px] font-bold uppercase tracking-widest {muted}">Role</dt>
						<dd class="mt-1 text-sm {text}">{user.role}</dd>
					</div>
				</dl>
			</div>

			<div class="mt-8 max-w-[200px]">
				<Button
					onclick={handleLogout}
					disabled={logout.isPending}
					variant="solid"
					colorSchema={cs}
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
