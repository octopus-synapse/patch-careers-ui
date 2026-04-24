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
  /**
   * `inline` — actions sit to the right of the name (default, fits wider rows).
   * `stacked` — actions wrap below the name on the next row; use this in
   *   narrow sidebars where the inline layout truncates names.
   */
  layout?: 'inline' | 'stacked';
};

let { user, actions, badge, layout = 'inline' }: Props = $props();

const displayName = $derived(user.name ?? user.username ?? '?');
</script>

{#if layout === 'stacked'}
	<div class="flex flex-col gap-2 px-3 py-2.5 sm:px-5 sm:py-3.5">
		<div class="flex items-center gap-2 sm:gap-3">
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
		</div>
		{#if actions}
			<div class="flex flex-wrap items-center justify-end gap-2 pl-12 sm:pl-13">
				{@render actions()}
			</div>
		{/if}
	</div>
{:else}
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
{/if}
