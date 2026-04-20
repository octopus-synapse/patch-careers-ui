<script lang="ts">
import {
  createAdminChatGetConversations,
  createAdminChatGetStats,
  createAdminCollaborationsGetCollaborations,
  createAdminCollaborationsGetStats,
} from 'api-client';
import { formatDate } from 'i18n';
import { Loader2 } from 'lucide-svelte';
import { SegmentToggle } from 'ui';
import { browser } from '$app/environment';
import DataTable from '$lib/components/admin/data-table.svelte';
import Pagination from '$lib/components/admin/pagination.svelte';
import StatCard from '$lib/components/admin/stat-card.svelte';
import { locale } from '$lib/locale.svelte';

const t = $derived(locale.t);

let activeTab = $state<'chat' | 'collaborations'>('chat');
let chatPage = $state(1);
let collabPage = $state(1);

const tabOptions = $derived([
  { value: 'chat', label: t?.('admin.chat.chatTab') ?? 'Chat' },
  { value: 'collaborations', label: t?.('admin.chat.collaborationsTab') ?? 'Collaborations' },
]);

const chatStatsQuery = createAdminChatGetStats(() => ({
  query: { enabled: browser },
}));
const chatConversationsQuery = createAdminChatGetConversations(
  () => ({ page: chatPage, pageSize: 20 }),
  () => ({ query: { enabled: browser && activeTab === 'chat' } }),
);
const collabStatsQuery = createAdminCollaborationsGetStats(() => ({
  query: { enabled: browser },
}));
const collabListQuery = createAdminCollaborationsGetCollaborations(
  () => ({ page: collabPage, pageSize: 20 }),
  () => ({ query: { enabled: browser && activeTab === 'collaborations' } }),
);

const chatStats = $derived(chatStatsQuery.data);
const chatData = $derived(chatConversationsQuery.data);
const conversations = $derived(chatData?.items);
const chatTotalPages = $derived(chatData?.totalPages);

const collabStats = $derived(collabStatsQuery.data);
const collabData = $derived(collabListQuery.data);
const collaborations = $derived(collabData?.items);
const collabTotalPages = $derived(collabData?.totalPages);

const chatColumns = $derived([
  { key: 'participants', label: t?.('admin.chat.participants') ?? 'Participants' },
  { key: 'lastMessage', label: t?.('admin.chat.lastMessage') ?? 'Last Message' },
  { key: 'lastMessageAt', label: t?.('admin.chat.date') ?? 'Date', width: '120px' },
]);

const collabColumns = $derived([
  { key: 'user', label: t?.('admin.chat.user') ?? 'User' },
  { key: 'resume', label: t?.('admin.chat.resume') ?? 'Resume' },
  { key: 'role', label: t?.('admin.chat.collaboratorRole') ?? 'Role', width: '100px' },
  { key: 'invitedAt', label: t?.('admin.chat.date') ?? 'Date', width: '120px' },
]);
</script>

<svelte:head>
	<title>{t?.('admin.chat.title') ?? 'Chat'}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
			{t?.('admin.chat.title') ?? 'Chat & Collaboration'}
		</h1>
		<SegmentToggle
			options={tabOptions}
			selected={activeTab}
			onchange={(v) => activeTab = v as 'chat' | 'collaborations'}
		/>
	</div>

	<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
		<StatCard label={t?.('admin.chat.totalConversations') ?? 'Conversations'} value={chatStats?.totalConversations ?? 0} />
		<StatCard label={t?.('admin.chat.totalMessages') ?? 'Messages'} value={chatStats?.totalMessages ?? 0} />
		<StatCard label={t?.('admin.chat.activeUsers') ?? 'Active Users'} value={chatStats?.activeChatUsers ?? 0} />
		<StatCard label={t?.('admin.chat.totalCollaborations') ?? 'Collaborations'} value={collabStats?.totalCollaborations ?? 0} />
	</div>

	{#if activeTab === 'chat'}
		<DataTable
			columns={chatColumns}
			data={conversations}
			loading={chatConversationsQuery.isLoading}
			emptyMessage={t?.('admin.chat.noConversations') ?? 'No conversations'}
		>
			{#snippet cell({ row, key, value })}
				{#if key === 'participants'}
					{@const p1 = row.participant1}
					{@const p2 = row.participant2}
					<span class="text-sm">
						{p1?.name ?? p1?.email ?? '—'} & {p2?.name ?? p2?.email ?? '—'}
					</span>
				{:else if key === 'lastMessage'}
					<span class="max-w-[200px] truncate text-sm text-gray-500 dark:text-neutral-500">
						{row.lastMessageContent ?? '—'}
					</span>
				{:else if key === 'lastMessageAt'}
					{row.lastMessageAt ? formatDate(row.lastMessageAt, locale.current) : '—'}
				{:else}
					{value ?? '—'}
				{/if}
			{/snippet}
		</DataTable>

		{#if chatTotalPages && chatTotalPages > 1}
			<div class="flex justify-center">
				<Pagination page={chatPage} totalPages={chatTotalPages} onpagechange={(p) => chatPage = p} />
			</div>
		{/if}
	{:else}
		<DataTable
			columns={collabColumns}
			data={collaborations}
			loading={collabListQuery.isLoading}
			emptyMessage={t?.('admin.chat.noCollaborations') ?? 'No collaborations'}
		>
			{#snippet cell({ row, key, value })}
				{#if key === 'user'}
					{@const user = row.user}
					<span class="text-sm">{user?.name ?? user?.email ?? '—'}</span>
				{:else if key === 'resume'}
					{@const resume = row.resume}
					<span class="text-sm">{resume?.title ?? '—'}</span>
				{:else if key === 'invitedAt'}
					{row.invitedAt ? formatDate(row.invitedAt, locale.current) : '—'}
				{:else}
					{value ?? '—'}
				{/if}
			{/snippet}
		</DataTable>

		{#if collabTotalPages && collabTotalPages > 1}
			<div class="flex justify-center">
				<Pagination page={collabPage} totalPages={collabTotalPages} onpagechange={(p) => collabPage = p} />
			</div>
		{/if}
	{/if}
</div>
