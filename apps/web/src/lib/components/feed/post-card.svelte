<script lang="ts">
	import { Avatar } from 'ui';
	import { Trash2, Flag, MoreHorizontal } from 'lucide-svelte';
	import { Button } from 'ui';
	import EngagementBar from './engagement-bar.svelte';
	import CommentSection from './comment-section.svelte';

	type Props = {
		post: Record<string, unknown>;
		currentUserId: string;
		onlike: (id: string) => void;
		onunlike: (id: string) => void;
		onbookmark: (id: string) => void;
		onunbookmark: (id: string) => void;
		ondelete: (id: string) => void;
		onrepost: (id: string) => void;
		onreport: (id: string) => void;
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
		onreport
	}: Props = $props();

	let showComments = $state(false);
	let showMenu = $state(false);

	const postId = $derived(String(post.id ?? ''));
	const author = $derived(post.author as Record<string, unknown> | undefined);
	const authorName = $derived(String(author?.name ?? author?.username ?? 'Unknown'));
	const authorUsername = $derived(String(author?.username ?? ''));
	const authorPhoto = $derived((author?.photoURL ?? author?.avatarUrl ?? null) as string | null);
	const postType = $derived(String(post.type ?? ''));
	const data = $derived(post.data as Record<string, unknown> | undefined);
	const content = $derived(String(post.content ?? ''));
	const imageUrl = $derived((post.imageUrl ?? data?.imageUrl ?? null) as string | null);
	const linkPreview = $derived(post.linkPreview as Record<string, unknown> | null ?? null);
	const linkUrl = $derived((post.linkUrl ?? null) as string | null);
	const hardSkills = $derived((post.hardSkills ?? post.hard_skills ?? []) as string[]);
	const softSkills = $derived((post.softSkills ?? post.soft_skills ?? []) as string[]);
	const isLiked = $derived(Boolean(post.isLiked ?? post.liked ?? false));
	const isBookmarked = $derived(Boolean(post.isBookmarked ?? post.bookmarked ?? false));
	const isOwner = $derived(String(author?.id ?? post.userId ?? '') === currentUserId);
	const createdAt = $derived(post.createdAt as string | undefined);

	const pollOptions = $derived(
		postType === 'QUESTION' && data?.options ? (data.options as Record<string, unknown>[]) : null
	);

	const title = $derived(data?.title as string | undefined ?? data?.question as string | undefined ?? null);

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

	const typeBadgeLabel: Record<string, string> = {
		ACHIEVEMENT: 'Achievement',
		OPPORTUNITY: 'Opportunity',
		LEARNING: 'Learning',
		BUILD: 'Build',
		QUESTION: 'Question'
	};

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('[data-post-menu]')) {
			showMenu = false;
		}
	}

	$effect(() => {
		if (showMenu) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<article class="rounded-xl border bg-white dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700/50 p-4 transition-colors">
	<!-- Header: avatar + author info + menu -->
	<div class="flex items-start gap-3">
		<Avatar name={authorName} photoURL={authorPhoto} size="md" />

		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-1.5 text-sm">
				<span class="font-semibold text-gray-800 dark:text-neutral-200">{authorName}</span>
				{#if authorUsername}
					<span class="text-gray-400 dark:text-neutral-500">@{authorUsername}</span>
				{/if}
				<span class="text-gray-400 dark:text-neutral-500">&middot;</span>
				<span class="text-xs text-gray-400 dark:text-neutral-500">{formatRelativeTime(createdAt)}</span>
			</div>

			{#if postType && typeBadgeLabel[postType]}
				<span class="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gray-800 text-gray-50 dark:bg-neutral-700 dark:text-neutral-300">
					{typeBadgeLabel[postType]}
				</span>
			{/if}
		</div>

		<div class="relative" data-post-menu>
			<Button variant="icon" size="xs" onclick={() => showMenu = !showMenu}>
				<MoreHorizontal size={16} />
			</Button>

			{#if showMenu}
				<div class="absolute right-0 z-10 mt-1 w-36 rounded-lg border py-1 shadow-lg bg-white dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700/50">
					{#if isOwner}
						<Button variant="menu" size="sm" onclick={() => { showMenu = false; ondelete(postId); }}>
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
				</div>
			{/if}
		</div>
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

	<!-- Image -->
	{#if imageUrl}
		<div class="mt-3 overflow-hidden rounded-lg">
			<img src={imageUrl} alt="Post image" class="w-full object-cover" loading="lazy" />
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
			{#each pollOptions as option, i}
				{@const label = String((option as Record<string, unknown>).text ?? (option as Record<string, unknown>).label ?? option)}
				{@const votes = Number((option as Record<string, unknown>).votes ?? 0)}
				{@const totalVotes = pollOptions.reduce((sum, o) => sum + Number((o as Record<string, unknown>).votes ?? 0), 0)}
				{@const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0}
				<div class="relative overflow-hidden rounded-lg border px-3 py-2 border-gray-200 dark:border-neutral-700/50">
					<div class="absolute inset-y-0 left-0 bg-blue-500/10" style="width: {pct}%"></div>
					<div class="relative flex items-center justify-between text-sm">
						<span class="text-gray-800 dark:text-neutral-200">{label}</span>
						<span class="text-xs text-gray-400 dark:text-neutral-500">{pct}%</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Skills tags -->
	{#if (hardSkills.length > 0 || softSkills.length > 0)}
		<div class="mt-3 flex flex-wrap gap-1.5">
			{#each hardSkills as skill}
				<span class="rounded-full px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-neutral-700/50 dark:text-neutral-300">{skill}</span>
			{/each}
			{#each softSkills as skill}
				<span class="rounded-full border px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-neutral-700/50 dark:text-neutral-300 border-current/10">{skill}</span>
			{/each}
		</div>
	{/if}

	<!-- Engagement bar -->
	<div class="mt-3 border-t pt-2 border-gray-100 dark:border-neutral-700/50">
		<EngagementBar
			{post}
			{isLiked}
			{isBookmarked}
			onlike={() => onlike(postId)}
			onunlike={() => onunlike(postId)}
			onbookmark={() => onbookmark(postId)}
			onunbookmark={() => onunbookmark(postId)}
			oncommenttoggle={() => showComments = !showComments}
			onrepost={() => onrepost(postId)}
		/>
	</div>

	<!-- Comment section -->
	{#if showComments}
		<div class="mt-2 border-t pt-3 border-gray-100 dark:border-neutral-700/50">
			<CommentSection postId={postId} currentUserId={currentUserId} />
		</div>
	{/if}
</article>
