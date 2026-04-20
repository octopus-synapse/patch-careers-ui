<script lang="ts">
import { createAuthSession } from 'api-client';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';

const session = createAuthSession(() => ({
  query: { retry: false, enabled: browser },
}));

const user = $derived(session.data?.user as Record<string, unknown> | null);
const authenticated = $derived(session.data?.authenticated ?? false);
const needsOnboarding = $derived(user?.needsOnboarding ?? false);
const isAdmin = $derived(Boolean(user?.isAdmin));

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

  // Admins bypass the onboarding flow entirely
  if (isAdmin) {
    if (isOnboarding) goto('/');
    return;
  }

  // Logged in but needs onboarding → force the picker, which lets the user
  // choose between import tracks or the manual wizard.
  if (needsOnboarding && !isOnboarding && !isAuthPage && !isAdminPage) {
    goto('/onboarding/start');
    return;
  }

  // Already completed onboarding but on /onboarding → go home
  if (!needsOnboarding && isOnboarding) {
    goto('/');
  }
});
</script>
