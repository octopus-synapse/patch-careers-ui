<script lang="ts">
	import { Search, FileText, Building2, Briefcase, ArrowRight } from 'lucide-svelte';
	import { chatSearchUsers } from 'api-client';
	import { Avatar, Button } from 'ui';
	import { goto } from '$app/navigation';

	type Props = {
		open: boolean;
		t: (key: string) => string;
		onclose: () => void;
	};

	let { open, t, onclose }: Props = $props();

	let inputRef: HTMLInputElement | undefined = $state();
	let query = $state('');
	let users = $state<Array<Record<string, string | null>> | undefined>();
	let searching = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if (open) {
			query = '';
			users = undefined;
			setTimeout(() => inputRef?.focus(), 0);
		}
	});

	$effect(() => {
		if (debounceTimer) clearTimeout(debounceTimer);
		if (query.trim().length < 2) { users = undefined; return; }
		searching = true;
		debounceTimer = setTimeout(async () => {
			try {
				const res = await chatSearchUsers({ q: query.trim() });
				users = res?.users;
			} catch { users = undefined; }
			searching = false;
		}, 300);
	});

	function selectUser(username: string | null) {
		if (!username) return;
		onclose();
		goto(`/@${username}`);
	}

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}

	const quickLinks = [
		{ icon: Briefcase, labelKey: 'nav.jobs', href: '/jobs' },
		{ icon: Building2, labelKey: 'nav.companies', href: '/companies' },
		{ icon: FileText, labelKey: 'nav.about', href: '/about' }
	];
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 px-4 pt-[15vh] backdrop-blur-sm"
		onclick={handleBackdrop}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="w-full max-w-[calc(100vw-2rem)] sm:max-w-lg overflow-hidden rounded-xl shadow-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700/60">
			<div class="flex items-center gap-3 border-b px-4 border-gray-200 dark:border-neutral-700/60">
				<Search size={16} class="text-gray-400 dark:text-neutral-500 shrink-0" />
				<input
					bind:this={inputRef}
					bind:value={query}
					type="text"
					placeholder={t('nav.searchPlaceholder')}
					class="h-12 w-full bg-transparent text-sm outline-none text-gray-800 dark:text-neutral-200 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
				/>
				<Button
					variant="ghost"
					size="xs"
					onclick={onclose}
					class="shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 border-gray-200 dark:border-neutral-700"
				>
					ESC
				</Button>
			</div>

			<div class="max-h-80 overflow-y-auto px-2 py-3 scrollbar-thin">
				{#if users && users.length > 0}
					<div class="px-2 pb-2">
						<span class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">Users</span>
					</div>
					{#each users as user}
						<button
							onclick={() => selectUser(user.username)}
							class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
						>
							<Avatar name={user.name ?? user.username ?? '?'} photoURL={user.photoURL} size="sm" />
							<div class="flex-1 min-w-0">
								<span class="block truncate text-sm font-medium text-gray-800 dark:text-neutral-200">{user.name ?? user.username}</span>
								{#if user.username}
									<span class="block truncate text-[11px] text-gray-400 dark:text-neutral-500">@{user.username}</span>
								{/if}
							</div>
							<ArrowRight size={14} class="text-gray-400 dark:text-neutral-500" />
						</button>
					{/each}
				{:else if query.trim().length >= 2 && !searching}
					<div class="flex items-center justify-center py-6">
						<span class="text-xs text-gray-400 dark:text-neutral-500">No users found</span>
					</div>
				{:else}
					<div class="px-2 pb-2">
						<span class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
							{t('nav.searchQuickLinks')}
						</span>
					</div>

					{#each quickLinks as link}
						<button
							onclick={() => { onclose(); goto(link.href); }}
							class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
						>
							<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400 dark:text-neutral-500 border border-gray-200 dark:border-neutral-700/60">
								<link.icon size={14} />
							</div>
							<span class="flex-1 text-sm text-gray-800 dark:text-neutral-200">{t(link.labelKey)}</span>
							<ArrowRight size={14} class="text-gray-400 dark:text-neutral-500" />
						</button>
					{/each}
				{/if}
			</div>

			<div class="hidden sm:flex items-center gap-4 border-t px-4 py-2.5 border-gray-200 dark:border-neutral-700/60 bg-gray-50 dark:bg-neutral-800/50">
				<div class="flex items-center gap-1.5">
					<kbd class="inline-flex h-5 w-5 items-center justify-center rounded border text-[10px] bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 border-gray-200 dark:border-neutral-700">
						<span class="text-xs">&uarr;</span>
					</kbd>
					<kbd class="inline-flex h-5 w-5 items-center justify-center rounded border text-[10px] bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 border-gray-200 dark:border-neutral-700">
						<span class="text-xs">&darr;</span>
					</kbd>
					<span class="text-[10px] text-gray-400 dark:text-neutral-500">{t('nav.searchTip')}</span>
				</div>
				<div class="flex items-center gap-1.5">
					<kbd class="inline-flex h-5 items-center justify-center rounded border px-1 text-[10px] bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 border-gray-200 dark:border-neutral-700">
						&crarr;
					</kbd>
					<span class="text-[10px] text-gray-400 dark:text-neutral-500">{t('nav.searchTipSelect')}</span>
				</div>
				<div class="flex items-center gap-1.5">
					<kbd class="inline-flex h-5 items-center justify-center rounded border px-1 text-[10px] bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 border-gray-200 dark:border-neutral-700">
						esc
					</kbd>
					<span class="text-[10px] text-gray-400 dark:text-neutral-500">{t('nav.searchTipClose')}</span>
				</div>
			</div>
		</div>
	</div>
{/if}
