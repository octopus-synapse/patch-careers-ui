<script lang="ts">
import '../app.css';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
import { dev } from '$app/environment';
import { setAcceptLanguageProvider, setBaseUrl } from 'api-client';
import { getTextDirection, isLocale } from 'i18n';
import type { Snippet } from 'svelte';
import { page } from '$app/stores';
import { ToastContainer } from 'ui';
import { colorSchema } from '$lib/state/color-schema.svelte';
import ChatFab from '$lib/components/chat/chat-fab.svelte';
import ChatWidget from '$lib/components/chat/chat-widget.svelte';
import CookieBanner from '$lib/components/consent/cookie-banner.svelte';
import ErrorBoundary from '$lib/components/errors/error-boundary.svelte';
import ErrorRenderer from '$lib/components/errors/error-renderer.svelte';
import OfflineBanner from '$lib/components/errors/offline-banner.svelte';
import FeatureFlagsStream from '$lib/components/feature-flags-stream.svelte';
import Footer from '$lib/components/layout/footer.svelte';
import Navbar from '$lib/components/layout/navbar.svelte';
import OnboardingGuard from '$lib/components/layout/onboarding-guard.svelte';
import LockoutModal from '$lib/components/lockout-modal.svelte';
import { extractLockoutCode, openLockout } from '$lib/state/lockout-state.svelte';
import { locale } from '$lib/state/locale.svelte';
import { setMeDashboardStore } from '$lib/state/me-dashboard.svelte';
import { trackPageView } from '$lib/utils/analytics/track';
import { installZodErrorMap } from '$lib/utils/zod-error-map';

installZodErrorMap();

const t = $derived(locale.t);

let { children }: { children: Snippet } = $props();

const apiUrl = import.meta.env.VITE_API_URL;
if (apiUrl) setBaseUrl(apiUrl);

// Wire the Accept-Language source-of-truth. The fetcher previously read
// `document.cookie` directly, which threw under SSR and (worse) returned
// the wrong locale on the server when the cookie wasn't this request's.
// In the browser, `locale.current` is the canonical choice; the hooks.server
// wiring sets the same provider per-request server-side.
setAcceptLanguageProvider(() => locale.current);

colorSchema.init();

setMeDashboardStore();

const initialLang = $page.params.lang;
locale.init(initialLang && isLocale(initialLang) ? initialLang : undefined);
$effect(() => {
  const lang = $page.params.lang;
  if (lang && isLocale(lang) && lang !== locale.current) {
    locale.set(lang);
  }
});

/** Global 409 interceptor — catches scoring-subsystem lockouts
 * (fit_profile_required, quality_score_below_threshold, etc.) and
 * routes them through the one-at-a-time `LockoutModal`. Non-lockout
 * 409s fall through for per-call handling. */
function interceptLockout(err: unknown): void {
  const code = extractLockoutCode(err);
  if (code) openLockout(code);
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: interceptLockout }),
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
    mutations: {
      onError: interceptLockout,
    },
  },
});
locale.setQueryClient(queryClient);

const isLanding = $derived($page.url.pathname === '/');
const textDir = $derived(getTextDirection(locale.current ?? 'pt-BR'));

// Hide the cookie banner on error pages — user is already distracted by the
// error and the banner just adds noise (UX feedback #90).
const showCookieBanner = $derived(!$page.error && ($page.status === undefined || $page.status < 400));

$effect(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('dir', textDir);
    document.documentElement.setAttribute('lang', locale.current ?? 'pt-BR');
  }
});

// Page-view telemetry — respects LGPD consent inside trackPageView.
$effect(() => {
  const path = $page.url.pathname;
  if (path) trackPageView(path);
});
</script>

<a href="#main-content" class="skip-link">{t('layout.skipToMainContent')}</a>

{#if isLanding}
	<QueryClientProvider client={queryClient}>
		<FeatureFlagsStream />
		<OnboardingGuard />
		<ErrorRenderer />
		<div class="min-h-screen flex flex-col">
			<Navbar />
			<ErrorBoundary>
				<main id="main-content" class="flex-1">
					{@render children()}
				</main>
			</ErrorBoundary>
			<Footer />
			<LockoutModal />
		</div>
		<ToastContainer />
		{#if showCookieBanner}<CookieBanner />{/if}
		{#if dev && !navigator.webdriver}<SvelteQueryDevtools />{/if}
	</QueryClientProvider>
{:else}
	<div class="min-h-screen flex flex-col transition-colors duration-200 bg-gray-50 text-gray-800 dark:bg-neutral-900 dark:text-neutral-200">
		<QueryClientProvider client={queryClient}>
			<FeatureFlagsStream />
			<OfflineBanner />
			<OnboardingGuard />
			<ErrorRenderer />
			<Navbar />
			<ErrorBoundary>
				<main id="main-content" class="flex-1">
					{@render children()}
				</main>
			</ErrorBoundary>
			<ChatWidget />
			<ChatFab />
			<Footer />
			<LockoutModal />
			<ToastContainer />
			{#if dev && !navigator.webdriver}<SvelteQueryDevtools />{/if}
		</QueryClientProvider>
		{#if showCookieBanner}<CookieBanner />{/if}
	</div>
{/if}
