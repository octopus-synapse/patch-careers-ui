<script lang="ts">
import { createSuccessStoriesList } from 'api-client';
import { Quote } from 'lucide-svelte';
import { browser } from '$app/environment';

/** Loose shape so we don't break when the API adds extra fields. */
type Story = {
  id: string;
  headline: string;
  beforeText: string;
  afterText: string;
  quote: string;
  timeframeDays: number | null;
  user: { name: string | null; username: string | null; photoURL: string | null };
};

const query = createSuccessStoriesList(
  { limit: '12' },
  { query: { enabled: browser } },
);

const stories = $derived(
  (($query.data as { stories?: Story[] } | undefined)?.stories ?? []) as Story[],
);
</script>

{#if stories.length > 0}
	<section class="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-black px-4 py-20 sm:px-6 sm:py-32">
		<div class="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.1),transparent_60%)]"></div>

		<div class="mx-auto max-w-6xl">
			<div class="mb-10 text-center">
				<p class="mb-3 font-mono text-xs uppercase tracking-[0.4em] text-cyan-500">Histórias reais</p>
				<h2 class="text-3xl font-black uppercase leading-none tracking-tighter text-white sm:text-5xl md:text-7xl">
					De onde pra onde
				</h2>
				<p class="mx-auto mt-4 max-w-xl text-sm text-zinc-500 sm:text-base">
					Quem já patched a carreira com a gente.
				</p>
			</div>

			<!-- Horizontally scrolling carousel — snaps on each card. -->
			<div class="scrollbar-none -mx-4 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory sm:-mx-6 sm:gap-6">
				<div class="w-4 shrink-0 sm:w-6" aria-hidden="true"></div>
				{#each stories as story (story.id)}
					<article class="w-[85%] shrink-0 snap-center rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 sm:w-96">
						<div class="mb-4 flex items-center gap-3">
							{#if story.user.photoURL}
								<!-- svelte-ignore a11y_img_redundant_alt -->
								<img
									src={story.user.photoURL}
									alt={story.user.name ?? 'profile photo'}
									class="h-10 w-10 rounded-full object-cover"
								/>
							{:else}
								<div class="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-300">
									{(story.user.name ?? story.user.username ?? '?').charAt(0).toUpperCase()}
								</div>
							{/if}
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-semibold text-white">
									{story.user.name ?? story.user.username ?? 'Anonymous'}
								</p>
								{#if story.timeframeDays}
									<p class="text-[11px] text-zinc-500">em {story.timeframeDays} dias</p>
								{/if}
							</div>
						</div>

						<h3 class="text-lg font-bold text-white">{story.headline}</h3>

						<div class="mt-4 space-y-2">
							<p class="text-[11px] font-mono uppercase tracking-widest text-zinc-600">Antes</p>
							<p class="text-sm leading-relaxed text-zinc-400 line-through opacity-70">
								{story.beforeText}
							</p>
							<p class="text-[11px] font-mono uppercase tracking-widest text-cyan-500">Depois</p>
							<p class="text-sm leading-relaxed text-zinc-100">
								{story.afterText}
							</p>
						</div>

						<div class="mt-5 border-t border-zinc-800 pt-4">
							<Quote size={14} class="mb-2 text-cyan-500" />
							<p class="text-sm italic text-zinc-300">"{story.quote}"</p>
						</div>
					</article>
				{/each}
				<div class="w-4 shrink-0 sm:w-6" aria-hidden="true"></div>
			</div>
		</div>
	</section>
{/if}

<style>
	.scrollbar-none::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-none {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
