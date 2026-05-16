<script lang="ts">
import { goto } from '$app/navigation';
import { useAuth } from '$lib/state/auth.svelte';

const session = useAuth();
const user = $derived(session.user);
const authenticated = $derived(session.isAuthenticated);

$effect(() => {
  if (!session.isLoading && !authenticated) {
    goto('/identity/sign-in');
  }
});
</script>

<svelte:head>
	<title>Your Applications</title>
</svelte:head>

{#if session.isLoading}
	<div class="flex min-h-screen items-center justify-center bg-black pt-14">
		<span class="text-sm text-white/40">…</span>
	</div>
{:else if authenticated && user}
	<div class="tracker-shell min-h-[calc(100vh-3.5rem)] bg-black pt-14 text-white">
		<div class="mx-auto max-w-[1280px] px-5 py-8 md:px-8 md:py-12">
			<!-- ═══════════════════════════════════════════════════
				 HEADER
				 ═══════════════════════════════════════════════════ -->
			<header class="mb-10 border-b border-[#171717] pb-7">
				<div class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
					<div>
						<div class="mb-3 flex items-center gap-2.5">
							<span class="live-pulse"></span>
							<span class="eyebrow">Your career · live</span>
						</div>
						<h1 class="text-4xl leading-none font-semibold tracking-[-0.045em] text-white md:text-[44px]">
							Your Applications
						</h1>
						<p class="mt-3 text-sm text-white/45">
							<span class="num text-white">96</span> applications tracked
							<span class="mx-2 text-white/25">·</span>
							last sync <span class="num text-white/60">2 min ago</span>
						</p>
					</div>

					<div class="flex items-center gap-2">
						<button
							type="button"
							class="rounded-full bg-white px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-black uppercase transition hover:bg-white/90"
						>
							+ New application
						</button>
						<button
							type="button"
							class="rounded-full border border-[#1f1f1f] px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-white/80 uppercase transition hover:border-[#2a2a2a] hover:text-white"
						>
							Export
						</button>
					</div>
				</div>
			</header>

			<!-- ═══════════════════════════════════════════════════
				 TOTAL — full-width hero
				 ═══════════════════════════════════════════════════ -->
			<div class="surface glow-neutral mb-4 rounded-2xl p-7 md:p-9">
				<div class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
					<div>
						<div class="eyebrow mb-2">Total tracked</div>
						<div class="label">Applications in your roster</div>
					</div>
					<div class="flex items-baseline gap-4">
						<span class="num-xl">36</span>
						<span class="mb-2 text-sm text-white/40">all you've started</span>
					</div>
				</div>
			</div>

			<!-- Core Status Grid: Draft · Submitted · Withdrawn -->
			<div class="mb-12 grid grid-cols-1 gap-4 md:grid-cols-3">
				<div class="surface glow-pending tint-pending clickable rounded-2xl p-7">
					<div class="label mb-6">Draft</div>
					<div class="num-lg text-amber-300">8</div>
				</div>

				<div class="surface glow-active tint-active clickable rounded-2xl p-7">
					<div class="label mb-6">Submitted</div>
					<div class="num-lg">24</div>
				</div>

				<div class="surface glow-neutral tint-neutral clickable rounded-2xl p-7">
					<div class="label mb-6">Withdrawn</div>
					<div class="num-lg text-white/85">4</div>
				</div>
			</div>

			<!-- ═══════════════════════════════════════════════════
				 JOURNEY (pipeline stages only)
				 ═══════════════════════════════════════════════════ -->
			<div class="surface mb-12 rounded-2xl p-7 md:p-9">
				<div class="mb-8 flex items-baseline justify-between">
					<div class="eyebrow">Your journey</div>
					<div class="sublabel mono text-[10px]">in motion across 3 stages</div>
				</div>

				<div class="relative">
					<div class="journey-line"></div>
					<div class="relative grid grid-cols-3 gap-2">
						<div class="journey-node">
							<div class="journey-node-dot"></div>
							<div class="text-center">
								<div class="num text-2xl tracking-tight text-white md:text-3xl">10</div>
								<div class="label mt-2">Under Review</div>
								<div class="sublabel mt-1 text-[10px]">initial screening</div>
							</div>
						</div>
						<div class="journey-node">
							<div class="journey-node-dot"></div>
							<div class="text-center">
								<div class="num text-2xl tracking-tight text-white md:text-3xl">7</div>
								<div class="label mt-2">Assessment</div>
								<div class="sublabel mt-1 text-[10px]">test or take-home</div>
							</div>
						</div>
						<div class="journey-node">
							<div class="journey-node-dot"></div>
							<div class="text-center">
								<div class="num text-2xl tracking-tight text-white md:text-3xl">6</div>
								<div class="label mt-2">Interview</div>
								<div class="sublabel mt-1 text-[10px]">in interview loop</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- ═══════════════════════════════════════════════════
				 OFFERS — total (col-span-2) + Pending · Accepted · Declined
				 ═══════════════════════════════════════════════════ -->
			<div class="mb-12 grid grid-cols-1 gap-4 md:grid-cols-5">
				<div class="surface glow-stage rounded-2xl p-7 md:col-span-2">
					<div class="eyebrow mb-2">Total offers</div>
					<div class="label mb-6">Decisions on your offers</div>
					<div class="num-hero mb-4">16</div>
					<div class="sublabel">across all responses</div>
				</div>

				<div class="surface glow-pending tint-pending clickable rounded-2xl p-7">
					<div class="label mb-6">Pending</div>
					<div class="num-lg text-amber-300">6</div>
				</div>

				<div class="surface glow-positive tint-positive clickable rounded-2xl p-7">
					<div class="label mb-6">Accepted</div>
					<div class="num-lg text-emerald-300">6</div>
				</div>

				<div class="surface glow-negative tint-negative clickable rounded-2xl p-7">
					<div class="label mb-6">Declined</div>
					<div class="num-lg text-rose-300">4</div>
				</div>
			</div>

			<!-- ═══════════════════════════════════════════════════
				 FINAL OUTCOMES — Closed · On Hold · Talent Pool · Rejected
				 ═══════════════════════════════════════════════════ -->
			<div class="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
				<div class="surface glow-neutral tint-neutral clickable rounded-2xl p-6">
					<div class="label mb-6">Closed</div>
					<div class="num-md mb-3 text-white/80">2</div>
					<div class="sublabel">position cancelled</div>
				</div>

				<div class="surface glow-pending tint-pending clickable rounded-2xl p-6">
					<div class="label mb-6">On Hold</div>
					<div class="num-md mb-3 text-amber-300">2</div>
					<div class="sublabel">paused</div>
				</div>

				<div class="surface glow-active tint-active clickable rounded-2xl p-6">
					<div class="label mb-6">Talent Pool</div>
					<div class="num-md mb-3 text-sky-300">9</div>
					<div class="sublabel">kept for future roles</div>
				</div>

				<div class="surface glow-negative tint-negative clickable rounded-2xl p-6">
					<div class="label mb-6">Rejected</div>
					<div class="num-md mb-3 text-rose-300">18</div>
					<div class="sublabel">application rejected</div>
				</div>
			</div>

			<!-- ═══════════════════════════════════════════════════
				 HIRED — aurora hero, italic serif headline
				 ═══════════════════════════════════════════════════ -->
			<div class="card-hired mb-10 rounded-2xl px-7 py-16 md:px-10 md:py-24">
				<div class="hired-headline text-center">
					<div>You were hired</div>
					<div class="hired-accent">12 times</div>
				</div>
			</div>

			<!-- Footer -->
			<footer class="flex items-center justify-between border-t border-[#171717] pt-6">
				<div class="eyebrow">PATCH · Application Tracker</div>
				<div class="sublabel mono text-[10px]">v4.0</div>
			</footer>
		</div>
	</div>
{/if}

<style>
	.tracker-shell {
		--c-positive: #10b981;
		--c-active: #38bdf8;
		--c-pending: #f59e0b;
		--c-negative: #f43f5e;
		--c-neutral: #a3a3a3;
		--c-stage: #a78bfa;
		font-family: 'DM Sans', sans-serif;
		-webkit-font-smoothing: antialiased;
		text-rendering: optimizeLegibility;
	}

	/* ─── Typography ─────────────────────────────────────────── */
	.tracker-shell :global(.mono) {
		font-family: 'IBM Plex Mono', monospace;
	}

	.tracker-shell :global(.num) {
		font-family: 'IBM Plex Mono', monospace;
		font-variant-numeric: tabular-nums;
	}

	.tracker-shell :global(.eyebrow) {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.38);
	}

	.tracker-shell :global(.label) {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.82);
	}

	.tracker-shell :global(.sublabel) {
		font-size: 11px;
		color: rgba(255, 255, 255, 0.42);
	}

	/* ─── Tint color helpers for the eyebrow dot ────────────── */
	.tracker-shell :global(.text-positive) {
		color: var(--c-positive);
	}
	.tracker-shell :global(.text-active) {
		color: var(--c-active);
	}
	.tracker-shell :global(.text-pending) {
		color: var(--c-pending);
	}
	.tracker-shell :global(.text-negative) {
		color: var(--c-negative);
	}
	.tracker-shell :global(.text-neutral) {
		color: var(--c-neutral);
	}

	/* ─── Surfaces ────────────────────────────────────────────── */
	.tracker-shell :global(.surface) {
		background: #070707;
		border: 1px solid #161616;
		transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
	}
	.tracker-shell :global(.surface:hover) {
		background: #0a0a0a;
		border-color: #262626;
	}

	.tracker-shell :global(.clickable) {
		cursor: pointer;
	}
	.tracker-shell :global(.clickable:hover) {
		transform: translateY(-1px);
	}

	/* Inset top borders */
	.tracker-shell :global(.tint-positive) {
		box-shadow: inset 0 2px 0 0 var(--c-positive);
	}
	.tracker-shell :global(.tint-active) {
		box-shadow: inset 0 2px 0 0 var(--c-active);
	}
	.tracker-shell :global(.tint-pending) {
		box-shadow: inset 0 2px 0 0 var(--c-pending);
	}
	.tracker-shell :global(.tint-negative) {
		box-shadow: inset 0 2px 0 0 var(--c-negative);
	}
	.tracker-shell :global(.tint-neutral) {
		box-shadow: inset 0 2px 0 0 var(--c-neutral);
	}
	.tracker-shell :global(.tint-stage) {
		box-shadow: inset 0 2px 0 0 var(--c-stage);
	}

	/* Gradient overlays */
	.tracker-shell :global(.glow-positive) {
		background: linear-gradient(180deg, rgba(16, 185, 129, 0.07) 0%, rgba(16, 185, 129, 0) 55%), #070707;
	}
	.tracker-shell :global(.glow-active) {
		background: linear-gradient(180deg, rgba(56, 189, 248, 0.07) 0%, rgba(56, 189, 248, 0) 55%), #070707;
	}
	.tracker-shell :global(.glow-pending) {
		background: linear-gradient(180deg, rgba(245, 158, 11, 0.07) 0%, rgba(245, 158, 11, 0) 55%), #070707;
	}
	.tracker-shell :global(.glow-negative) {
		background: linear-gradient(180deg, rgba(244, 63, 94, 0.06) 0%, rgba(244, 63, 94, 0) 55%), #070707;
	}
	.tracker-shell :global(.glow-neutral) {
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.025) 0%, rgba(255, 255, 255, 0) 55%), #070707;
	}
	.tracker-shell :global(.glow-stage) {
		background: linear-gradient(180deg, rgba(167, 139, 250, 0.07) 0%, rgba(167, 139, 250, 0) 55%), #070707;
	}

	/* Status-specific unified cards */
	.tracker-shell :global(.card-pending) {
		box-shadow: inset 0 2px 0 0 var(--c-pending);
		background: linear-gradient(180deg, rgba(245, 158, 11, 0.07) 0%, rgba(245, 158, 11, 0) 55%), #070707;
		border: 1px solid #161616;
		transition: all 0.18s ease;
	}
	.tracker-shell :global(.card-pending:hover) {
		background: linear-gradient(180deg, rgba(245, 158, 11, 0.07) 0%, rgba(245, 158, 11, 0) 55%), #0a0a0a;
		border-color: #262626;
	}

	.tracker-shell :global(.card-accepted) {
		box-shadow: inset 0 2px 0 0 var(--c-positive);
		background: linear-gradient(180deg, rgba(16, 185, 129, 0.07) 0%, rgba(16, 185, 129, 0) 55%), #070707;
		border: 1px solid #161616;
		transition: all 0.18s ease;
	}
	.tracker-shell :global(.card-accepted:hover) {
		background: linear-gradient(180deg, rgba(16, 185, 129, 0.07) 0%, rgba(16, 185, 129, 0) 55%), #0a0a0a;
		border-color: #262626;
	}

	.tracker-shell :global(.card-declined) {
		box-shadow: inset 0 2px 0 0 var(--c-negative);
		background: linear-gradient(180deg, rgba(244, 63, 94, 0.06) 0%, rgba(244, 63, 94, 0) 55%), #070707;
		border: 1px solid #161616;
		transition: all 0.18s ease;
	}
	.tracker-shell :global(.card-declined:hover) {
		background: linear-gradient(180deg, rgba(244, 63, 94, 0.06) 0%, rgba(244, 63, 94, 0) 55%), #0a0a0a;
		border-color: #262626;
	}

	.tracker-shell :global(.card-hired) {
		background:
			radial-gradient(ellipse 48% 38% at 22% 0%, rgba(132, 204, 22, 0.65) 0%, rgba(132, 204, 22, 0.18) 45%, transparent 100%),
			radial-gradient(ellipse 48% 38% at 78% 0%, rgba(22, 101, 52, 0.85) 0%, rgba(22, 101, 52, 0.25) 45%, transparent 100%),
			#070707;
		transition: transform 0.25s ease;
	}
	.tracker-shell :global(.card-hired:hover) {
		transform: translateY(-2px);
	}

	.tracker-shell :global(.hired-headline) {
		font-family: 'Instrument Serif', 'Times New Roman', serif;
		font-style: italic;
		font-size: clamp(2.75rem, 6.5vw, 5rem);
		font-weight: 400;
		letter-spacing: -0.015em;
		color: white;
		line-height: 1.05;
	}

	.tracker-shell :global(.hired-accent) {
		color: #a3e635;
	}

	/* ─── Numbers ────────────────────────────────────────────── */
	.tracker-shell :global(.num-xl) {
		font-family: 'IBM Plex Mono', monospace;
		font-variant-numeric: tabular-nums;
		font-size: clamp(4rem, 9vw, 7rem);
		font-weight: 400;
		line-height: 0.9;
		letter-spacing: -0.045em;
		color: white;
	}

	.tracker-shell :global(.num-hero) {
		font-family: 'IBM Plex Mono', monospace;
		font-variant-numeric: tabular-nums;
		font-size: clamp(3.5rem, 6vw, 5rem);
		font-weight: 400;
		line-height: 0.9;
		letter-spacing: -0.04em;
		color: white;
	}

	.tracker-shell :global(.num-lg) {
		font-family: 'IBM Plex Mono', monospace;
		font-variant-numeric: tabular-nums;
		font-size: clamp(3rem, 6vw, 4.5rem);
		font-weight: 400;
		line-height: 0.92;
		letter-spacing: -0.04em;
		color: white;
	}

	.tracker-shell :global(.num-md) {
		font-family: 'IBM Plex Mono', monospace;
		font-variant-numeric: tabular-nums;
		font-size: clamp(2.25rem, 4vw, 3rem);
		font-weight: 400;
		line-height: 0.95;
		letter-spacing: -0.03em;
		color: white;
	}

	/* ─── Dots ───────────────────────────────────────────────── */
	.tracker-shell :global(.dot) {
		width: 6px;
		height: 6px;
		border-radius: 999px;
		display: inline-block;
		flex-shrink: 0;
	}
	.tracker-shell :global(.dot-positive) {
		background: var(--c-positive);
		box-shadow: 0 0 8px var(--c-positive);
	}
	.tracker-shell :global(.dot-active) {
		background: var(--c-active);
		box-shadow: 0 0 8px var(--c-active);
	}
	.tracker-shell :global(.dot-pending) {
		background: var(--c-pending);
		box-shadow: 0 0 8px var(--c-pending);
	}
	.tracker-shell :global(.dot-negative) {
		background: var(--c-negative);
		box-shadow: 0 0 8px var(--c-negative);
	}
	.tracker-shell :global(.dot-neutral) {
		background: var(--c-neutral);
	}

	/* ─── Journey strip ──────────────────────────────────────── */
	.tracker-shell :global(.journey-node) {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}

	.tracker-shell :global(.journey-node-dot) {
		width: 12px;
		height: 12px;
		border-radius: 999px;
		background: var(--c-active);
		border: 2px solid #070707;
		box-shadow: 0 0 0 1px var(--c-active), 0 0 14px var(--c-active);
		position: relative;
		z-index: 2;
	}

	.tracker-shell :global(.journey-line) {
		position: absolute;
		left: 8%;
		right: 8%;
		top: 17px;
		height: 1px;
		background: linear-gradient(90deg, rgba(56, 189, 248, 0.5) 0%, rgba(56, 189, 248, 0.5) 100%);
		z-index: 1;
	}

	/* ─── Live pulse ─────────────────────────────────────────── */
	.tracker-shell :global(.live-pulse) {
		position: relative;
		display: inline-block;
		width: 7px;
		height: 7px;
		border-radius: 999px;
		background: var(--c-positive);
	}

	.tracker-shell :global(.live-pulse::after) {
		content: '';
		position: absolute;
		inset: -3px;
		border-radius: 999px;
		border: 1px solid var(--c-positive);
		opacity: 0;
		animation: tracker-pulse 2.2s ease-out infinite;
	}

	@keyframes tracker-pulse {
		0% {
			transform: scale(0.6);
			opacity: 0.9;
		}
		100% {
			transform: scale(2);
			opacity: 0;
		}
	}
</style>
