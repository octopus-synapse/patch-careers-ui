<script lang="ts">
import { Loader2, Rss } from 'lucide-svelte';
import { Button } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { useAuth } from '$lib/state/auth.svelte';
import GreetingHero from './_components/greeting-hero.svelte';
import MyApplicationsWidget from './_components/my-applications-widget.svelte';
import NextStepsChecklist from './_components/next-steps-checklist.svelte';
import PendingInvitationsWidget from './_components/pending-invitations-widget.svelte';
import ProfileCompletionCard from './_components/profile-completion-card.svelte';
import RemoteUsdWidget from './_components/remote-usd-widget.svelte';
// Hidden until the events backend ships — no point in promising AMAs that
// don't exist yet (per UX feedback #12).
// import UpcomingEventsCard from './_components/upcoming-events-card.svelte';
import RecommendedJobsWidget from '$lib/components/jobs/recommended-jobs-widget.svelte';
import WidgetErrorBoundary from '$lib/components/errors/widget-error-boundary.svelte';
import { meDashboard } from '$lib/state/me-dashboard.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

const session = useAuth();
const user = $derived(session.data?.user);
const authenticated = $derived(session.data?.authenticated);

$effect(() => {
  if (!session.isLoading && !authenticated) {
    goto('/identity/sign-in');
  }
  if (!session.isLoading && authenticated && user?.needsOnboarding) {
    goto('/onboarding/start');
  }
});

// Prefetch the composite payload as soon as the user is authenticated.
// Widgets that consume the store (currently opt-in) get hydrated data
// without their own fetch. The store falls back to no-op on 404 so older
// backends keep working through the per-widget fetch path.
$effect(() => {
  if (browser && authenticated && !session.isLoading) {
    void meDashboard.load();
  }
});

const displayName = $derived(String(user?.name ?? user?.email ?? ''));
const photoURL = $derived(
  ((user as Record<string, unknown> | undefined)?.photoURL as string | null | undefined) ?? null,
);
</script>

<svelte:head>
	<title>{t('dashboard.pageTitle')}</title>
</svelte:head>

{#if session.isLoading}
	<div class="flex min-h-screen items-center justify-center pt-14">
		<Loader2 size={24} class="animate-spin text-gray-500 dark:text-neutral-500" />
	</div>
{:else if t && authenticated && user}
	<div
		class="relative min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-gray-50/60 via-white to-white pt-20 pb-16 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-950"
	>
		<main class="mx-auto max-w-6xl px-4 sm:px-6">
			<GreetingHero name={displayName} {photoURL} />

			<!-- Checklist goes above the widgets when anything's incomplete —
				gives new users a single place to see "what do I do next?" -->
			<div class="mt-6">
				<WidgetErrorBoundary>
					<NextStepsChecklist
						{user}
						signals={{
							pendingInvitationsTotal: (user as Record<string, unknown>)?.pendingInvitationsTotal as number | undefined,
							applicationsCount: (user as Record<string, unknown>)?.applicationsCount as number | undefined,
							resumeSectionsCount: (user as Record<string, unknown>)?.resumeSectionsCount as number | undefined,
						}}
					/>
				</WidgetErrorBoundary>
			</div>

			<!-- 60/40 grid on md+, single column on mobile. The side column gets
				more room than the previous 2/3+1/3 split so widgets like Pending
				Invitations and Remote-USD don't squeeze name/CTA real estate. -->
			<div class="mt-6 grid grid-cols-1 gap-5 md:grid-cols-5">
				<div class="flex flex-col gap-5 md:col-span-3">
					<WidgetErrorBoundary><RecommendedJobsWidget /></WidgetErrorBoundary>
					<WidgetErrorBoundary><MyApplicationsWidget /></WidgetErrorBoundary>
				</div>

				<div class="flex flex-col gap-5 md:col-span-2">
					<WidgetErrorBoundary><ProfileCompletionCard {user} /></WidgetErrorBoundary>
					<WidgetErrorBoundary><RemoteUsdWidget /></WidgetErrorBoundary>
					<WidgetErrorBoundary><PendingInvitationsWidget /></WidgetErrorBoundary>
				</div>
			</div>

			<div class="mt-10 flex items-center justify-center">
				<div class="flex items-center gap-3 text-gray-300 dark:text-neutral-800">
					<span class="h-px w-10 bg-current"></span>
					<Button variant="ghost" size="sm" onclick={() => goto('/social/feed')}>
						<Rss size={14} />
						{t('dashboard.openFeed')}
					</Button>
					<span class="h-px w-10 bg-current"></span>
				</div>
			</div>
		</main>
	</div>
{/if}
