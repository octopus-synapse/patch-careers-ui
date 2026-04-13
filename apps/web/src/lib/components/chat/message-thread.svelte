<script lang="ts">
	import { Avatar } from 'ui';

	type Message = {
		id: string;
		content: string;
		senderId: string;
		createdAt: string;
		isRead: boolean;
		sender: { id: string; name: string | null; photoURL: string | null };
	};

	type Props = {
		messages: Message[];
		currentUserId: string;
	};

	let { messages, currentUserId }: Props = $props();

	function formatTime(dateStr: string): string {
		return new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
	}

	function isOwn(msg: Message): boolean {
		return msg.senderId === currentUserId;
	}

	let container: HTMLDivElement;

	$effect(() => {
		if (messages.length && container) {
			requestAnimationFrame(() => {
				container.scrollTop = container.scrollHeight;
			});
		}
	});
</script>

<div
	bind:this={container}
	class="flex flex-1 flex-col overflow-y-auto px-6 py-4 scrollbar-thin"
	style="min-height: 0;"
>
	<!-- Spacer pushes messages to bottom when few -->
	<div class="flex-1"></div>

	<div class="flex flex-col gap-0.5">
		{#each messages as msg, i}
			{@const own = isOwn(msg)}
			{@const showAvatar = !own && (i === 0 || messages[i - 1].senderId !== msg.senderId)}
			{@const consecutive = i > 0 && messages[i - 1].senderId === msg.senderId}

			<div class="flex {own ? 'justify-end' : 'justify-start'} {consecutive ? '' : 'mt-3'}">
				{#if !own && showAvatar}
					<div class="mr-2 flex-shrink-0 self-end mb-5">
						<Avatar name={msg.sender.name ?? '?'} photoURL={msg.sender.photoURL} size="sm" />
					</div>
				{:else if !own}
					<div class="mr-2 w-8 flex-shrink-0"></div>
				{/if}

				<div class="max-w-[65%]">
					<div class="rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed shadow-sm
						{own ? 'bg-cyan-100 dark:bg-cyan-900/50 text-gray-900 dark:text-cyan-50 rounded-br-sm' : 'bg-white dark:bg-neutral-800 text-gray-800 dark:text-neutral-200 rounded-bl-sm'}">
						{msg.content}
					</div>
					<span class="mt-0.5 block text-[9px] {own ? 'text-right' : 'text-left'} text-gray-400 dark:text-neutral-600">
						{formatTime(msg.createdAt)}
					</span>
				</div>
			</div>
		{/each}
	</div>

	{#if messages.length === 0}
		<div class="flex items-center justify-center pb-8">
			<span class="text-[10px] uppercase tracking-widest text-gray-400 dark:text-neutral-600">send a message to start</span>
		</div>
	{/if}
</div>
