<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createConnectionGetConnectionStats,
  createConnectionIsConnected,
  createConnectionSendConnectionRequest,
  createConnectionWithdrawSentRequest,
  createFollowFollow,
  createFollowGetSocialStats,
  createFollowIsFollowing,
  createFollowUnfollow,
  createUsersGetPublicProfileByUsername,
  exportDownloadUserResumePDF,
  getConnectionGetConnectionStatsQueryKey,
  getConnectionIsConnectedQueryKey,
  getFollowGetSocialStatsQueryKey,
  getFollowIsFollowingQueryKey,
} from 'api-client';
import {
  Briefcase,
  ExternalLink,
  FileDown,
  Globe,
  Loader2,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  UserPlus,
  X,
} from 'lucide-svelte';
import { Button, Dropdown, Modal, toastState } from 'ui';
import { page } from '$app/stores';
import { track } from '$lib/utils/analytics/track';
import { useAuth } from '$lib/state/auth.svelte';
import { chatState } from '$lib/state/chat-state.svelte';
import { usePermissions } from '$lib/state/permissions.svelte';
import BlockMenuItem from '$lib/components/moderation/block-menu-item.svelte';
import ProfileActivityTabs from './_components/profile-activity-tabs.svelte';
import ProfileBadges from './_components/profile-badges.svelte';
import SkillsSection from './_components/skills-section.svelte';
import SeoHead from '$lib/components/seo/seo-head.svelte';
import { locale } from '$lib/state/locale.svelte';

const username = $derived($page.params.username);

const auth = useAuth();
const currentUserId = $derived(String(auth.data?.user?.id ?? ''));
const authenticated = $derived(auth.data?.authenticated);

const profile = createUsersGetPublicProfileByUsername(
  () => username ?? '',
  () => ({ query: { enabled: !!username } }),
);

const profileData = $derived(profile.data);
const user = $derived(profileData?.user);
const resume = $derived(profileData?.resume);
let downloading = $state(false);
let downloadError = $state<string | null>(null);
let profileMenuOpen = $state(false);

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

let copiedLink = $state(false);
async function copyPublicLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    copiedLink = true;
    setTimeout(() => (copiedLink = false), 2000);
  } catch {
    toastState.show('Falha ao copiar link.', 'danger');
  }
}

const userId = $derived(user?.id ?? '');
const isOwnProfile = $derived(!!currentUserId && currentUserId === userId);

const socialStats = createFollowGetSocialStats(
  () => userId,
  () => ({ query: { enabled: !!userId } }),
);
// stats are read directly from socialStats.data via the per-stat $derived blocks below.

const isFollowingQuery = createFollowIsFollowing(
  () => userId,
  () => ({ query: { enabled: !!userId && !!currentUserId && !isOwnProfile } }),
);
const isFollowing = $derived(isFollowingQuery.data?.isFollowing);

const queryClient = useQueryClient();

const followMutation = createFollowFollow(() => ({
  mutation: {
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: getFollowGetSocialStatsQueryKey(userId) });
      queryClient.invalidateQueries({ queryKey: getFollowIsFollowingQueryKey(userId) });
      track('user_followed', { targetUserId: userId });
    },
    onError() {
      toastState.show(locale.t('network.followError'), 'danger');
    },
  },
}));

const unfollowMutation = createFollowUnfollow(() => ({
  mutation: {
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: getFollowGetSocialStatsQueryKey(userId) });
      queryClient.invalidateQueries({ queryKey: getFollowIsFollowingQueryKey(userId) });
      track('user_unfollowed', { targetUserId: userId });
    },
    onError() {
      toastState.show(locale.t('network.unfollowError'), 'danger');
    },
  },
}));

// Connection queries
const connectionStats = createConnectionGetConnectionStats(
  () => userId,
  () => ({ query: { enabled: !!userId } }),
);
const connectionCount = $derived(connectionStats.data?.connections);

const followersCount = $derived(Number(socialStats.data?.followers ?? 0));
const followingCount = $derived(Number(socialStats.data?.following ?? 0));
const connectionsCount = $derived(Number(connectionCount ?? 0));
const statBadgeBase =
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors border-gray-200 bg-gray-50 text-gray-700 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-300';
const statBadgeClickable = 'hover:bg-gray-100 dark:hover:bg-neutral-700/60 cursor-pointer';
const statBadgeReadOnly =
  'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-normal text-gray-600 dark:text-neutral-400';

const isConnectedQuery = createConnectionIsConnected(
  () => userId,
  () => ({ query: { enabled: !!userId && !!currentUserId && !isOwnProfile } }),
);
const isConnected = $derived(isConnectedQuery.data?.isConnected);
const serverPendingSentId = $derived(isConnectedQuery.data?.pendingSentConnectionId ?? null);
/** Treat the request as pending the moment the user clicks, so Connect
 *  swaps to Withdraw immediately — before the query invalidation lands. */
let optimisticPending = $state(false);
const pendingSentConnectionId = $derived(
  serverPendingSentId ?? (optimisticPending ? 'pending' : null),
);

const t = $derived(locale.t);

const connectMutation = createConnectionSendConnectionRequest(() => ({
  mutation: {
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: getConnectionGetConnectionStatsQueryKey(userId) });
      queryClient.invalidateQueries({ queryKey: getConnectionIsConnectedQueryKey(userId) });
      track('connection_requested', { targetUserId: userId });
    },
    onError() {
      optimisticPending = false;
      toastState.show(t('network.connectError'), 'danger');
    },
  },
}));

const withdrawMutation = createConnectionWithdrawSentRequest(() => ({
  mutation: {
    onSuccess() {
      optimisticPending = false;
      queryClient.invalidateQueries({ queryKey: getConnectionIsConnectedQueryKey(userId) });
      track('connection_invite_withdrawn', { targetUserId: userId });
    },
    onError() {
      toastState.show(t('network.withdrawError'), 'danger');
    },
  },
}));

function sendConnectionRequest() {
  if (connectMutation.isPending || withdrawMutation.isPending) return;
  optimisticPending = true;
  connectMutation.mutate({ userId });
}

function withdrawSentRequest() {
  if (withdrawMutation.isPending || connectMutation.isPending) return;
  if (!serverPendingSentId) {
    // Optimistic-only (server hasn't confirmed yet). Flip back; invalidation
    // will reconcile when the pending connect resolves.
    optimisticPending = false;
    return;
  }
  withdrawMutation.mutate({ id: serverPendingSentId });
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

// --- Convidar pra entrevistar --------------------------------------------
// Visible only when the viewer has job:create on the platform (recruiter /
// admin). Clicking opens a modal listing the recruiter's own jobs so they
// can attach this candidate to an existing opening in one step.

const perms = usePermissions(() => ({ authenticated: Boolean(authenticated) }));
const canInviteCandidate = $derived(!isOwnProfile && authenticated && perms.has('job:create'));

let inviteOpen = $state(false);
let myJobs = $state<Array<{ id: string; title?: string; company?: string }>>([]);
let loadingJobs = $state(false);
let inviting = $state<string | null>(null);

async function openInvite() {
  inviteOpen = true;
  if (myJobs.length > 0) return;
  loadingJobs = true;
  try {
    const res = await fetch('/api/v1/jobs/mine?limit=50', { credentials: 'include' });
    const body = (await res.json()) as { items?: Array<Record<string, unknown>> };
    myJobs = (body.items ?? []).map((j) => ({
      id: String(j.id),
      title: j.title as string | undefined,
      company: j.company as string | undefined,
    }));
  } catch {
    toastState.show('Falha ao carregar suas vagas.', 'danger');
  } finally {
    loadingJobs = false;
  }
}

async function inviteToJob(jobId: string) {
  inviting = jobId;
  try {
    chatState.startConversationWith(userId);
    const jobUrl = `${window.location.origin}/careers/browse-jobs/${jobId}`;
    await navigator.clipboard.writeText(jobUrl).catch(() => {});
    toastState.show('Chat aberto e link da vaga copiado — cole pra enviar.', 'success');
    inviteOpen = false;
  } catch {
    toastState.show('Falha ao iniciar convite.', 'danger');
  } finally {
    inviting = null;
  }
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

<SeoHead
	title={user?.name ?? user?.username ?? username ?? 'Profile'}
	description={user?.bio
		? user.bio.slice(0, 180)
		: `${user?.name ?? username ?? ''} — professional profile and resume on Patch Careers.`}
	image={user?.photoURL ?? undefined}
	type="profile"
	jsonLd={user
		? {
				'@context': 'https://schema.org',
				'@type': 'Person',
				name: user.name ?? user.username,
				alternateName: user.username,
				image: user.photoURL,
				url: $page.url.toString(),
				jobTitle: resume?.jobTitle ?? undefined
			}
		: undefined}
/>

{#if profile.isLoading}
	<div class="flex h-screen items-center justify-center">
		<Loader2 size={20} class="animate-spin text-gray-500 dark:text-neutral-500" />
	</div>
{:else if profile.isError || !user}
	<div class="flex h-screen flex-col items-center justify-center gap-3">
		<span class="text-4xl font-bold text-gray-800 dark:text-neutral-200">404</span>
		<span class="text-xs text-gray-500 dark:text-neutral-500">profile not found</span>
	</div>
{:else}
	<div class="min-h-screen pt-14">
		<!-- Hero Banner -->
		<div
			class="h-48 w-full sm:h-56"
			style="background: {bannerGradient(username ?? '')}"
		></div>

		<!-- Profile Content -->
		<div class="mx-auto max-w-3xl px-3 sm:px-6">
			<!-- Avatar + Name section -->
			<div class="relative -mt-14 sm:-mt-16 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:gap-6">
				<!-- Avatar -->
				{#if user.photoURL}
					<img
						src={user.photoURL}
						alt={user.name ?? username}
						class="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 object-cover border-white dark:border-neutral-900"
					/>
				{:else}
					<div class="flex h-24 w-24 sm:h-32 sm:w-32 items-center justify-center rounded-full border-4 text-3xl sm:text-4xl font-bold
						border-white bg-gray-200 text-gray-600 dark:border-neutral-900 dark:bg-neutral-700 dark:text-neutral-200">
						{(user.name ?? username ?? '?').charAt(0).toUpperCase()}
					</div>
				{/if}

				<!-- Name + Actions -->
				<div class="flex flex-1 flex-col gap-3 pb-1 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-neutral-200">
							{user.name ?? username}
						</h1>
						<span class="text-sm text-gray-500 dark:text-neutral-500">@{user.username ?? username}</span>
					</div>

					{#if !isOwnProfile && authenticated}
						<div class="flex flex-wrap items-center gap-2">
							<Button
								variant={isFollowing ? 'outline' : 'solid'}
								size="sm"
								onclick={toggleFollow}
								class="rounded-full px-5 py-1.5 text-[11px]"
							>
								{isFollowing ? t('network.following') : t('network.follow')}
							</Button>
							{#if !isConnected}
								{#if pendingSentConnectionId}
									<Button
										variant="outline"
										size="sm"
										onclick={withdrawSentRequest}
										disabled={withdrawMutation.isPending}
										class="rounded-full px-4 py-1.5 text-[11px]"
									>
										<X size={13} />
										{t('network.withdrawInvite')}
									</Button>
								{:else}
									<Button
										variant="solid"
										size="sm"
										onclick={sendConnectionRequest}
										disabled={connectMutation.isPending}
										class="rounded-full px-4 py-1.5 text-[11px]"
									>
										<UserPlus size={13} />
										{t('network.connect')}
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
							{#if canInviteCandidate}
								<Button
									variant="solid"
									intent="accent"
									size="sm"
									onclick={openInvite}
									class="rounded-full px-4 py-1.5 text-[11px]"
								>
									<Briefcase size={13} />
									Convidar pra entrevistar
								</Button>
							{/if}
							<Dropdown open={profileMenuOpen} align="right" onclose={() => (profileMenuOpen = false)}>
								{#snippet trigger()}
									<Button
										variant="outline"
										size="sm"
										onclick={() => (profileMenuOpen = !profileMenuOpen)}
										class="rounded-full px-2 py-1.5"
										aria-label={t('network.more')}
									>
										<MoreHorizontal size={14} />
									</Button>
								{/snippet}
								<BlockMenuItem
									targetUserId={userId}
									targetName={String(user.name ?? user.username ?? username ?? '')}
									source="profile_header"
									onbeforeConfirm={() => (profileMenuOpen = false)}
								/>
							</Dropdown>
						</div>
					{/if}
				</div>
			</div>

			<!-- Bio -->
			{#if user.bio}
				<p class="mt-4 max-w-xl text-sm leading-relaxed text-gray-800 dark:text-neutral-200">{user.bio}</p>
			{/if}

			<!-- Badges -->
			{#if userId}
				<div class="mt-3">
					<ProfileBadges {userId} />
				</div>
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
				<!-- Stats badges (links only on own profile) -->
				<div class="flex flex-wrap items-center gap-2">
					{#if isOwnProfile}
						<a href="/social/network/followers" class="{statBadgeBase} {statBadgeClickable}">
							<span class="tabular-nums font-semibold text-gray-900 dark:text-neutral-100">{followersCount}</span>
							<span class="text-gray-500 dark:text-neutral-500">{t('network.statFollowersLabel', { count: followersCount })}</span>
						</a>
						<a href="/social/network/following" class="{statBadgeBase} {statBadgeClickable}">
							<span class="tabular-nums font-semibold text-gray-900 dark:text-neutral-100">{followingCount}</span>
							<span class="text-gray-500 dark:text-neutral-500">{t('network.statFollowingLabel')}</span>
						</a>
						<a href="/social/network/connections" class="{statBadgeBase} {statBadgeClickable}">
							<span class="tabular-nums font-semibold text-gray-900 dark:text-neutral-100">{connectionsCount}</span>
							<span class="text-gray-500 dark:text-neutral-500">{t('network.statConnectionsLabel', { count: connectionsCount })}</span>
						</a>
					{:else}
						<span class={statBadgeReadOnly}>
							<span class="tabular-nums font-semibold text-gray-700 dark:text-neutral-300">{followersCount}</span>
							<span class="text-gray-500 dark:text-neutral-500">{t('network.statFollowersLabel', { count: followersCount })}</span>
						</span>
						<span class={statBadgeReadOnly}>
							<span class="tabular-nums font-semibold text-gray-700 dark:text-neutral-300">{followingCount}</span>
							<span class="text-gray-500 dark:text-neutral-500">{t('network.statFollowingLabel')}</span>
						</span>
						<span class={statBadgeReadOnly}>
							<span class="tabular-nums font-semibold text-gray-700 dark:text-neutral-300">{connectionsCount}</span>
							<span class="text-gray-500 dark:text-neutral-500">{t('network.statConnectionsLabel', { count: connectionsCount })}</span>
						</span>
					{/if}
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

			<!-- Skills + endorsements -->
			{#if userId}
				<div class="mt-6">
					<SkillsSection
						{userId}
						{isOwnProfile}
						viewerAuthenticated={Boolean(authenticated)}
					/>
				</div>
			{/if}

			<!-- Activity tabs -->
			{#if userId}
				<ProfileActivityTabs {userId} />
			{/if}

			<!-- Resume download -->
			{#if resume && authenticated}
				<div class="mt-6 rounded-xl border p-4 sm:p-5 border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50">
					<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

<Modal open={inviteOpen} onClose={() => (inviteOpen = false)} closeLabel="Fechar">
	{#snippet title()}Convidar pra entrevistar{/snippet}
	<div class="space-y-3">
		<p class="text-xs text-gray-500 dark:text-neutral-500">
			Escolha uma vaga que você criou e a gente abre um chat já com o link pronto.
		</p>
		{#if loadingJobs}
			<div class="flex justify-center py-6">
				<Loader2 size={16} class="animate-spin text-gray-500" />
			</div>
		{:else if myJobs.length === 0}
			<p class="rounded-lg border border-dashed border-gray-200 dark:border-neutral-700 p-4 text-center text-xs text-gray-500 dark:text-neutral-500">
				Você ainda não criou nenhuma vaga. <a href="/recruiting/jobs/new" class="text-cyan-600 underline">Criar uma agora</a>.
			</p>
		{:else}
			<ul class="max-h-72 space-y-2 overflow-y-auto">
				{#each myJobs as job (job.id)}
					<li>
						<button
							type="button"
							onclick={() => inviteToJob(job.id)}
							disabled={inviting !== null}
							class="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-left text-sm transition-colors hover:border-cyan-500 hover:bg-cyan-50/50 disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-cyan-900/10"
						>
							<div class="min-w-0">
								<p class="truncate text-sm font-medium text-gray-800 dark:text-neutral-200">{job.title ?? 'Sem título'}</p>
								{#if job.company}
									<p class="text-[11px] text-gray-500 dark:text-neutral-500">{job.company}</p>
								{/if}
							</div>
							{#if inviting === job.id}
								<Loader2 size={14} class="animate-spin" />
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</Modal>
