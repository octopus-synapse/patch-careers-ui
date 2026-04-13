<script lang="ts">
	import {
		createAdminChatGetStats,
		createAdminChatGetConversations,
		createAdminCollaborationsGetStats,
		createAdminCollaborationsGetCollaborations,
	} from 'api-client';
	import { browser } from '$app/environment';
	import { colorSchema } from '$lib/color-schema.svelte';
	import { locale } from '$lib/locale.svelte';
	import { SegmentToggle } from 'ui';
	import { Loader2 } from 'lucide-svelte';
	import StatCard from '$lib/components/admin/stat-card.svelte';
	import DataTable from '$lib/components/admin/data-table.svelte';
	import Pagination from '$lib/components/admin/pagination.svelte';

	const cs = $derived(colorSchema.mode);
	const t = $derived(locale.t);
	const text = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const muted = $derived(cs === 'dark' ? 'text-neutral-500' : 'text-gray-500');

	let activeTab = $state<'chat' | 'collaborations'>('chat');
	let chatPage = $state(1);
	let collabPage = $state(1);

	const tabOptions = [
		{ value: 'chat', label: t?.('admin.chat.chatTab') ?? 'Chat' },
		{ value: 'collaborations', label: t?.('admin.chat.collaborationsTab') ?? 'Collaborations' },
	];

	const chatStatsQuery = createAdminChatGetStats(() => ({
		query: { enabled: browser }
	}));
	const chatConversationsQuery = createAdminChatGetConversations(
		() => ({ page: chatPage, pageSize: 20 }),
		() => ({ query: { enabled: browser && activeTab === 'chat' } }),
	);
	const collabStatsQuery = createAdminCollaborationsGetStats(() => ({
		query: { enabled: browser }
	}));
	const collabListQuery = createAdminCollaborationsGetCollaborations(
		() => ({ page: collabPage, pageSize: 20 }),
		() => ({ query: { enabled: browser && activeTab === 'collaborations' } }),
	);

	const chatStats = $derived((chatStatsQuery.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined);
	const chatData = $derived(((chatConversationsQuery.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined);
	const conversations = $derived((chatData?.items as Record<string, unknown>[]) ?? []);
	const chatTotalPages = $derived((chatData?.totalPages as number) ?? 1);

	const collabStats = $derived((collabStatsQuery.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined);
	const collabData = $derived(((collabListQuery.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined);
	const collaborations = $derived((collabData?.items as Record<string, unknown>[]) ?? []);
	const collabTotalPages = $derived((collabData?.totalPages as number) ?? 1);

	const chatColumns = [
		{ key: 'participants', label: t?.('admin.chat.participants') ?? 'Participants' },
		{ key: 'lastMessage', label: t?.('admin.chat.lastMessage') ?? 'Last Message' },
		{ key: 'lastMessageAt', label: t?.('admin.chat.date') ?? 'Date', width: '120px' },
	];

	const collabColumns = [
		{ key: 'user', label: t?.('admin.chat.user') ?? 'User' },
		{ key: 'resume', label: t?.('admin.chat.resume') ?? 'Resume' },
		{ key: 'role', label: t?.('admin.chat.collaboratorRole') ?? 'Role', width: '100px' },
		{ key: 'invitedAt', label: t?.('admin.chat.date') ?? 'Date', width: '120px' },
	];
</script>

<svelte:head>
	<title>{t?.('admin.chat.title') ?? 'Chat'}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-semibold tracking-tight {text}">
			{t?.('admin.chat.title') ?? 'Chat & Collaboration'}
		</h1>
		<SegmentToggle
			options={tabOptions}
			selected={activeTab}
			colorSchema={cs}
			onchange={(v) => activeTab = v as 'chat' | 'collaborations'}
		/>
	</div>

	<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
		<StatCard label={t?.('admin.chat.totalConversations') ?? 'Conversations'} value={chatStats?.totalConversations as number ?? 0} colorSchema={cs} />
		<StatCard label={t?.('admin.chat.totalMessages') ?? 'Messages'} value={chatStats?.totalMessages as number ?? 0} colorSchema={cs} />
		<StatCard label={t?.('admin.chat.activeUsers') ?? 'Active Users'} value={chatStats?.activeChatUsers as number ?? 0} colorSchema={cs} />
		<StatCard label={t?.('admin.chat.totalCollaborations') ?? 'Collaborations'} value={collabStats?.totalCollaborations as number ?? 0} colorSchema={cs} />
	</div>

	{#if activeTab === 'chat'}
		<DataTable
			columns={chatColumns}
			data={conversations}
			loading={chatConversationsQuery.isLoading}
			emptyMessage={t?.('admin.chat.noConversations') ?? 'No conversations'}
			colorSchema={cs}
		>
			{#snippet cell({ row, key })}
				{#if key === 'participants'}
					{@const p1 = row.participant1 as Record<string, unknown> | undefined}
					{@const p2 = row.participant2 as Record<string, unknown> | undefined}
					<span class="text-sm">
						{p1?.name ?? p1?.email ?? '—'} & {p2?.name ?? p2?.email ?? '—'}
					</span>
				{:else if key === 'lastMessage'}
					<span class="max-w-[200px] truncate text-sm {muted}">
						{row.lastMessageContent ?? '—'}
					</span>
				{:else if key === 'lastMessageAt'}
					{row.lastMessageAt ? new Date(row.lastMessageAt as string).toLocaleDateString() : '—'}
				{:else}
					{row[key] ?? '—'}
				{/if}
			{/snippet}
		</DataTable>

		{#if chatTotalPages > 1}
			<div class="flex justify-center">
				<Pagination page={chatPage} totalPages={chatTotalPages} colorSchema={cs} onpagechange={(p) => chatPage = p} />
			</div>
		{/if}
	{:else}
		<DataTable
			columns={collabColumns}
			data={collaborations}
			loading={collabListQuery.isLoading}
			emptyMessage={t?.('admin.chat.noCollaborations') ?? 'No collaborations'}
			colorSchema={cs}
		>
			{#snippet cell({ row, key })}
				{#if key === 'user'}
					{@const user = row.user as Record<string, unknown> | undefined}
					<span class="text-sm">{user?.name ?? user?.email ?? '—'}</span>
				{:else if key === 'resume'}
					{@const resume = row.resume as Record<string, unknown> | undefined}
					<span class="text-sm">{resume?.title ?? '—'}</span>
				{:else if key === 'invitedAt'}
					{row.invitedAt ? new Date(row.invitedAt as string).toLocaleDateString() : '—'}
				{:else}
					{row[key] ?? '—'}
				{/if}
			{/snippet}
		</DataTable>

		{#if collabTotalPages > 1}
			<div class="flex justify-center">
				<Pagination page={collabPage} totalPages={collabTotalPages} colorSchema={cs} onpagechange={(p) => collabPage = p} />
			</div>
		{/if}
	{/if}
</div>
