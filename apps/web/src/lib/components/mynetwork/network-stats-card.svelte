<script lang="ts">
import { Clock, Eye, UserCheck, Users } from 'lucide-svelte';
import { locale } from '$lib/state/locale.svelte';

type Props = {
  connections: number;
  followers: number;
  following: number;
  pending: number;
};

let { connections, followers, following, pending }: Props = $props();

const t = $derived(locale.t);

const items = $derived([
  {
    label: t('network.connections'),
    value: connections,
    icon: Users,
    href: '/social/network/connections',
  },
  {
    label: t('network.followers'),
    value: followers,
    icon: Eye,
    href: '/social/network/followers',
  },
  {
    label: t('network.following'),
    value: following,
    icon: UserCheck,
    href: '/social/network/following',
  },
  {
    label: t('network.invitations'),
    value: pending,
    icon: Clock,
    href: '/social/network/invitation-manager/received',
    highlight: pending > 0,
  },
]);
</script>

<section
	class="rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-800/50"
>
	<h2 class="px-5 pt-4 pb-2 text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
		{t('network.statsTitle')}
	</h2>
	<div class="grid grid-cols-2 gap-px border-t border-gray-200 bg-gray-200 dark:border-neutral-800 dark:bg-neutral-800 sm:grid-cols-4">
		{#each items as item (item.label)}
			{@const Icon = item.icon}
			<a
				href={item.href}
				class="group flex flex-col gap-1 bg-white px-4 py-3 transition-colors hover:bg-gray-50 dark:bg-neutral-800/50 dark:hover:bg-neutral-800"
			>
				<span class="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-neutral-500">
					<Icon size={12} />
					{item.label}
				</span>
				<span
					class="text-xl font-semibold tabular-nums {item.highlight
						? 'text-red-500 dark:text-red-400'
						: 'text-gray-900 dark:text-neutral-100'}"
				>
					{item.value}
				</span>
			</a>
		{/each}
	</div>
</section>
