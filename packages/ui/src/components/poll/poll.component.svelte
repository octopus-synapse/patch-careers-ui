<script lang="ts">
import type { PollOption } from './poll.types';

type PollLabels = {
  votes: (count: number) => string;
  closed: string;
  closesIn: (humanRemaining: string) => string;
  humanDays: (n: number) => string;
  humanHours: (n: number) => string;
  humanMinutes: (n: number) => string;
  removeVote?: string;
};

type Props = {
  options: PollOption[];
  totalVotes: number;
  /** The option id the current user has voted on, or null if they haven't voted. */
  myVote: string | null;
  /** ISO timestamp of when the poll closes, or null if it's already closed / no deadline. */
  closesAt: string | null;
  disabled?: boolean;
  labels: PollLabels;
  onvote: (optionId: string) => void;
  onremoveVote?: () => void;
};

let {
  options,
  totalVotes,
  myVote,
  closesAt,
  disabled = false,
  labels,
  onvote,
  onremoveVote,
}: Props = $props();

const closed = $derived(Boolean(closesAt && new Date(closesAt).getTime() < Date.now()));
const showResults = $derived(myVote !== null || closed);

const remaining = $derived.by(() => {
  if (!closesAt) return null;
  const diff = new Date(closesAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86_400_000);
  if (days >= 1) return labels.humanDays(days);
  const hours = Math.floor(diff / 3_600_000);
  if (hours >= 1) return labels.humanHours(hours);
  const mins = Math.max(1, Math.floor(diff / 60_000));
  return labels.humanMinutes(mins);
});

function percentFor(option: PollOption): number {
  if (totalVotes <= 0) return 0;
  return Math.round((option.votes / totalVotes) * 100);
}
</script>

<div class="space-y-2">
	{#each options as option}
		{@const selected = option.id === myVote}
		{@const pct = percentFor(option)}
		<button
			type="button"
			disabled={disabled || closed || (showResults && !onremoveVote)}
			onclick={() => {
				if (closed || disabled) return;
				if (selected && onremoveVote) onremoveVote();
				else if (!selected) onvote(option.id);
			}}
			class="relative block w-full overflow-hidden rounded-md border text-left transition-colors disabled:cursor-default {selected
				? 'border-cyan-500 bg-cyan-50 dark:border-cyan-400 dark:bg-cyan-900/20'
				: 'border-gray-200 hover:border-gray-400 dark:border-neutral-700 dark:hover:border-neutral-500'}"
		>
			{#if showResults}
				<div
					aria-hidden="true"
					class="absolute inset-y-0 left-0 {selected
						? 'bg-cyan-100 dark:bg-cyan-900/40'
						: 'bg-gray-100 dark:bg-neutral-800'}"
					style:width={`${pct}%`}
				></div>
			{/if}
			<div
				class="relative flex items-center justify-between gap-3 px-3 py-2 text-sm text-gray-800 dark:text-neutral-200"
			>
				<span class="font-medium">{option.label}</span>
				{#if showResults}
					<span class="shrink-0 tabular-nums text-gray-600 dark:text-neutral-400">
						{pct}% &middot; {option.votes}
					</span>
				{/if}
			</div>
		</button>
	{/each}

	<div class="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400">
		<span>{labels.votes(totalVotes)}</span>
		{#if closed}
			<span aria-hidden="true">&bull;</span>
			<span>{labels.closed}</span>
		{:else if remaining}
			<span aria-hidden="true">&bull;</span>
			<span>{labels.closesIn(remaining)}</span>
		{/if}
		{#if myVote && !closed && onremoveVote && labels.removeVote}
			<span aria-hidden="true">&bull;</span>
			<button
				type="button"
				class="text-cyan-600 hover:underline dark:text-cyan-400"
				onclick={() => onremoveVote()}
			>
				{labels.removeVote}
			</button>
		{/if}
	</div>
</div>
