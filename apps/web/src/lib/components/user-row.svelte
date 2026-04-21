<script lang="ts">
import type { Snippet } from 'svelte';
import { Avatar } from 'ui';

type UserInfo = {
  id: string;
  name?: string | null;
  username?: string | null;
  photoURL?: string | null;
};

type Props = {
  user: UserInfo;
  actions?: Snippet;
  badge?: string;
};

let { user, actions, badge }: Props = $props();

const displayName = $derived(user.name ?? user.username ?? '?');
</script>

<div class="flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3.5">
	<a href="/my-profile/public/@{user.username ?? ''}" class="shrink-0">
		<Avatar name={displayName} photoURL={user.photoURL} size="md" />
	</a>
	<div class="min-w-0 flex-1">
		<a
			href="/my-profile/public/@{user.username ?? ''}"
			class="block truncate text-sm font-semibold text-gray-800 dark:text-neutral-200 hover:underline"
			title={displayName}
		>
			{displayName}
		</a>
		{#if user.username}
			<p class="truncate text-[11px] text-gray-500 dark:text-neutral-500">@{user.username}</p>
		{/if}
	</div>
	{#if badge}
		<span class="shrink-0 text-[10px] uppercase tracking-wider text-gray-500 dark:text-neutral-500">{badge}</span>
	{/if}
	{#if actions}
		<div class="flex shrink-0 items-center gap-2">
			{@render actions()}
		</div>
	{/if}
</div>
