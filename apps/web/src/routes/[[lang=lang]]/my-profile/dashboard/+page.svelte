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
