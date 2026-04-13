<script lang="ts">
	import { colorSchema } from '$lib/color-schema.svelte';
	import { locale } from '$lib/locale.svelte';
	import { chatState } from '$lib/chat-state.svelte';
	import { browser } from '$app/environment';
	import { Avatar, Button } from 'ui';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { Loader2, UserPlus, MessageCircle, Users, UserCheck, Eye } from 'lucide-svelte';
	import {
		createAuthSession,
		createConnectionGetPendingRequests,
		createConnectionGetConnections,
		createConnectionGetConnectionSuggestions,
		createConnectionAcceptConnection,
		createConnectionRejectConnection,
		createConnectionRemoveConnection,
		createConnectionSendConnectionRequest,
		createFollowGetFollowers,
		createFollowGetFollowing,
		getConnectionGetPendingRequestsQueryKey,
		getConnectionGetConnectionsQueryKey,
		getConnectionGetConnectionSuggestionsQueryKey
	} from 'api-client';

	const cs = $derived(colorSchema.mode);
	const t = $derived(locale.t);

	const auth = createAuthSession(() => ({ query: { retry: false, enabled: browser } }));
	const currentUserId = $derived(
		String((auth.data?.data?.data as Record<string, unknown>)?.user
			? ((auth.data?.data?.data as Record<string, unknown>).user as Record<string, unknown>).id ?? ''
			: '')
	);
	const authenticated = $derived((auth.data?.data?.data as Record<string, unknown>)?.authenticated ?? false);

	// Queries
	const pendingQuery = createConnectionGetPendingRequests(() => ({
		query: { enabled: browser && authenticated }
	}));
	const connectionsQuery = createConnectionGetConnections(() => ({
		query: { enabled: browser && authenticated }
	}));
	const suggestionsQuery = createConnectionGetConnectionSuggestions(() => ({
		query: { enabled: browser && authenticated }
	}));
	const followersQuery = createFollowGetFollowers(
		() => currentUserId,
		() => ({ query: { enabled: browser && !!currentUserId } })
	);
	const followingQuery = createFollowGetFollowing(
		() => currentUserId,
		() => ({ query: { enabled: browser && !!currentUserId } })
	);

	// Derived data
	const pendingList = $derived(
		((pendingQuery.data?.data?.data as Record<string, unknown>)?.pendingRequests as Record<string, unknown>)?.data as Record<string, unknown>[] ?? []
	);
	const pendingTotal = $derived(
		((pendingQuery.data?.data?.data as Record<string, unknown>)?.pendingRequests as Record<string, number>)?.total ?? 0
	);
	const connectionsList = $derived(
		((connectionsQuery.data?.data?.data as Record<string, unknown>)?.connections as Record<string, unknown>)?.data as Record<string, unknown>[] ?? []
	);
	const connectionsTotal = $derived(
		((connectionsQuery.data?.data?.data as Record<string, unknown>)?.connections as Record<string, number>)?.total ?? 0
	);
	const suggestionsList = $derived(
		((suggestionsQuery.data?.data?.data as Record<string, unknown>)?.suggestions as Record<string, unknown>[]) ?? []
	);
	const followersTotal = $derived(
		((followersQuery.data?.data?.data as Record<string, unknown>)?.followers as Record<string, number>)?.total ?? 0
	);
	const followingTotal = $derived(
		((followingQuery.data?.data?.data as Record<string, unknown>)?.following as Record<string, number>)?.total ?? 0
	);

	// Mutations
	const queryClient = useQueryClient();

	const acceptMutation = createConnectionAcceptConnection(() => ({
		mutation: {
			onSuccess() {
				queryClient.invalidateQueries({ queryKey: getConnectionGetPendingRequestsQueryKey() });
				queryClient.invalidateQueries({ queryKey: getConnectionGetConnectionsQueryKey() });
			}
		}
	}));

	const rejectMutation = createConnectionRejectConnection(() => ({
		mutation: {
			onSuccess() {
				queryClient.invalidateQueries({ queryKey: getConnectionGetPendingRequestsQueryKey() });
			}
		}
	}));

	const removeMutation = createConnectionRemoveConnection(() => ({
		mutation: {
			onSuccess() {
				queryClient.invalidateQueries({ queryKey: getConnectionGetConnectionsQueryKey() });
			}
		}
	}));

	const connectMutation = createConnectionSendConnectionRequest(() => ({
		mutation: {
			onSuccess() {
				queryClient.invalidateQueries({ queryKey: getConnectionGetConnectionSuggestionsQueryKey() });
			}
		}
	}));

	let sentRequests = $state<Set<string>>(new Set());

	function handleAccept(id: string) { acceptMutation.mutate({ id }); }
	function handleReject(id: string) { rejectMutation.mutate({ id }); }
	function handleRemove(id: string) { removeMutation.mutate({ id }); }
	function handleConnect(userId: string) {
		connectMutation.mutate({ userId });
		sentRequests = new Set([...sentRequests, userId]);
	}
	function handleMessage(userId: string) { chatState.startConversationWith(userId); }

	// Styles
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');
	const cardBg = $derived(cs === 'dark' ? 'bg-neutral-800/50' : 'bg-white');
	const border = $derived(cs === 'dark' ? 'border-neutral-800' : 'border-gray-200');
	const sidebarBg = $derived(cs === 'dark' ? 'bg-neutral-800/30' : 'bg-white');
	const btnPrimary = $derived(cs === 'dark'
		? 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300'
		: 'bg-gray-800 text-white hover:bg-gray-700');
	const btnSecondary = $derived(cs === 'dark'
		? 'border-neutral-600 text-neutral-300 hover:bg-neutral-800'
		: 'border-gray-300 text-gray-700 hover:bg-gray-50');
	const btnGreen = $derived(cs === 'dark'
		? 'bg-emerald-600 text-white hover:bg-emerald-500'
		: 'bg-emerald-600 text-white hover:bg-emerald-700');
	const sidebarLink = $derived(cs === 'dark'
		? 'text-neutral-300 hover:bg-neutral-700/50'
		: 'text-gray-700 hover:bg-gray-50');
	const sectionTitle = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
</script>

<svelte:head>
	<title>{t?.('network.pageTitle') ?? 'My Network'}</title>
</svelte:head>

<div class="min-h-screen pt-20 pb-12">
	<div class="mx-auto flex max-w-5xl gap-6 px-6">
		<!-- Sidebar -->
		<aside class="hidden w-56 flex-shrink-0 md:block">
			<div class="sticky top-20 rounded-xl border {border} {sidebarBg} overflow-hidden">
				<div class="px-4 pt-4 pb-2">
					<h2 class="text-[11px] font-bold uppercase tracking-widest {muted}">
						{t?.('network.manageNetwork') ?? 'Manage my network'}
					</h2>
				</div>
				<nav class="flex flex-col py-1">
					<a href="#connections" class="flex items-center justify-between px-4 py-2.5 text-sm transition-colors {sidebarLink}">
						<span class="flex items-center gap-2.5">
							<Users size={16} class={muted} />
							{t?.('network.connections') ?? 'Connections'}
						</span>
						<span class="text-xs font-semibold {text}">{connectionsTotal}</span>
					</a>
					<a href="#followers" class="flex items-center justify-between px-4 py-2.5 text-sm transition-colors {sidebarLink}">
						<span class="flex items-center gap-2.5">
							<Eye size={16} class={muted} />
							{t?.('network.followersFollowing') ?? 'Followers & Following'}
						</span>
						<span class="text-xs font-semibold {text}">{followersTotal + followingTotal}</span>
					</a>
					<a href="#invitations" class="flex items-center justify-between px-4 py-2.5 text-sm transition-colors {sidebarLink}">
						<span class="flex items-center gap-2.5">
							<UserCheck size={16} class={muted} />
							{t?.('network.invitations') ?? 'Invitations'}
						</span>
						{#if pendingTotal > 0}
							<span class="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
								{pendingTotal}
							</span>
						{:else}
							<span class="text-xs font-semibold {text}">0</span>
						{/if}
					</a>
				</nav>
			</div>
		</aside>

		<!-- Main content -->
		<main class="flex-1 min-w-0 flex flex-col gap-6">
			<!-- Invitations -->
			{#if pendingTotal > 0}
				<section id="invitations" class="rounded-xl border {border} {cardBg} overflow-hidden">
					<div class="flex items-center justify-between px-5 py-4 border-b {border}">
						<h2 class="text-sm font-semibold {sectionTitle}">
							{t?.('network.invitations') ?? 'Invitations'} ({pendingTotal})
						</h2>
					</div>
					<div class="divide-y {border}">
						{#each pendingList.slice(0, 5) as request}
							{@const sender = (request.sender ?? request.user ?? request) as Record<string, string | null>}
							{@const reqId = String(request.id ?? '')}
							<div class="flex items-center gap-3 px-5 py-3.5">
								<a href="/@{sender.username ?? ''}">
									<Avatar name={sender.name ?? sender.username ?? '?'} photoURL={sender.photoURL} colorSchema={cs} size="md" />
								</a>
								<div class="min-w-0 flex-1">
									<a href="/@{sender.username ?? ''}" class="text-sm font-semibold {text} hover:underline">
										{sender.name ?? sender.username ?? '?'}
									</a>
									{#if sender.username}
										<p class="text-[11px] {muted}">@{sender.username}</p>
									{/if}
								</div>
								<Button variant="outline" size="sm" onclick={() => handleReject(reqId)} colorSchema={cs}>
									{t?.('network.ignore') ?? 'Ignore'}
								</Button>
								<Button variant="solid" size="sm" onclick={() => handleAccept(reqId)} colorSchema={cs}>
									{t?.('network.accept') ?? 'Accept'}
								</Button>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- People you may know -->
			{#if suggestionsList.length > 0}
				<section id="suggestions" class="rounded-xl border {border} {cardBg} overflow-hidden">
					<div class="flex items-center justify-between px-5 py-4 border-b {border}">
						<h2 class="text-sm font-semibold {sectionTitle}">
							{t?.('network.suggestions') ?? 'People you may know'}
						</h2>
					</div>
					<div class="flex gap-4 overflow-x-auto px-5 py-4 scrollbar-thin">
						{#each suggestionsList as suggestion}
							{@const user = suggestion as Record<string, string | null>}
							{@const userId = String(user.id ?? '')}
							<div class="flex w-40 flex-shrink-0 flex-col items-center gap-2 rounded-xl border p-4 {border}">
								<a href="/@{user.username ?? ''}">
									<Avatar name={user.name ?? user.username ?? '?'} photoURL={user.photoURL} colorSchema={cs} size="lg" />
								</a>
								<a href="/@{user.username ?? ''}" class="text-center text-xs font-semibold {text} hover:underline">
									{user.name ?? user.username ?? '?'}
								</a>
								{#if user.username}
									<span class="text-[10px] {muted}">@{user.username}</span>
								{/if}
								{#if sentRequests.has(userId)}
									<span class="w-full rounded-full border py-1.5 text-center text-[10px] font-semibold opacity-60 {btnSecondary}">
										{t?.('network.requestSent') ?? 'Sent'}
									</span>
								{:else}
									<Button variant="solid" size="sm" fullWidth onclick={() => handleConnect(userId)} colorSchema={cs}>
										<UserPlus size={11} />
										{t?.('network.connect') ?? 'Connect'}
									</Button>
								{/if}
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Connections -->
			<section id="connections" class="rounded-xl border {border} {cardBg} overflow-hidden">
				<div class="flex items-center justify-between px-5 py-4 border-b {border}">
					<h2 class="text-sm font-semibold {sectionTitle}">
						{t?.('network.connections') ?? 'Connections'} ({connectionsTotal})
					</h2>
				</div>
				{#if connectionsQuery.isLoading}
					<div class="flex items-center justify-center py-12">
						<Loader2 size={16} class="animate-spin {muted}" />
					</div>
				{:else if connectionsList.length === 0}
					<p class="py-12 text-center text-sm {muted}">
						{t?.('network.noConnections') ?? 'No connections yet'}
					</p>
				{:else}
					<div class="divide-y {border}">
						{#each connectionsList as connection}
							{@const user = (connection.user ?? connection) as Record<string, string | null>}
							{@const connId = String(connection.id ?? '')}
							{@const userId = String(user.id ?? '')}
							<div class="flex items-center gap-3 px-5 py-3.5">
								<a href="/@{user.username ?? ''}">
									<Avatar name={user.name ?? user.username ?? '?'} photoURL={user.photoURL} colorSchema={cs} size="md" />
								</a>
								<div class="min-w-0 flex-1">
									<a href="/@{user.username ?? ''}" class="text-sm font-semibold {text} hover:underline">
										{user.name ?? user.username ?? '?'}
									</a>
									{#if user.username}
										<p class="text-[11px] {muted}">@{user.username}</p>
									{/if}
								</div>
								<Button variant="outline" size="sm" onclick={() => handleMessage(userId)} colorSchema={cs}>
									<MessageCircle size={12} />
									{t?.('network.message') ?? 'Message'}
								</Button>
								<Button variant="danger" size="xs" onclick={() => handleRemove(connId)} colorSchema={cs}>
									{t?.('network.remove') ?? 'Remove'}
								</Button>
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<!-- Followers & Following -->
			<section id="followers" class="rounded-xl border {border} {cardBg} overflow-hidden">
				<div class="px-5 py-4 border-b {border}">
					<h2 class="text-sm font-semibold {sectionTitle}">
						{t?.('network.followers') ?? 'Followers'} ({followersTotal}) · {t?.('network.following') ?? 'Following'} ({followingTotal})
					</h2>
				</div>
				{#if followersQuery.isLoading}
					<div class="flex items-center justify-center py-8">
						<Loader2 size={16} class="animate-spin {muted}" />
					</div>
				{:else if followersTotal === 0 && followingTotal === 0}
					<p class="py-8 text-center text-sm {muted}">{t?.('network.noFollowers') ?? 'No followers yet'}</p>
				{:else}
					<div class="divide-y {border}">
						{#each followersList as follower}
							{@const user = (follower.follower ?? follower.user ?? follower) as Record<string, string | null>}
							<div class="flex items-center gap-3 px-5 py-3">
								<a href="/@{user.username ?? ''}">
									<Avatar name={user.name ?? user.username ?? '?'} photoURL={user.photoURL} colorSchema={cs} size="sm" />
								</a>
								<div class="min-w-0 flex-1">
									<a href="/@{user.username ?? ''}" class="text-sm font-medium {text} hover:underline">
										{user.name ?? user.username ?? '?'}
									</a>
								</div>
								<span class="text-[10px] uppercase tracking-wider {muted}">follower</span>
							</div>
						{/each}
						{#each followingList as followed}
							{@const user = (followed.following ?? followed.user ?? followed) as Record<string, string | null>}
							<div class="flex items-center gap-3 px-5 py-3">
								<a href="/@{user.username ?? ''}">
									<Avatar name={user.name ?? user.username ?? '?'} photoURL={user.photoURL} colorSchema={cs} size="sm" />
								</a>
								<div class="min-w-0 flex-1">
									<a href="/@{user.username ?? ''}" class="text-sm font-medium {text} hover:underline">
										{user.name ?? user.username ?? '?'}
									</a>
								</div>
								<span class="text-[10px] uppercase tracking-wider {muted}">following</span>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		</main>
	</div>
</div>
