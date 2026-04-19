<script lang="ts">
import { Loader2, Rss } from 'lucide-svelte';
import { Button } from 'ui';
import { goto } from '$app/navigation';
import { useAuth } from '$lib/auth.svelte';
import GreetingHero from '$lib/components/dashboard/greeting-hero.svelte';
import MyApplicationsWidget from '$lib/components/dashboard/my-applications-widget.svelte';
import PendingInvitationsWidget from '$lib/components/dashboard/pending-invitations-widget.svelte';
import ProfileCompletionCard from '$lib/components/dashboard/profile-completion-card.svelte';
import RemoteUsdWidget from '$lib/components/dashboard/remote-usd-widget.svelte';
import UpcomingEventsCard from '$lib/components/dashboard/upcoming-events-card.svelte';
import RecommendedJobsWidget from '$lib/components/jobs/recommended-jobs-widget.svelte';
import { locale } from '$lib/locale.svelte';

const t = $derived(locale.t);

const session = useAuth();
const user = $derived(session.data?.user);
const authenticated = $derived(session.data?.authenticated);

$effect(() => {
  if (!session.isLoading && !authenticated) {
    goto('/login');
  }
  if (!session.isLoading && authenticated && user?.needsOnboarding) {
    goto('/onboarding/start');
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
				<Button variant="ghost" size="sm" onclick={() => goto('/feed')}>
					<Rss size={14} />
					{t('dashboard.openFeed')}
				</Button>
			</div>
		</main>
	</div>
{/if}
