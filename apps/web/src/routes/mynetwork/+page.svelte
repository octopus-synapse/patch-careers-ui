<script lang="ts">
	import { colorSchema } from '$lib/color-schema.svelte';
	import { locale } from '$lib/locale.svelte';
	import { chatState } from '$lib/chat-state.svelte';
	import { browser } from '$app/environment';
	import { Avatar } from 'ui';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { Loader2, UserPlus, MessageCircle } from 'lucide-svelte';
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
	const suggestionsList = $derived(
		((suggestionsQuery.data?.data?.data as Record<string, unknown>)?.suggestions as Record<string, unknown>[]) ?? []
	);
	const followersList = $derived(
		((followersQuery.data?.data?.data as Record<string, unknown>)?.followers as Record<string, unknown>)?.data as Record<string, unknown>[] ?? []
	);
	const followingList = $derived(
		((followingQuery.data?.data?.data as Record<string, unknown>)?.following as Record<string, unknown>)?.data as Record<string, unknown>[] ?? []
	);

	// Tabs
	type Tab = 'invitations' | 'connections' | 'follow' | 'suggestions';
	const tabs: Tab[] = ['invitations', 'connections', 'follow', 'suggestions'];
	let activeTab = $state<Tab>('connections');
	let initialTabSet = $state(false);

	$effect(() => {
		if (!initialTabSet && !pendingQuery.isLoading) {
			activeTab = pendingTotal > 0 ? 'invitations' : 'connections';
			initialTabSet = true;
		}
	});

	const tabLabels = $derived({
		invitations: t?.('network.invitations') ?? 'Invitations',
		connections: t?.('network.connections') ?? 'Connections',
		follow: t?.('network.followersFollowing') ?? 'Followers & Following',
		suggestions: t?.('network.suggestions') ?? 'People you may know'
	});

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

	function handleAccept(id: string) {
		acceptMutation.mutate({ id });
	}

	function handleReject(id: string) {
		rejectMutation.mutate({ id });
	}

	function handleRemove(id: string) {
		removeMutation.mutate({ id });
	}

	function handleConnect(userId: string) {
		connectMutation.mutate({ userId });
		sentRequests = new Set([...sentRequests, userId]);
	}

	function handleMessage(userId: string) {
		chatState.startConversationWith(userId);
	}

	// Styles
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');
	const cardBg = $derived(cs === 'dark' ? 'bg-neutral-800/50' : 'bg-gray-50');
	const border = $derived(cs === 'dark' ? 'border-neutral-800' : 'border-gray-200');
	const btnPrimary = $derived(cs === 'dark'
		? 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300'
		: 'bg-gray-800 text-white hover:bg-gray-700');
	const btnSecondary = $derived(cs === 'dark'
		? 'border-neutral-600 text-neutral-300 hover:bg-neutral-800'
		: 'border-gray-300 text-gray-700 hover:bg-gray-50');
	const btnGreen = $derived(cs === 'dark'
		? 'bg-emerald-600 text-white hover:bg-emerald-500'
		: 'bg-emerald-600 text-white hover:bg-emerald-700');
	const tabActive = $derived(cs === 'dark'
		? 'text-neutral-200 border-neutral-200'
		: 'text-gray-800 border-gray-800');
	const tabInactive = $derived(cs === 'dark'
		? 'text-neutral-500 border-transparent hover:text-neutral-300'
		: 'text-gray-500 border-transparent hover:text-gray-700');
</script>

<svelte:head>
	<title>{t?.('network.pageTitle') ?? 'My Network'}</title>
</svelte:head>

<div class="min-h-screen pt-20 pb-12">
	<div class="mx-auto max-w-3xl px-6">
		<h1 class="text-2xl font-bold tracking-tight {text}">
			{t?.('network.pageTitle') ?? 'My Network'}
		</h1>

		<!-- Tab bar -->
		<div class="mt-6 flex gap-6 border-b {border} overflow-x-auto">
			{#each tabs as tab}
				<button
					onclick={() => activeTab = tab}
					class="whitespace-nowrap border-b-2 pb-3 text-[11px] font-semibold uppercase tracking-widest transition-colors {activeTab === tab ? tabActive : tabInactive}"
				>
					{tabLabels[tab]}
					{#if tab === 'invitations' && pendingTotal > 0}
						<span class="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
							{pendingTotal}
						</span>
					{/if}
				</button>
			{/each}
		</div>

		<!-- Tab content -->
		<div class="mt-6">
			{#if activeTab === 'invitations'}
				{#if pendingQuery.isLoading}
					<div class="flex items-center justify-center py-16">
						<Loader2 size={18} class="animate-spin {muted}" />
					</div>
				{:else if pendingList.length === 0}
					<p class="py-16 text-center text-sm {muted}">
						{t?.('network.noInvitations') ?? 'No pending invitations'}
					</p>
				{:else}
					<div class="flex flex-col gap-3">
						{#each pendingList as request}
							{@const sender = (request.sender ?? request.user ?? request) as Record<string, string | null>}
							{@const reqId = String(request.id ?? '')}
							<div class="flex items-center gap-3 rounded-xl border p-4 {border} {cardBg}">
								<a href="/@{sender.username ?? ''}">
									<Avatar
										name={sender.name ?? sender.username ?? '?'}
										photoURL={sender.photoURL}
										colorSchema={cs}
										size="md"
									/>
								</a>
								<div class="min-w-0 flex-1">
									<a href="/@{sender.username ?? ''}" class="text-sm font-semibold {text} hover:underline">
										{sender.name ?? sender.username ?? '?'}
									</a>
									{#if sender.username}
										<p class="text-xs {muted}">@{sender.username}</p>
									{/if}
								</div>
								<div class="flex items-center gap-2">
									<button
										onclick={() => handleAccept(reqId)}
										class="rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all {btnGreen}"
									>
										{t?.('network.accept') ?? 'Accept'}
									</button>
									<button
										onclick={() => handleReject(reqId)}
										class="rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all {btnSecondary}"
									>
										{t?.('network.ignore') ?? 'Ignore'}
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}

			{:else if activeTab === 'connections'}
				{#if connectionsQuery.isLoading}
					<div class="flex items-center justify-center py-16">
						<Loader2 size={18} class="animate-spin {muted}" />
					</div>
				{:else if connectionsList.length === 0}
					<p class="py-16 text-center text-sm {muted}">
						{t?.('network.noConnections') ?? 'No connections yet'}
					</p>
				{:else}
					<div class="flex flex-col gap-3">
						{#each connectionsList as connection}
							{@const user = (connection.user ?? connection) as Record<string, string | null>}
							{@const connId = String(connection.id ?? '')}
							{@const userId = String(user.id ?? '')}
							<div class="flex items-center gap-3 rounded-xl border p-4 {border} {cardBg}">
								<a href="/@{user.username ?? ''}">
									<Avatar
										name={user.name ?? user.username ?? '?'}
										photoURL={user.photoURL}
										colorSchema={cs}
										size="md"
									/>
								</a>
								<div class="min-w-0 flex-1">
									<a href="/@{user.username ?? ''}" class="text-sm font-semibold {text} hover:underline">
										{user.name ?? user.username ?? '?'}
									</a>
									{#if user.username}
										<p class="text-xs {muted}">@{user.username}</p>
									{/if}
								</div>
								<div class="flex items-center gap-2">
									<button
										onclick={() => handleMessage(userId)}
										class="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all {btnSecondary}"
									>
										<MessageCircle size={12} />
										{t?.('network.message') ?? 'Message'}
									</button>
									<button
										onclick={() => handleRemove(connId)}
										class="text-[11px] font-medium transition-colors {muted} hover:text-red-500"
									>
										{t?.('network.remove') ?? 'Remove'}
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}

			{:else if activeTab === 'follow'}
				<!-- Followers -->
				<div>
					<h2 class="text-xs font-semibold uppercase tracking-widest {muted}">
						{t?.('network.followers') ?? 'Followers'}
					</h2>
					{#if followersQuery.isLoading}
						<div class="flex items-center justify-center py-10">
							<Loader2 size={18} class="animate-spin {muted}" />
						</div>
					{:else if followersList.length === 0}
						<p class="py-10 text-center text-sm {muted}">
							{t?.('network.noFollowers') ?? 'No followers yet'}
						</p>
					{:else}
						<div class="mt-3 flex flex-col gap-3">
							{#each followersList as follower}
								{@const user = (follower.user ?? follower) as Record<string, string | null>}
								<div class="flex items-center gap-3 rounded-xl border p-4 {border} {cardBg}">
									<a href="/@{user.username ?? ''}">
										<Avatar
											name={user.name ?? user.username ?? '?'}
											photoURL={user.photoURL}
											colorSchema={cs}
											size="md"
										/>
									</a>
									<div class="min-w-0 flex-1">
										<a href="/@{user.username ?? ''}" class="text-sm font-semibold {text} hover:underline">
											{user.name ?? user.username ?? '?'}
										</a>
										{#if user.username}
											<p class="text-xs {muted}">@{user.username}</p>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Following -->
				<div class="mt-8">
					<h2 class="text-xs font-semibold uppercase tracking-widest {muted}">
						{t?.('network.following') ?? 'Following'}
					</h2>
					{#if followingQuery.isLoading}
						<div class="flex items-center justify-center py-10">
							<Loader2 size={18} class="animate-spin {muted}" />
						</div>
					{:else if followingList.length === 0}
						<p class="py-10 text-center text-sm {muted}">
							{t?.('network.noFollowing') ?? 'Not following anyone yet'}
						</p>
					{:else}
						<div class="mt-3 flex flex-col gap-3">
							{#each followingList as followedUser}
								{@const user = (followedUser.user ?? followedUser) as Record<string, string | null>}
								<div class="flex items-center gap-3 rounded-xl border p-4 {border} {cardBg}">
									<a href="/@{user.username ?? ''}">
										<Avatar
											name={user.name ?? user.username ?? '?'}
											photoURL={user.photoURL}
											colorSchema={cs}
											size="md"
										/>
									</a>
									<div class="min-w-0 flex-1">
										<a href="/@{user.username ?? ''}" class="text-sm font-semibold {text} hover:underline">
											{user.name ?? user.username ?? '?'}
										</a>
										{#if user.username}
											<p class="text-xs {muted}">@{user.username}</p>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

			{:else if activeTab === 'suggestions'}
				{#if suggestionsQuery.isLoading}
					<div class="flex items-center justify-center py-16">
						<Loader2 size={18} class="animate-spin {muted}" />
					</div>
				{:else if suggestionsList.length === 0}
					<p class="py-16 text-center text-sm {muted}">
						{t?.('network.noSuggestions') ?? 'No suggestions available'}
					</p>
				{:else}
					<div class="flex flex-col gap-3">
						{#each suggestionsList as suggestion}
							{@const user = suggestion as Record<string, string | null>}
							{@const userId = String(user.id ?? '')}
							<div class="flex items-center gap-3 rounded-xl border p-4 {border} {cardBg}">
								<a href="/@{user.username ?? ''}">
									<Avatar
										name={user.name ?? user.username ?? '?'}
										photoURL={user.photoURL}
										colorSchema={cs}
										size="md"
									/>
								</a>
								<div class="min-w-0 flex-1">
									<a href="/@{user.username ?? ''}" class="text-sm font-semibold {text} hover:underline">
										{user.name ?? user.username ?? '?'}
									</a>
									{#if user.username}
										<p class="text-xs {muted}">@{user.username}</p>
									{/if}
								</div>
								{#if sentRequests.has(userId)}
									<span class="rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider {btnSecondary} opacity-60">
										{t?.('network.requestSent') ?? 'Sent'}
									</span>
								{:else}
									<button
										onclick={() => handleConnect(userId)}
										class="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all {btnPrimary}"
									>
										<UserPlus size={12} />
										{t?.('network.connect') ?? 'Connect'}
									</button>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>
