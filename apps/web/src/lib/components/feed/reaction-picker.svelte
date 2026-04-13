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
		{ type: 'LOVE', emoji: '\u2764\uFE0F', label: 'Love' },
		{ type: 'INSIGHTFUL', emoji: '\u{1F4A1}', label: 'Insightful' },
		{ type: 'CURIOUS', emoji: '\u{1F914}', label: 'Curious' }
	];

	const totalReactions = $derived(
		reactions.reduce((sum, r) => sum + (reactionCounts[r.type] ?? 0), 0)
	);

	const currentEmoji = $derived(
		currentReaction ? reactions.find(r => r.type === currentReaction)?.emoji ?? '\u{1F44D}' : null
	);

	function handleMouseEnter() {
		clearTimeout(hoverTimeout);
		hoverTimeout = setTimeout(() => { showPicker = true; }, 400);
	}

	function handleMouseLeave() {
		clearTimeout(hoverTimeout);
		hoverTimeout = setTimeout(() => { showPicker = false; }, 300);
	}

	function handleClick() {
		if (currentReaction) onremove();
		else onreact('LIKE');
	}

	function handleReactionSelect(type: string) {
		showPicker = false;
		clearTimeout(hoverTimeout);
		if (currentReaction === type) onremove();
		else onreact(type);
	}
</script>

<style>
	@keyframes pickerScaleIn {
		from { opacity: 0; transform: scale(0.7) translateY(8px); }
		to { opacity: 1; transform: scale(1) translateY(0); }
	}
	.picker-animate {
		animation: pickerScaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
		transform-origin: bottom left;
	}
</style>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="relative inline-flex items-center" onmouseenter={handleMouseEnter} onmouseleave={handleMouseLeave}>
	<Tooltip text={currentReaction ? 'Remove reaction' : 'React'} position="bottom">
		<button
			class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors {currentReaction ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-neutral-500 dark:hover:text-neutral-300 dark:hover:bg-neutral-700/50'}"
			onclick={handleClick}
		>
			<span class="text-base transition-transform hover:scale-110">{currentEmoji ?? '\u{1F44D}'}</span>
			{#if totalReactions > 0}
				<span class="text-xs font-medium">{totalReactions}</span>
			{/if}
		</button>
	</Tooltip>

	{#if showPicker}
		<div class="picker-animate absolute bottom-full left-0 z-20 mb-2 flex items-center gap-0.5 rounded-full border px-2.5 py-1.5 shadow-xl bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
			{#each reactions as reaction}
				{@const count = reactionCounts[reaction.type] ?? 0}
				<Tooltip text="{reaction.label}{count > 0 ? ` (${count})` : ''}">
					<button
						class="rounded-full p-1.5 text-lg transition-all duration-150 hover:scale-125 {currentReaction === reaction.type ? 'ring-2 ring-blue-400/50 bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-100 dark:hover:bg-neutral-700/50'}"
						onclick={() => handleReactionSelect(reaction.type)}
					>
						{reaction.emoji}
					</button>
				</Tooltip>
			{/each}
		</div>
	{/if}

	{#if totalReactions > 0}
		<div class="ml-0.5 flex items-center gap-px text-xs text-gray-400 dark:text-neutral-500">
			{#each reactions as reaction}
				{#if reactionCounts[reaction.type]}
					<span class="text-xs">{reaction.emoji}</span>
				{/if}
			{/each}
		</div>
	{/if}
</div>
