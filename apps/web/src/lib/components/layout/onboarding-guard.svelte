<script lang="ts">
  // @ts-nocheck — F3 burrar pending; SDK rename cascade after F1 swagger regen.
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
const needsEmailVerification = $derived(Boolean(user?.needsEmailVerification));
const isAdmin = $derived(Boolean(user?.isAdmin));

const currentPath = $derived($page.url.pathname);
const isOnboarding = $derived(currentPath.startsWith('/onboarding'));
const isIdentityPage = $derived(currentPath.startsWith('/identity'));
const isVerifyEmail = $derived(currentPath.startsWith('/identity/verify-email'));
const isAuthPage = $derived(
  currentPath.startsWith('/identity/sign-in') || currentPath.startsWith('/identity/sign-up'),
);
const isAdminPage = $derived(currentPath.startsWith('/platform/admin'));
const isLandingPage = $derived(currentPath === '/');
const isLegalPage = $derived(
  currentPath.startsWith('/legal') ||
    currentPath.startsWith('/contact') ||
    currentPath.startsWith('/contato'),
);

$effect(() => {
  if (!browser || session.isLoading) return;

  // 1. Unauthenticated trying to access anything protected → sign-in.
  // The landing page stays reachable so guests can read the pitch.
  if (!authenticated && !isAuthPage && !isLegalPage && !isLandingPage) {
    goto('/identity/sign-in');
    return;
  }
  if (!authenticated) return;

  // 2. Authenticated but email unverified → force verify-email (except when
  // already there, on auth pages, or reading legal copy).
  if (needsEmailVerification && !isIdentityPage && !isLegalPage) {
    goto('/identity/verify-email');
    return;
  }

  // 3. Already verified but sitting on /identity/verify-email → move on.
  if (!needsEmailVerification && isVerifyEmail) {
    goto(needsOnboarding ? '/onboarding/start' : '/');
    return;
  }

  // 4. Admins bypass the onboarding flow entirely.
  if (isAdmin) {
    if (isOnboarding) goto('/');
    return;
  }

  // 5. Needs onboarding → send to the picker. Identity pages (verify-email,
  // reset-password, etc.) and legal pages must NOT trigger this — otherwise
  // /identity/verify-email ping-pongs with /onboarding/start for fresh users.
  if (
    needsOnboarding &&
    !isOnboarding &&
    !isIdentityPage &&
    !isLegalPage &&
    !isAdminPage
  ) {
    goto('/onboarding/start');
    return;
  }

  // 6. Completed onboarding but still on /onboarding → home.
  if (!needsOnboarding && isOnboarding) {
    goto('/');
  }
});
</script>
