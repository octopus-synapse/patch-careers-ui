<script lang="ts">
import { Loader2, Rss } from 'lucide-svelte';
import { Button } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { useAuth } from '$lib/state/auth.svelte';
import GreetingHero from './_components/greeting-hero.svelte';
import MyApplicationsWidget from './_components/my-applications-widget.svelte';
import PendingInvitationsWidget from './_components/pending-invitations-widget.svelte';
import ProfileCompletionCard from './_components/profile-completion-card.svelte';
import RemoteUsdWidget from './_components/remote-usd-widget.svelte';
import UpcomingEventsCard from './_components/upcoming-events-card.svelte';
import RecommendedJobsWidget from '$lib/components/jobs/recommended-jobs-widget.svelte';
import { meDashboard } from '$lib/dashboard/me-dashboard.svelte';
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
</script>

<svelte:head>
	<title>{t('dashboard.pageTitle')}</title>
</svelte:head>

{#if session.isLoading}
	<div class="flex min-h-screen items-center justify-center pt-14">
		<Loader2 size={24} class="animate-spin text-gray-500 dark:text-neutral-500" />
	</div>
{:else if t && authenticated && user}
	<div class="min-h-screen pt-20 pb-12">
		<main class="mx-auto max-w-5xl px-4 sm:px-6">
			<GreetingHero name={displayName} />

			<div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
				<!-- Primary column (spans 2) -->
				<div class="flex flex-col gap-4 md:col-span-2">
					<RecommendedJobsWidget />
					<MyApplicationsWidget />
				</div>

				<!-- Side column -->
				<div class="flex flex-col gap-4">
					<ProfileCompletionCard {user} />
					<RemoteUsdWidget />
					<PendingInvitationsWidget />
					<UpcomingEventsCard />
				</div>
			</div>

			<div class="mt-8 flex justify-center">
				<Button variant="ghost" size="sm" onclick={() => goto('/social/feed')}>
					<Rss size={14} />
					{t('dashboard.openFeed')}
				</Button>
			</div>
		</main>
	</div>
{/if}
