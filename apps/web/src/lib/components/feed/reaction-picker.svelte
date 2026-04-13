<script lang="ts">
	import { Tooltip } from 'ui';

	type Props = {
		currentReaction: string | null;
		reactionCounts: Record<string, number>;
		onreact: (reactionType: string) => void;
		onremove: () => void;
	};

	let { currentReaction, reactionCounts, onreact, onremove }: Props = $props();

	let showPicker = $state(false);
	let hoverTimeout: ReturnType<typeof setTimeout> | undefined = $state();

	const reactions = [
		{ type: 'LIKE', emoji: '\u{1F44D}', label: 'Like' },
		{ type: 'CELEBRATE', emoji: '\u{1F389}', label: 'Celebrate' },
		{ type: 'LOVE', emoji: '\u{2764}\u{FE0F}', label: 'Love' },
		{ type: 'INSIGHTFUL', emoji: '\u{1F4A1}', label: 'Insightful' },
		{ type: 'CURIOUS', emoji: '\u{1F914}', label: 'Curious' }
	];

	const totalReactions = $derived(
		reactions.reduce((sum, r) => sum + (reactionCounts[r.type] ?? 0), 0)
	);

	const currentEmoji = $derived(
		currentReaction
			? reactions.find(r => r.type === currentReaction)?.emoji ?? '\u{1F44D}'
			: null
	);

	function handleMouseEnter() {
		clearTimeout(hoverTimeout);
		hoverTimeout = setTimeout(() => {
			showPicker = true;
		}, 400);
	}

	function handleMouseLeave() {
		clearTimeout(hoverTimeout);
		hoverTimeout = setTimeout(() => {
			showPicker = false;
		}, 300);
	}

	function handleClick() {
		if (currentReaction) {
			onremove();
		} else {
			onreact('LIKE');
		}
	}

	function handleReactionSelect(type: string) {
		showPicker = false;
		clearTimeout(hoverTimeout);
		if (currentReaction === type) {
			onremove();
		} else {
			onreact(type);
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="relative inline-flex"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
>
	<button
		class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-neutral-700/50 {currentReaction ? 'text-blue-500' : 'text-gray-500 dark:text-neutral-400'}"
		onclick={handleClick}
	>
		{#if currentEmoji}
			<span class="text-sm">{currentEmoji}</span>
		{:else}
			<span class="text-sm">{'\u{1F44D}'}</span>
		{/if}
		{#if totalReactions > 0}
			<span>{totalReactions}</span>
		{/if}
	</button>

	{#if showPicker}
		<div class="absolute bottom-full left-0 z-20 mb-1 flex items-center gap-0.5 rounded-full border px-2 py-1 shadow-lg bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
			{#each reactions as reaction}
				{@const count = reactionCounts[reaction.type] ?? 0}
				<Tooltip text="{reaction.label}{count > 0 ? ` (${count})` : ''}">
					<button
						class="rounded-full p-1 text-lg transition-transform hover:scale-125 {currentReaction === reaction.type ? 'bg-blue-100 dark:bg-blue-900/30' : ''}"
						onclick={() => handleReactionSelect(reaction.type)}
					>
						{reaction.emoji}
					</button>
				</Tooltip>
			{/each}
		</div>
	{/if}
</div>

<!-- Reaction summary badges -->
{#if totalReactions > 0}
	<div class="inline-flex items-center gap-0.5 text-xs text-gray-400 dark:text-neutral-500">
		{#each reactions as reaction}
			{#if reactionCounts[reaction.type]}
				<span class="text-sm">{reaction.emoji}</span>
			{/if}
		{/each}
	</div>
{/if}
