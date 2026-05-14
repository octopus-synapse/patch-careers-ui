<script lang="ts">
import { goto } from '$app/navigation';
import { useAuth } from '$lib/state/auth.svelte';
import { locale } from '$lib/state/locale.svelte';
import FeedContent from '../_components/feed-content.svelte';
import PostSkeleton from '../_components/post-skeleton.svelte';

const t = $derived(locale.t);

const session = useAuth();
const authenticated = $derived(session.isAuthenticated);

$effect(() => {
  if (!session.isLoading && !authenticated) {
    goto('/identity/sign-in');
  }
});
</script>

<svelte:head>
	<title>{t('feed.nav.bubble')} · {t('feed.pageTitle')}</title>
</svelte:head>

{#if session.isLoading || !authenticated}
	<div class="flex min-h-screen items-center justify-center pt-14">
		<div class="mx-auto w-full max-w-2xl px-4">
			<PostSkeleton count={3} />
		</div>
	</div>
{:else}
	<FeedContent followingOnly={true} />
{/if}
