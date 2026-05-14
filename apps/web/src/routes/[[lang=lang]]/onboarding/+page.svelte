<script lang="ts">
import { Loader } from 'ui';
import { goto } from '$app/navigation';
import OnboardingStepper from './_components/onboarding-stepper.svelte';
import { useAuth } from '$lib/state/auth.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

const auth = useAuth();

$effect(() => {
  if (!auth.isLoading && !auth.isAuthenticated) {
    goto('/identity/sign-in');
  }
});
</script>

<svelte:head>
	<title>{t('onboarding.pageTitle')}</title>
</svelte:head>

{#if auth.isLoading || !auth.isAuthenticated}
	<div class="flex min-h-screen items-center justify-center pt-14">
		<Loader size={24} />
	</div>
{:else}
	<OnboardingStepper />
{/if}
