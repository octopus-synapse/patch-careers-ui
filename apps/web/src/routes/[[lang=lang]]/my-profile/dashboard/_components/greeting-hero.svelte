<script lang="ts">
import { Moon, Sun, Sunrise } from 'lucide-svelte';
import { locale } from '$lib/state/locale.svelte';
import { timeTicker } from '$lib/state/time-ticker.svelte';

type Props = {
  name: string;
  photoURL?: string | null;
};

let { name, photoURL = null }: Props = $props();

const t = $derived(locale.t);

type GreetingKey = 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening';

function greetingKey(nowMs: number): GreetingKey {
  const hour = new Date(nowMs).getHours();
  if (hour < 12) return 'greetingMorning';
  if (hour < 18) return 'greetingAfternoon';
  return 'greetingEvening';
}

const firstName = $derived(name.split(' ')[0] ?? name);
const key = $derived(greetingKey(timeTicker.now));
const greeting = $derived(t(`dashboard.${key}`, { name: firstName }));
const initials = $derived(
  (name || firstName)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('') || 'U',
);
</script>

<section
	class="relative isolate overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm shadow-gray-900/[0.02] sm:p-8 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none"
>
	<!-- Decorative mesh — purely aesthetic, hidden from assistive tech -->
	<div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">
		<div
			class="absolute -right-24 -top-28 h-64 w-64 rounded-full bg-emerald-300/40 blur-3xl dark:bg-emerald-500/10"
		></div>
		<div
			class="absolute -bottom-28 -left-20 h-60 w-60 rounded-full bg-teal-300/30 blur-3xl dark:bg-teal-500/10"
		></div>
		<div
			class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent dark:via-emerald-400/20"
		></div>
	</div>

	<div class="flex items-center gap-4 sm:gap-5">
		<div
			class="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 ring-1 ring-white/40 sm:size-16 dark:shadow-emerald-900/30 dark:ring-white/10"
		>
			{#if photoURL}
				<img src={photoURL} alt="" class="h-full w-full object-cover" />
			{:else}
				<span class="text-lg font-semibold tracking-tight sm:text-xl">{initials}</span>
			{/if}
		</div>

		<div class="min-w-0 flex-1">
			<div
				class="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50/80 px-2 py-0.5 text-emerald-700 ring-1 ring-inset ring-emerald-600/15 backdrop-blur-sm dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-400/20"
			>
				{#if key === 'greetingMorning'}
					<Sunrise size={12} />
				{:else if key === 'greetingAfternoon'}
					<Sun size={12} />
				{:else}
					<Moon size={12} />
				{/if}
			</div>
			<h1
				class="truncate text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px] dark:text-neutral-50"
			>
				{greeting}
			</h1>
			<p class="mt-1 text-sm text-gray-600 sm:text-[15px] dark:text-neutral-400">
				{t('dashboard.heroSubtitle')}
			</p>
		</div>
	</div>
</section>
