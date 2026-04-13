<script lang="ts">
	import {
		createNotificationsGetUnreadCount,
		createNotificationsGetByUser,
		notificationsMarkRead,
		getNotificationsGetUnreadCountQueryKey,
		getNotificationsGetByUserQueryKey,
		type NotificationDto,
	} from 'api-client';
	import { browser } from '$app/environment';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { Avatar, Dropdown } from 'ui';
	import { Bell } from 'lucide-svelte';
	import { locale } from '$lib/locale.svelte';

	const t = $derived(locale.t);
	const queryClient = useQueryClient();

	let isOpen = $state(false);

	const unreadQuery = createNotificationsGetUnreadCount(
		() => ({
			query: {
				enabled: browser,
				refetchInterval: 30000,
			},
		})
	);

	const unreadCount = $derived(unreadQuery.data?.count);

	const notificationsQuery = createNotificationsGetByUser(
		() => ({ cursor: '', limit: 10 }),
		() => ({
			query: { enabled: browser && isOpen },
		})
	);

	const notifications = $derived(notificationsQuery.data?.data);

	function getNotificationMessage(notification: NotificationDto): string {
		const type = notification.type;
		const tKey = `notifications.${type}`;
		return t(tKey) ?? type ?? '';
	}

	function timeAgo(dateStr: string): string {
		const now = Date.now();
		const diff = now - new Date(dateStr).getTime();
		const minutes = Math.floor(diff / 60000);
		if (minutes < 1) return t('feed.justNow');
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h`;
		const days = Math.floor(hours / 24);
		if (days < 30) return `${days}d`;
		return new Date(dateStr).toLocaleDateString();
	}

	async function handleMarkAllRead() {
		await notificationsMarkRead();
		queryClient.invalidateQueries({ queryKey: getNotificationsGetUnreadCountQueryKey() });
		queryClient.invalidateQueries({ queryKey: getNotificationsGetByUserQueryKey() });
	}

	async function handleNotificationClick(notification: NotificationDto) {
		if (!notification.read) {
			await notificationsMarkRead();
			queryClient.invalidateQueries({ queryKey: getNotificationsGetUnreadCountQueryKey() });
			queryClient.invalidateQueries({ queryKey: getNotificationsGetByUserQueryKey() });
		}
		isOpen = false;
	}
</script>

<Dropdown
	open={isOpen}
	onclose={() => isOpen = false}
>
	{#snippet trigger()}
		<button
			onclick={() => isOpen = !isOpen}
			class="relative flex items-center justify-center rounded-lg p-1.5 transition-colors text-gray-500 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-200"
			aria-label={t('notifications.title')}
		>
			<Bell size={16} />
			{#if unreadCount && unreadCount > 0}
				<span class="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
					{unreadCount > 99 ? '99+' : unreadCount}
				</span>
			{/if}
		</button>
	{/snippet}

	<div class="w-80 max-h-96 overflow-hidden flex flex-col">
		<!-- Header -->
		<div class="flex items-center justify-between border-b px-4 py-3 border-gray-200 dark:border-neutral-700">
			<span class="text-xs font-semibold text-gray-800 dark:text-neutral-200">{t('notifications.title')}</span>
			{#if unreadCount && unreadCount > 0}
				<button
					onclick={handleMarkAllRead}
					class="text-[10px] font-medium text-blue-500 hover:text-blue-600 transition-colors"
				>
					{t('notifications.markAllRead')}
				</button>
			{/if}
		</div>

		<!-- Notifications list -->
		<div class="overflow-y-auto flex-1">
			{#if !notifications || notifications.length === 0}
				<div class="px-4 py-8 text-center">
					<Bell size={20} class="mx-auto mb-2 text-gray-500 dark:text-neutral-500" />
					<p class="text-xs text-gray-500 dark:text-neutral-500">{t('notifications.noNotifications')}</p>
				</div>
			{:else}
				{#each notifications as notification}
					{@const actor = notification.actor}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						onclick={() => handleNotificationClick(notification)}
						onkeydown={(e) => { if (e.key === 'Enter') handleNotificationClick(notification); }}
						role="button"
						tabindex="0"
						class="flex items-start gap-2.5 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-neutral-700/50 {!notification.read ? 'bg-blue-50/50 dark:bg-neutral-800/30' : ''}"
					>
						<Avatar
							name={actor?.name ?? actor?.username ?? '?'}
							photoURL={actor?.photoURL}
							size="sm"
						/>
						<div class="min-w-0 flex-1">
							<p class="text-xs leading-relaxed text-gray-800 dark:text-neutral-200">
								<span class="font-semibold">{actor?.name ?? actor?.username}</span>
								{' '}{getNotificationMessage(notification)}
							</p>
							<span class="text-[10px] text-gray-500 dark:text-neutral-500">
								{timeAgo(notification.createdAt)}
							</span>
						</div>
						{#if !notification.read}
							<span class="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></span>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	</div>
</Dropdown>
