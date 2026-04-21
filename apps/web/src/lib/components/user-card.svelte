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
  subtitle?: string;
  actions?: Snippet;
};

let { user, subtitle, actions }: Props = $props();

const displayName = $derived(user.name ?? user.username ?? '?');
</script>

<div class="flex flex-col items-center gap-2 rounded-xl border p-4 border-gray-200 dark:border-neutral-800">
	<a href="/my-profile/public/@{user.username ?? ''}">
		<Avatar name={displayName} photoURL={user.photoURL} size="lg" />
	</a>
	<a href="/my-profile/public/@{user.username ?? ''}" class="text-center text-xs font-semibold text-gray-800 dark:text-neutral-200 hover:underline">
		{displayName}
	</a>
	{#if user.username}
		<a
			href="/my-profile/public/@{user.username}"
			class="text-[10px] text-gray-500 dark:text-neutral-500 hover:underline"
		>
			@{user.username}
		</a>
	{/if}
	{#if subtitle}
		<span class="text-[10px] text-gray-500 dark:text-neutral-500 text-center">{subtitle}</span>
	{/if}
	{#if actions}
		{@render actions()}
	{/if}
</div>
