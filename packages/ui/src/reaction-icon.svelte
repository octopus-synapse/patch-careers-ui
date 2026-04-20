<script lang="ts">
import type { ReactionType } from './reactions';

type Props = {
  type: ReactionType;
  size?: number;
  animated?: boolean;
};

let { type, size = 28, animated = false }: Props = $props();

const gradients: Record<ReactionType, { from: string; to: string }> = {
  LIKE: { from: '#38bdf8', to: '#1d4ed8' },
  CELEBRATE: { from: '#fbbf24', to: '#ea580c' },
  LOVE: { from: '#fb7185', to: '#dc2626' },
  INSIGHTFUL: { from: '#fde047', to: '#ca8a04' },
  CURIOUS: { from: '#c4b5fd', to: '#7c3aed' },
};

const g = $derived(gradients[type]);
const gradientId = $derived(`rx-${type.toLowerCase()}`);
</script>

<span
	class="reaction-icon inline-block align-middle {animated ? `anim-${type.toLowerCase()}` : ''}"
	style:width="{size}px"
	style:height="{size}px"
>
	<svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
		<defs>
			<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color={g.from} />
				<stop offset="100%" stop-color={g.to} />
			</linearGradient>
		</defs>
		<circle cx="12" cy="12" r="12" fill="url(#{gradientId})" />
		<g class="glyph" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
			{#if type === 'LIKE'}
				<path
					d="M9 11v6.5M6.5 11h2.5v6.5H6.5a1 1 0 0 1-1-1v-4.5a1 1 0 0 1 1-1ZM9 11l2.2-4.4A1.6 1.6 0 0 1 14.2 7.8L13.6 11h3.1a1.3 1.3 0 0 1 1.25 1.64l-1.1 4.2A1.3 1.3 0 0 1 15.6 17.8H9"
					fill="white"
				/>
			{:else if type === 'CELEBRATE'}
				<path
					d="M12 6.2l1.55 3.15 3.47.5-2.51 2.45.59 3.46L12 14.12l-3.1 1.64.59-3.46-2.51-2.45 3.47-.5L12 6.2Z"
					fill="white"
				/>
				<path d="M5.5 6.5l.8.8M18.5 6.5l-.8.8M5.5 17.5l.8-.8M18.5 17.5l-.8-.8" stroke-width="1.5" />
			{:else if type === 'LOVE'}
				<path
					d="M12 17.5s-5-3.3-5-7a3 3 0 0 1 5-2.2A3 3 0 0 1 17 10.5c0 3.7-5 7-5 7Z"
					fill="white"
				/>
			{:else if type === 'INSIGHTFUL'}
				<path
					d="M9.5 14.5c-1.5-1.2-2-2.3-2-3.8a4.5 4.5 0 1 1 9 0c0 1.5-.5 2.6-2 3.8v1.5h-5v-1.5Z"
					fill="white"
				/>
				<path d="M10.5 17.5h3M11 19.2h2" />
			{:else if type === 'CURIOUS'}
				<path
					d="M9.5 9.5a2.5 2.5 0 0 1 5 .3c0 1.3-1.2 1.7-1.7 2.3-.4.4-.6.9-.6 1.4v.5"
				/>
				<circle cx="12" cy="16.5" r="1" fill="white" stroke="none" />
			{/if}
		</g>
	</svg>
</span>

<style>
	.reaction-icon {
		transform-origin: center;
		will-change: transform, filter;
	}

	.anim-like {
		animation: like-bob 1.4s ease-in-out infinite;
	}
	.anim-celebrate {
		animation: celebrate-spin 2.2s linear infinite;
	}
	.anim-love {
		animation: love-pulse 1.1s ease-in-out infinite;
	}
	.anim-insightful {
		animation: insight-glow 1.6s ease-in-out infinite;
	}
	.anim-curious {
		animation: curious-tilt 1.6s ease-in-out infinite;
	}

	@keyframes like-bob {
		0%,
		100% {
			transform: translateY(0) rotate(0deg);
		}
		40% {
			transform: translateY(-3px) rotate(-6deg);
		}
		60% {
			transform: translateY(-3px) rotate(-6deg);
		}
	}

	@keyframes celebrate-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes love-pulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.12);
		}
	}

	@keyframes insight-glow {
		0%,
		100% {
			filter: brightness(1) drop-shadow(0 0 0 rgba(253, 224, 71, 0));
		}
		50% {
			filter: brightness(1.15) drop-shadow(0 0 6px rgba(253, 224, 71, 0.6));
		}
	}

	@keyframes curious-tilt {
		0%,
		100% {
			transform: rotate(0deg);
		}
		25% {
			transform: rotate(-10deg);
		}
		75% {
			transform: rotate(10deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.anim-like,
		.anim-celebrate,
		.anim-love,
		.anim-insightful,
		.anim-curious {
			animation: none;
		}
	}
</style>
