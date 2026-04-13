<script lang="ts">
	import { createAuthSession } from 'api-client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';

	const session = createAuthSession(() => ({
		query: { retry: false, enabled: browser }
	}));

	const user = $derived(session.data?.data?.user as Record<string, unknown> | null);
	const authenticated = $derived(session.data?.data?.authenticated ?? false);
	const needsOnboarding = $derived(user?.needsOnboarding ?? false);

	const currentPath = $derived($page.url.pathname);
	const isOnboarding = $derived(currentPath.startsWith('/onboarding'));
	const isAuthPage = $derived(currentPath.startsWith('/login') || currentPath.startsWith('/signup'));
	const isAdminPage = $derived(currentPath.startsWith('/admin'));

	$effect(() => {
		if (!browser || session.isLoading) return;

		// Not logged in trying to access /onboarding → go to login
		if (!authenticated && isOnboarding) {
			goto('/login');
			return;
		}

		if (!authenticated) return;

		// Logged in but needs onboarding → force /onboarding
		if (needsOnboarding && !isOnboarding && !isAuthPage && !isAdminPage) {
			goto('/onboarding');
			return;
		}

		// Already completed onboarding but on /onboarding → go home
		if (!needsOnboarding && isOnboarding) {
			goto('/');
		}
	});
</script>
