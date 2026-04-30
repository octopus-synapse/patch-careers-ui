<script lang="ts">
import { cubicOut } from 'svelte/easing';
import { fly } from 'svelte/transition';
import ReactionIcon from './reaction-icon.component.svelte';
import { REACTIONS, type ReactionType } from './reactions';

type Props = {
  current?: ReactionType | null;
  labels: {
    reaction: (type: ReactionType) => string;
    react: string;
    triggerAriaLabel?: string;
  };
  count?: number;
  onreact: (type: ReactionType | null) => void;
  /** Delay before the picker opens on hover (desktop). Long-press uses +200ms. */
  openDelayMs?: number;
};

let { current = null, labels, count = 0, onreact, openDelayMs = 250 }: Props = $props();

let open = $state(false);
let openTimer: ReturnType<typeof setTimeout> | null = null;
let closeTimer: ReturnType<typeof setTimeout> | null = null;
let pressTimer: ReturnType<typeof setTimeout> | null = null;

const currentReaction = $derived(REACTIONS.find((r) => r.type === current));

function scheduleOpen() {
  cancelClose();
  if (open) return;
  if (openTimer) clearTimeout(openTimer);
  openTimer = setTimeout(() => (open = true), openDelayMs);
}

function cancelOpen() {
  if (openTimer) {
    clearTimeout(openTimer);
    openTimer = null;
  }
}

function scheduleClose() {
  cancelOpen();
  if (closeTimer) clearTimeout(closeTimer);
  closeTimer = setTimeout(() => (open = false), 180);
}

function cancelClose() {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
}

function handleQuickClick() {
  if (current) onreact(null);
  else onreact('LIKE');
}

function handlePick(type: ReactionType) {
  cancelOpen();
  cancelClose();
  open = false;
  onreact(current === type ? null : type);
}

function handleTouchStart() {
  pressTimer = setTimeout(() => (open = true), openDelayMs + 200);
}

function handleTouchEnd() {
  if (pressTimer) {
    clearTimeout(pressTimer);
    pressTimer = null;
  }
}

const currentColorClass = $derived.by(() => {
  if (!current) return 'text-gray-600 dark:text-neutral-400';
  return (
    {
      LIKE: 'text-sky-600 dark:text-sky-400',
      CELEBRATE: 'text-amber-600 dark:text-amber-400',
      LOVE: 'text-rose-600 dark:text-rose-400',
      INSIGHTFUL: 'text-yellow-600 dark:text-yellow-400',
      CURIOUS: 'text-violet-600 dark:text-violet-400',
    }[current] ?? 'text-gray-600 dark:text-neutral-400'
  );
});
</script>

<div
	class="relative inline-block"
	onmouseenter={scheduleOpen}
	onmouseleave={scheduleClose}
	role="presentation"
>
	<button
		type="button"
		aria-haspopup="menu"
		aria-expanded={open}
		aria-label={currentReaction
			? labels.reaction(currentReaction.type)
			: (labels.triggerAriaLabel ?? labels.react)}
		class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800 {current
			? `${currentColorClass} font-medium`
			: 'text-gray-600 dark:text-neutral-400'}"
		onclick={handleQuickClick}
		ontouchstart={handleTouchStart}
		ontouchend={handleTouchEnd}
	>
		{#if currentReaction}
			<ReactionIcon type={currentReaction.type} size={18} />
		{:else}
			<ReactionIcon type="LIKE" size={18} />
		{/if}
		<span>
			{currentReaction ? labels.reaction(currentReaction.type) : labels.react}
		</span>
		{#if count > 0}
			<span class="ml-1 text-xs font-medium tabular-nums text-gray-500 dark:text-neutral-400">
				{count}
			</span>
		{/if}
	</button>

	{#if open}
		<!-- Hover bridge: pb-2 keeps the 8px gap *inside* the hitbox so moving
		     the cursor from trigger into the picker doesn't fire mouseleave. -->
		<div
			class="absolute bottom-full left-0 z-40 pb-2"
			onmouseenter={cancelClose}
			onmouseleave={scheduleClose}
			role="presentation"
		>
			<div
				role="menu"
				class="flex items-end gap-1 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-xl dark:border-neutral-700 dark:bg-neutral-800"
			>
				{#each REACTIONS as reaction, i (reaction.type)}
					<button
						type="button"
						role="menuitem"
						title={labels.reaction(reaction.type)}
						aria-label={labels.reaction(reaction.type)}
						class="group relative flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-150 ease-out hover:-translate-y-2 hover:scale-125 focus:-translate-y-2 focus:scale-125 focus:outline-none {current ===
						reaction.type
							? '-translate-y-1 scale-110'
							: ''}"
						onclick={() => handlePick(reaction.type)}
						in:fly={{ y: 8, duration: 180, delay: i * 30, easing: cubicOut }}
					>
						<ReactionIcon type={reaction.type} size={36} animated />
						<span
							class="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 shadow transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 dark:bg-neutral-950"
						>
							{labels.reaction(reaction.type)}
						</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
