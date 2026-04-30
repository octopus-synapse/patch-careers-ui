<script lang="ts">
import { locale } from '$lib/state/locale.svelte';
import { timeTicker } from '$lib/state/time-ticker.svelte';

type Props = {
  name: string;
  // `photoURL` is deliberately ignored — the dashboard hero no longer
  // renders an avatar per product feedback. Kept on the prop signature
  // so existing callers don't need to change.
  photoURL?: string | null;
};

let { name }: Props = $props();

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
</script>

<section
	class="relative isolate overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm shadow-gray-900/[0.02] sm:p-8 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none"
>
	<!-- Decorative mesh — purely aesthetic, hidden from assistive tech -->
	<div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">
		<div
			class="absolute -right-24 -top-28 h-64 w-64 rounded-full bg-cyan-300/40 blur-3xl dark:bg-cyan-500/10"
		></div>
		<div
			class="absolute -bottom-28 -left-20 h-60 w-60 rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-500/10"
		></div>
		<div
			class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent dark:via-cyan-400/20"
		></div>
	</div>

	<div class="min-w-0">
		<h1
			class="truncate text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px] dark:text-neutral-50"
		>
			{greeting}
		</h1>
		<p class="mt-1 text-sm text-gray-600 sm:text-[15px] dark:text-neutral-400">
			{t('dashboard.heroSubtitle')}
		</p>
	</div>
</section>
