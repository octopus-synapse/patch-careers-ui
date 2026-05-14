<script lang="ts">
import { locale } from '$lib/state/locale.svelte';

type Props = {
  jobs: Array<{ createdAt?: string }> | undefined;
};

const { jobs }: Props = $props();
const STORAGE_KEY = 'patch:lastSeenJobsAt';
const t = $derived(locale.t);

let lastSeenAt = $state<number | null>(null);

$effect(() => {
  if (typeof window === 'undefined') return;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  lastSeenAt = raw ? Number(raw) : null;
});

const newCount = $derived.by(() => {
  if (!jobs || lastSeenAt === null) return 0;
  return jobs.reduce((acc, job) => {
    if (!job.createdAt) return acc;
    return new Date(job.createdAt).getTime() > (lastSeenAt ?? 0) ? acc + 1 : acc;
  }, 0);
});

function markAsSeen() {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  window.localStorage.setItem(STORAGE_KEY, String(now));
  lastSeenAt = now;
}
</script>

{#if newCount > 0}
	<button
		type="button"
		onclick={markAsSeen}
		class="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-700 dark:text-cyan-300 transition-opacity hover:opacity-80"
		aria-label={t('jobs.newJobsBadgeDismiss') ?? 'Marcar como visualizadas'}
	>
		<span class="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" aria-hidden="true"></span>
		{newCount === 1
			? t('jobs.newJobsSingular')
			: (t('jobs.newJobsPlural', { count: newCount }) ?? `${newCount} novas`)}
	</button>
{/if}
