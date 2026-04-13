<script lang="ts">
	import { page } from '$app/stores';
	import {
		createUsersGetPublicProfileByUsername,
		createFollowGetSocialStats,
		createFollowIsFollowing,
		createFollowFollow,
		createFollowUnfollow,
		createAuthSession,
		createConnectionGetConnectionStats,
		createConnectionIsConnected,
		createConnectionSendConnectionRequest,
		getFollowGetSocialStatsQueryKey,
		getFollowIsFollowingQueryKey,
		getConnectionGetConnectionStatsQueryKey,
		getConnectionIsConnectedQueryKey,
		exportDownloadUserResumePDF
	} from 'api-client';
	import { chatState } from '$lib/chat-state.svelte';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { Button } from 'ui';
	import { Loader2, MapPin, Globe, ExternalLink, FileDown, MessageCircle, UserPlus } from 'lucide-svelte';

	const username = $derived($page.params.username);

	const auth = createAuthSession(() => ({ query: { retry: false } }));
	const currentUserId = $derived(
		String(auth.data?.user?.id ?? '')
	);
	const authenticated = $derived(auth.data?.authenticated);

	const profile = createUsersGetPublicProfileByUsername(
		() => username ?? '',
		() => ({ query: { enabled: !!username } })
	);

	const profileData = $derived(profile.data);
	const user = $derived(profileData?.user);
	const resume = $derived(profileData?.resume);
	let downloading = $state(false);
	let downloadError = $state<string | null>(null);

	async function downloadResume() {
		if (!userId || downloading) return;
		downloading = true;
		downloadError = null;
		try {
			const res = await exportDownloadUserResumePDF(userId);
			const resData = res?.data as { pdf?: string; filename?: string } | undefined;
			if (!resData?.pdf) throw new Error('No PDF data returned');
			const bytes = Uint8Array.from(atob(resData.pdf), (c) => c.charCodeAt(0));
			const blob = new Blob([bytes], { type: 'application/pdf' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = resData.filename ?? `${user?.name ?? username ?? 'resume'}.pdf`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (err) {
			downloadError = err instanceof Error ? err.message : 'Failed to download resume';
		} finally {
			downloading = false;
		}
	}

	const userId = $derived(user?.id ?? '');
	const isOwnProfile = $derived(!!currentUserId && currentUserId === userId);

	const socialStats = createFollowGetSocialStats(
		() => userId,
		() => ({ query: { enabled: !!userId } })
	);
	const stats = $derived(socialStats.data);

	const isFollowingQuery = createFollowIsFollowing(
		() => userId,
		() => ({ query: { enabled: !!userId && !!currentUserId && !isOwnProfile } })
	);
	const isFollowing = $derived(isFollowingQuery.data?.isFollowing);

	const queryClient = useQueryClient();

	const followMutation = createFollowFollow(() => ({
		mutation: {
			onSuccess() {
				queryClient.invalidateQueries({ queryKey: getFollowGetSocialStatsQueryKey(userId) });
				queryClient.invalidateQueries({ queryKey: getFollowIsFollowingQueryKey(userId) });
			}
		}
	}));

	const unfollowMutation = createFollowUnfollow(() => ({
		mutation: {
			onSuccess() {
				queryClient.invalidateQueries({ queryKey: getFollowGetSocialStatsQueryKey(userId) });
				queryClient.invalidateQueries({ queryKey: getFollowIsFollowingQueryKey(userId) });
			}
		}
	}));

	// Connection queries
	const connectionStats = createConnectionGetConnectionStats(
		() => userId,
		() => ({ query: { enabled: !!userId } })
	);
	const connectionCount = $derived(connectionStats.data?.connections);

	const isConnectedQuery = createConnectionIsConnected(
		() => userId,
		() => ({ query: { enabled: !!userId && !!currentUserId && !isOwnProfile } })
	);
	const isConnected = $derived(isConnectedQuery.data?.isConnected);

	const connectMutation = createConnectionSendConnectionRequest(() => ({
		mutation: {
			onSuccess() {
				queryClient.invalidateQueries({ queryKey: getConnectionGetConnectionStatsQueryKey(userId) });
				queryClient.invalidateQueries({ queryKey: getConnectionIsConnectedQueryKey(userId) });
			}
		}
	}));

	let connectionRequestSent = $state(false);

	function sendConnectionRequest() {
		connectMutation.mutate({ userId });
		connectionRequestSent = true;
	}

	function toggleFollow() {
		if (isFollowing) {
			unfollowMutation.mutate({ userId });
		} else {
			followMutation.mutate({ userId });
		}
	}

	function openChat() {
		chatState.startConversationWith(userId);
	}

	// Generate a deterministic gradient from username
	function bannerGradient(name: string): string {
		let hash = 0;
		for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
		const h1 = Math.abs(hash % 360);
		const h2 = (h1 + 40) % 360;
		return `linear-gradient(135deg, hsl(${h1}, 50%, 40%), hsl(${h2}, 60%, 30%))`;
	}


</script>

<svelte:head>
	<title>{user?.name ?? user?.username ?? username} — Profile</title>
</svelte:head>

{#if profile.isLoading}
	<div class="flex h-screen items-center justify-center">
		<Loader2 size={20} class="animate-spin text-gray-500 dark:text-neutral-500" />
	</div>
{:else if profile.isError || !user}
	<div class="flex h-screen flex-col items-center justify-center gap-3">
		<span class="text-4xl font-bold text-gray-800 dark:text-neutral-200">404</span>
		<span class="text-[11px] uppercase tracking-widest text-gray-500 dark:text-neutral-500">profile not found</span>
	</div>
{:else}
	<div class="min-h-screen pt-14">
		<!-- Hero Banner -->
		<div
			class="h-48 w-full sm:h-56"
			style="background: {bannerGradient(username ?? '')}"
		></div>

		<!-- Profile Content -->
		<div class="mx-auto max-w-3xl px-6">
			<!-- Avatar + Name section -->
			<div class="relative -mt-16 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:gap-6">
				<!-- Avatar -->
				{#if user.photoURL}
					<img
						src={user.photoURL}
						alt={user.name ?? username}
						class="h-32 w-32 rounded-full border-4 object-cover border-white dark:border-neutral-900"
					/>
				{:else}
					<div class="flex h-32 w-32 items-center justify-center rounded-full border-4 text-4xl font-bold
						border-white bg-gray-200 text-gray-600 dark:border-neutral-900 dark:bg-neutral-700 dark:text-neutral-200">
						{(user.name ?? username ?? '?').charAt(0).toUpperCase()}
					</div>
				{/if}

				<!-- Name + Actions -->
				<div class="flex flex-1 flex-col gap-3 pb-1 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 class="text-2xl font-bold text-gray-800 dark:text-neutral-200">
							{user.name ?? username}
						</h1>
						<span class="text-sm text-gray-500 dark:text-neutral-500">@{user.username ?? username}</span>
					</div>

					{#if !isOwnProfile && authenticated}
						<div class="flex items-center gap-2">
							<Button
								variant={isFollowing ? 'outline' : 'solid'}
								size="sm"
								onclick={toggleFollow}
								class="rounded-full px-5 py-1.5 text-[11px]"
							>
								{isFollowing ? 'Following' : 'Follow'}
							</Button>
							{#if !isConnected}
								{#if connectionRequestSent}
									<span class="rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider opacity-60 border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800">
										Sent
									</span>
								{:else}
									<Button
										variant="solid"
										size="sm"
										onclick={sendConnectionRequest}
										class="rounded-full px-4 py-1.5 text-[11px]"
									>
										<UserPlus size={13} />
										Connect
									</Button>
								{/if}
							{/if}
							<Button
								variant="outline"
								size="sm"
								onclick={openChat}
								class="rounded-full px-4 py-1.5 text-[11px]"
							>
								<MessageCircle size={13} />
								Message
							</Button>
						</div>
					{/if}
				</div>
			</div>

			<!-- Bio -->
			{#if user.bio}
				<p class="mt-4 max-w-xl text-sm leading-relaxed text-gray-800 dark:text-neutral-200">{user.bio}</p>
			{/if}

			<!-- Meta row -->
			<div class="mt-3 flex flex-wrap items-center gap-4 text-[12px] text-gray-500 dark:text-neutral-500">
				{#if user.location}
					<span class="flex items-center gap-1">
						<MapPin size={13} />
						{user.location}
					</span>
				{/if}
				{#if user.website}
					<a href={user.website} target="_blank" rel="noopener" class="flex items-center gap-1 hover:underline">
						<Globe size={13} />
						{user.website.replace(/^https?:\/\//, '')}
					</a>
				{/if}
			</div>

			<!-- Social links + Stats -->
			<div class="mt-4 flex flex-wrap items-center gap-5 border-b pb-5 border-gray-200 dark:border-neutral-800">
				<!-- Stats -->
				<div class="flex items-center gap-4 text-sm">
					<span>
						<strong class="text-gray-800 dark:text-neutral-200">{stats?.followers}</strong>
						<span class="text-gray-500 dark:text-neutral-500"> followers</span>
					</span>
					<span>
						<strong class="text-gray-800 dark:text-neutral-200">{stats?.following}</strong>
						<span class="text-gray-500 dark:text-neutral-500"> following</span>
					</span>
					<span>
						<strong class="text-gray-800 dark:text-neutral-200">{connectionCount}</strong>
						<span class="text-gray-500 dark:text-neutral-500"> connections</span>
					</span>
				</div>

				<!-- Social icons -->
				<div class="flex items-center gap-3">
					{#if user.github}
						<a
							href="https://github.com/{user.github}"
							target="_blank"
							rel="noopener"
							class="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors bg-gray-50 dark:bg-neutral-800/50 text-gray-500 dark:text-neutral-500 hover:opacity-80"
						>
							<svg viewBox="0 0 16 16" class="h-3.5 w-3.5 fill-current"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
							GitHub
						</a>
					{/if}
					{#if user.linkedin}
						<a
							href="https://linkedin.com/in/{user.linkedin}"
							target="_blank"
							rel="noopener"
							class="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors bg-gray-50 dark:bg-neutral-800/50 text-gray-500 dark:text-neutral-500 hover:opacity-80"
						>
							<svg viewBox="0 0 16 16" class="h-3.5 w-3.5 fill-current"><path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 01.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/></svg>
							LinkedIn
						</a>
					{/if}
				</div>
			</div>

			<!-- Resume download -->
			{#if resume && authenticated}
				<div class="mt-6 rounded-xl border p-5 border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50">
					<div class="flex items-center justify-between">
						<div>
							<h3 class="text-sm font-semibold text-gray-800 dark:text-neutral-200">Resume</h3>
							<p class="mt-0.5 text-[11px] text-gray-500 dark:text-neutral-500">Download {user.name ?? username}'s resume</p>
							{#if downloadError}
								<p class="mt-1 text-[11px] text-red-500">{downloadError}</p>
							{/if}
						</div>
						<Button
							variant="solid"
							size="sm"
							onclick={downloadResume}
							disabled={downloading}
							class="rounded-full px-4 py-1.5 text-[11px]"
						>
							{#if downloading}
								<Loader2 size={13} class="animate-spin" />
								Generating...
							{:else}
								<FileDown size={13} />
								Download
							{/if}
						</Button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
