<script lang="ts">
	import { Avatar, Badge, Card, Dropdown, ConfirmModal, Button } from 'ui';
	import { Trash2, Flag, MoreHorizontal, MessageSquare, Zap, Clock, Lock } from 'lucide-svelte';
	import EngagementBar from './engagement-bar.svelte';
	import CommentSection from './comment-section.svelte';

	type Props = {
		post: Record<string, unknown>;
		currentUserId: string;
		onlike: (id: string, reactionType?: string) => void;
		onunlike: (id: string) => void;
		onbookmark: (id: string) => void;
		onunbookmark: (id: string) => void;
		ondelete: (id: string) => void;
		onrepost: (id: string) => void;
		onreport: (id: string) => void;
		onvote?: (id: string, optionIndex: number) => void;
	};

	let {
		post,
		currentUserId,
		onlike,
		onunlike,
		onbookmark,
		onunbookmark,
		ondelete,
		onrepost,
		onreport,
		onvote
	}: Props = $props();

	let showComments = $state(false);
	let showMenu = $state(false);
	let showDeleteConfirm = $state(false);

	interface PostAuthor { id?: string; name?: string; username?: string; photoURL?: string; avatarUrl?: string }
	interface PostData {
		imageUrl?: string;
		options?: { text?: string; label?: string; votes?: number }[];
		title?: string;
		question?: string;
		organization?: string;
		date?: string;
		commitment?: string;
		contact_method?: string;
		project_url?: string;
		application?: string;
		difficulty?: string;
		deadline?: string;
		description?: string;
		codeSnippet?: string;
		codeLanguage?: string;
		pollDeadline?: string;
	}
	interface PostLinkPreview { url?: string; image?: string; title?: string; description?: string }

	const postId = $derived(String(post.id));
	const author = $derived(post.author as PostAuthor | undefined);
	const authorName = $derived(String(author?.name ?? author?.username ?? 'Unknown'));
	const authorUsername = $derived(String(author?.username));
	const authorPhoto = $derived(author?.photoURL ?? author?.avatarUrl);
	const postType = $derived(String(post.type));
	const data = $derived(post.data as PostData | undefined);
	const content = $derived(String(post.content));
	const imageUrl = $derived((post.imageUrl ?? data?.imageUrl) as string | undefined);
	const linkPreview = $derived(post.linkPreview as PostLinkPreview | undefined);
	const linkUrl = $derived(post.linkUrl as string | undefined);
	const hardSkills = $derived((post.hardSkills ?? post.hard_skills) as string[] | undefined);
	const softSkills = $derived((post.softSkills ?? post.soft_skills) as string[] | undefined);
	const isLiked = $derived(Boolean(post.isLiked ?? post.liked));
	const isBookmarked = $derived(Boolean(post.isBookmarked ?? post.bookmarked));
	const isOwner = $derived(String(author?.id ?? post.userId) === currentUserId);
	const createdAt = $derived(post.createdAt as string | undefined);
	const coAuthors = $derived(post.coAuthors as PostAuthor[] | undefined);
	const threadParentId = $derived(post.threadParentId as string | undefined);
	const hasThreadChildren = $derived(Boolean(post.threadChildren) || Boolean(post.isThread));
	const scheduledAt = $derived(post.scheduledAt as string | undefined);
	const reactionCounts = $derived((post.reactionCounts ?? {}) as Record<string, number>);
	const currentReaction = $derived(post.reactionType as string | undefined);
	const hasVoted = $derived(Boolean(post.hasVoted));

	// Code snippet fields
	const codeSnippet = $derived(data?.codeSnippet ?? post.codeSnippet as string | undefined);
	const codeLanguage = $derived(data?.codeLanguage ?? post.codeLanguage as string | undefined);

	// Challenge fields
	const challengeDifficulty = $derived(data?.difficulty as string | undefined);
	const challengeDeadline = $derived(data?.deadline as string | undefined);
	const responseCount = $derived(Number(post.responseCount ?? 0));

	// Poll deadline
	const pollDeadline = $derived(data?.pollDeadline as string | undefined);
	const isPollClosed = $derived.by(() => {
		if (!pollDeadline) return false;
		return new Date(pollDeadline).getTime() < Date.now();
	});
	const pollTimeRemaining = $derived.by(() => {
		if (!pollDeadline) return null;
		const remaining = new Date(pollDeadline).getTime() - Date.now();
		if (remaining <= 0) return null;
		const hours = Math.floor(remaining / (1000 * 60 * 60));
		const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
		if (hours > 24) return `${Math.floor(hours / 24)}d remaining`;
		if (hours > 0) return `${hours}h ${minutes}m remaining`;
		return `${minutes}m remaining`;
	});

	// Scheduled post detection
	const isScheduled = $derived.by(() => {
		if (!scheduledAt || !isOwner) return false;
		return new Date(scheduledAt).getTime() > Date.now();
	});

	const pollOptions = $derived(
		postType === 'QUESTION' && data?.options ? data.options : null as PostData['options'] | null
	);

	const title = $derived(data?.title ?? data?.question);

	const typeBadgeVariant: Record<string, 'default' | 'success' | 'danger' | 'warning' | 'info'> = {
		ACHIEVEMENT: 'warning',
		OPPORTUNITY: 'info',
		LEARNING: 'default',
		BUILD: 'success',
		QUESTION: 'info',
		CHALLENGE: 'danger'
	};

	const typeBadgeLabel: Record<string, string> = {
		ACHIEVEMENT: 'Achievement',
		OPPORTUNITY: 'Opportunity',
		LEARNING: 'Learning',
		BUILD: 'Build',
		QUESTION: 'Question',
		CHALLENGE: 'Challenge'
	};

	const difficultyBadgeVariant: Record<string, 'success' | 'warning' | 'danger'> = {
		Easy: 'success',
		Medium: 'warning',
		Hard: 'danger'
	};

	function formatRelativeTime(dateStr?: string): string {
		if (!dateStr) return '';
		const now = Date.now();
		const then = new Date(dateStr).getTime();
		const diff = now - then;
		const seconds = Math.floor(diff / 1000);
		if (seconds < 60) return 'just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h`;
		const days = Math.floor(hours / 24);
		if (days < 30) return `${days}d`;
		const months = Math.floor(days / 30);
		return `${months}mo`;
	}

	function highlightHashtags(text: string): string {
		return text.replace(/(#\w+)/g, '<span class="text-blue-500">$1</span>');
	}

	function handleVoteClick(index: number) {
		if (hasVoted || isPollClosed) return;
		if (onvote) {
			onvote(postId, index);
		}
	}

	function handleDeleteRequest() {
		showMenu = false;
		showDeleteConfirm = true;
	}

	function handleDeleteConfirm() {
		showDeleteConfirm = false;
		ondelete(postId);
	}
</script>

<article>
	<Card class="shadow-sm hover:shadow-md transition-shadow">
		<!-- Scheduled badge -->
		{#if isScheduled}
			<div class="mb-3">
				<Badge variant="warning" size="md">
					<span class="flex items-center gap-1">
						<Clock size={12} />
						Scheduled
					</span>
				</Badge>
			</div>
		{/if}

		<!-- Thread indicator -->
		{#if threadParentId}
			<div class="mb-2 flex items-center gap-1 text-xs text-gray-400 dark:text-neutral-500">
				<MessageSquare size={12} />
				<span>Part of a thread</span>
			</div>
		{/if}

		<!-- Header: avatar + author info + menu -->
		<div class="flex items-start gap-3">
			<Avatar name={authorName} photoURL={authorPhoto} size="lg" />

			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-1.5 text-sm flex-wrap">
					<span class="font-semibold text-gray-800 dark:text-neutral-200">{authorName}</span>
					{#if coAuthors}
						{#each coAuthors as coAuthor}
							<span class="text-gray-400 dark:text-neutral-500">&</span>
							<span class="font-semibold text-gray-800 dark:text-neutral-200">{coAuthor.name ?? coAuthor.username}</span>
						{/each}
					{/if}
					{#if authorUsername}
						<span class="text-gray-400 dark:text-neutral-500">@{authorUsername}</span>
					{/if}
					<span class="text-gray-400 dark:text-neutral-500">&middot;</span>
					<span class="text-xs text-gray-400 dark:text-neutral-500">{formatRelativeTime(createdAt)}</span>
				</div>

				<div class="flex items-center gap-1.5 mt-1">
					{#if postType && typeBadgeLabel[postType]}
						<Badge variant={typeBadgeVariant[postType]} size="sm">
							{typeBadgeLabel[postType]}
						</Badge>
					{/if}
					{#if postType === 'CHALLENGE' && challengeDifficulty}
						<Badge variant={difficultyBadgeVariant[challengeDifficulty] ?? 'default'} size="sm">
							{challengeDifficulty}
						</Badge>
					{/if}
				</div>
			</div>

			<Dropdown open={showMenu} align="right" onclose={() => showMenu = false}>
				{#snippet trigger()}
					<Button variant="icon" size="xs" onclick={() => showMenu = !showMenu}>
						<MoreHorizontal size={16} />
					</Button>
				{/snippet}
				{#if isOwner}
					<Button variant="menu" size="sm" onclick={handleDeleteRequest}>
						<Trash2 size={14} />
						Delete
					</Button>
				{/if}
				{#if !isOwner}
					<Button variant="menu" size="sm" onclick={() => { showMenu = false; onreport(postId); }}>
						<Flag size={14} />
						Report
					</Button>
				{/if}
			</Dropdown>
		</div>

		<!-- Title -->
		{#if title}
			<h3 class="mt-3 text-base font-semibold text-gray-800 dark:text-neutral-200">{title}</h3>
		{/if}

		<!-- Content -->
		{#if content}
			<p class="mt-2 text-sm leading-relaxed text-gray-800 dark:text-neutral-200 whitespace-pre-wrap">
				{@html highlightHashtags(content)}
			</p>
		{/if}

		<!-- Challenge card extras -->
		{#if postType === 'CHALLENGE'}
			{#if data?.description}
				<p class="mt-2 text-sm text-gray-600 dark:text-neutral-400">{data.description}</p>
			{/if}
			<div class="mt-2 flex items-center gap-3 text-xs text-gray-400 dark:text-neutral-500">
				{#if challengeDeadline}
					<span class="flex items-center gap-1">
						<Clock size={12} />
						Deadline: {new Date(challengeDeadline).toLocaleDateString()}
					</span>
				{/if}
				<span class="flex items-center gap-1">
					<Zap size={12} />
					{responseCount} {responseCount === 1 ? 'response' : 'responses'}
				</span>
			</div>
		{/if}

		<!-- Type-specific data fields -->
		{#if data}
			{#if postType === 'ACHIEVEMENT' && data.organization}
				<p class="mt-2 text-xs text-gray-400 dark:text-neutral-500">{data.organization}{data.date ? ` - ${data.date}` : ''}</p>
			{/if}
			{#if postType === 'OPPORTUNITY'}
				{#if data.commitment}
					<p class="mt-2 text-xs text-gray-400 dark:text-neutral-500">Commitment: {data.commitment}</p>
				{/if}
				{#if data.contact_method}
					<p class="text-xs text-gray-400 dark:text-neutral-500">Contact: {data.contact_method}</p>
				{/if}
			{/if}
			{#if postType === 'BUILD' && data.project_url}
				<a href={String(data.project_url)} target="_blank" rel="noopener noreferrer" class="mt-2 inline-block text-xs text-blue-500 hover:underline">
					{data.project_url}
				</a>
			{/if}
			{#if postType === 'LEARNING' && data.application}
				<p class="mt-2 text-xs italic text-gray-400 dark:text-neutral-500">Application: {data.application}</p>
			{/if}
		{/if}

		<!-- Code snippet -->
		{#if codeSnippet}
			<div class="mt-3 overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-700/50">
				{#if codeLanguage}
					<div class="flex items-center justify-between border-b px-3 py-1.5 border-gray-200 dark:border-neutral-700/50 bg-gray-900">
						<span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">{codeLanguage}</span>
					</div>
				{/if}
				<pre class="overflow-x-auto p-3 text-xs bg-gray-900 text-gray-100"><code class="language-{(codeLanguage ?? '').toLowerCase()}">{codeSnippet}</code></pre>
			</div>
		{/if}

		<!-- Image -->
		{#if imageUrl}
			<div class="mt-3 overflow-hidden rounded-lg">
				<img src={imageUrl} alt="Post attachment" class="w-full object-cover" loading="lazy" />
			</div>
		{/if}

		<!-- Link preview -->
		{#if linkPreview}
			<a
				href={String(linkPreview.url ?? linkUrl ?? '#')}
				target="_blank"
				rel="noopener noreferrer"
				class="mt-3 block overflow-hidden rounded-lg border bg-gray-50 border-gray-200 dark:bg-neutral-700/30 dark:border-neutral-600/50 transition-opacity hover:opacity-80"
			>
				{#if linkPreview.image}
					<img src={String(linkPreview.image)} alt="" class="h-32 w-full object-cover" loading="lazy" />
				{/if}
				<div class="p-3">
					{#if linkPreview.title}
						<p class="text-sm font-medium text-gray-800 dark:text-neutral-200">{linkPreview.title}</p>
					{/if}
					{#if linkPreview.description}
						<p class="mt-1 line-clamp-2 text-xs text-gray-400 dark:text-neutral-500">{linkPreview.description}</p>
					{/if}
					<p class="mt-1 text-[10px] text-gray-400 dark:text-neutral-500">{linkPreview.url ?? linkUrl ?? ''}</p>
				</div>
			</a>
		{:else if linkUrl}
			<a href={linkUrl} target="_blank" rel="noopener noreferrer" class="mt-3 block text-xs text-blue-500 hover:underline break-all">
				{linkUrl}
			</a>
		{/if}

		<!-- Poll widget -->
		{#if pollOptions}
			<div class="mt-3 space-y-2">
				<!-- Poll deadline status -->
				{#if pollDeadline}
					<div class="flex items-center gap-1.5 text-xs">
						{#if isPollClosed}
							<Badge variant="danger" size="sm">
								<span class="flex items-center gap-1">
									<Lock size={10} />
									Closed
								</span>
							</Badge>
						{:else if pollTimeRemaining}
							<span class="flex items-center gap-1 text-gray-400 dark:text-neutral-500">
								<Clock size={10} />
								{pollTimeRemaining}
							</span>
						{/if}
					</div>
				{/if}

				{#each pollOptions as option, i}
					{@const label = String(option.text ?? option.label ?? option)}
					{@const votes = Number(option.votes)}
					{@const totalVotes = pollOptions.reduce((sum: number, o: { votes?: number }) => sum + Number(o.votes), 0)}
					{@const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0}
					<button
						class="relative w-full overflow-hidden rounded-lg border px-3 py-2.5 text-left transition-all duration-300 {hasVoted || isPollClosed ? 'cursor-default' : 'cursor-pointer hover:border-blue-400 dark:hover:border-blue-500'} border-gray-200 dark:border-neutral-700/50"
						onclick={() => handleVoteClick(i)}
						disabled={hasVoted || isPollClosed}
					>
						{#if hasVoted || isPollClosed}
							<div
								class="absolute inset-y-0 left-0 rounded-r bg-blue-500/10 transition-all duration-500"
								style="width: {pct}%"
							></div>
						{:else}
							<!-- Radio circle indicator before voting -->
							<div class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-gray-300 dark:border-neutral-600"></div>
						{/if}
						<div class="relative flex items-center justify-between text-sm {hasVoted || isPollClosed ? '' : 'pl-6'}">
							<span class="text-gray-800 dark:text-neutral-200">{label}</span>
							{#if hasVoted || isPollClosed}
								<span class="text-xs font-medium text-gray-500 dark:text-neutral-400">{pct}%</span>
							{/if}
						</div>
					</button>
				{/each}

				<!-- Total votes count -->
				{#if pollOptions}
					{@const totalVotes = pollOptions.reduce((sum: number, o: { votes?: number }) => sum + Number(o.votes), 0)}
					<p class="text-xs text-gray-400 dark:text-neutral-500">
						{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
					</p>
				{/if}
			</div>
		{/if}

		<!-- Skills tags -->
		{#if (hardSkills && hardSkills.length > 0) || (softSkills && softSkills.length > 0)}
			<div class="mt-3 flex flex-wrap gap-1.5">
				{#if hardSkills}
				{#each hardSkills as skill}
					<Badge variant="default" size="sm">{skill}</Badge>
				{/each}
				{/if}
				{#if softSkills}
				{#each softSkills as skill}
					<Badge variant="info" size="sm">{skill}</Badge>
				{/each}
				{/if}
			</div>
		{/if}

		<!-- Engagement bar -->
		<div class="mt-3 border-t pt-2 border-gray-100 dark:border-neutral-700/50">
			<EngagementBar
				{post}
				{isLiked}
				{isBookmarked}
				{reactionCounts}
				currentReaction={currentReaction ?? null}
				onlike={(reactionType?: string) => onlike(postId, reactionType)}
				onunlike={() => onunlike(postId)}
				onbookmark={() => onbookmark(postId)}
				onunbookmark={() => onunbookmark(postId)}
				oncommenttoggle={() => showComments = !showComments}
				onrepost={() => onrepost(postId)}
			/>
		</div>

		<!-- Thread link -->
		{#if hasThreadChildren}
			<div class="mt-2 border-t pt-2 border-gray-100 dark:border-neutral-700/50">
				<a
					href="/feed/thread/{postId}"
					class="flex items-center gap-1 text-xs font-medium text-blue-500 hover:underline"
				>
					<MessageSquare size={12} />
					View thread
				</a>
			</div>
		{/if}

		<!-- Comment section -->
		{#if showComments}
			<div class="mt-2 border-t pt-3 border-gray-100 dark:border-neutral-700/50">
				<CommentSection postId={postId} currentUserId={currentUserId} />
			</div>
		{/if}
	</Card>
</article>

<!-- Delete confirmation modal -->
<ConfirmModal
	open={showDeleteConfirm}
	onClose={() => showDeleteConfirm = false}
	onConfirm={handleDeleteConfirm}
	title="Delete post"
	message="Are you sure you want to delete this post? This action cannot be undone."
	confirmLabel="Delete"
	confirmVariant="danger"
/>
