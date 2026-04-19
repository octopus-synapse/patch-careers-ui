<script lang="ts">
import '../app.css';
import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
import { setBaseUrl } from 'api-client/client';
import { getTextDirection, isLocale } from 'i18n';
import type { Snippet } from 'svelte';
import { page } from '$app/stores';
import { colorSchema } from '$lib/color-schema.svelte';
import ChatWidget from '$lib/components/chat/chat-widget.svelte';
import ErrorBoundary from '$lib/components/errors/error-boundary.svelte';
import OfflineBanner from '$lib/components/errors/offline-banner.svelte';
import Navbar from '$lib/components/navbar.svelte';
import OnboardingGuard from '$lib/components/onboarding-guard.svelte';
import { locale } from '$lib/locale.svelte';

let { children }: { children: Snippet } = $props();

const apiUrl = import.meta.env.VITE_API_URL;
if (apiUrl) setBaseUrl(apiUrl);

colorSchema.init();

const initialLang = $page.params.lang;
locale.init(initialLang && isLocale(initialLang) ? initialLang : undefined);
$effect(() => {
  const lang = $page.params.lang;
  if (lang && isLocale(lang) && lang !== locale.current) {
    locale.set(lang);
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

const isLanding = $derived($page.url.pathname === '/');
const textDir = $derived(getTextDirection(locale.current ?? 'pt-BR'));

$effect(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('dir', textDir);
    document.documentElement.setAttribute('lang', locale.current ?? 'pt-BR');
  }
});
</script>

<a href="#main-content" class="skip-link">Skip to main content</a>

{#if isLanding}
	<QueryClientProvider client={queryClient}>
		<Navbar />
		<ErrorBoundary>
			<main id="main-content">
				{@render children()}
			</main>
		</ErrorBoundary>
	</QueryClientProvider>
{:else}
	<div class="min-h-screen transition-colors duration-200 bg-gray-50 text-gray-800 dark:bg-neutral-900 dark:text-neutral-200">
		<QueryClientProvider client={queryClient}>
			<OfflineBanner />
			<OnboardingGuard />
			<Navbar />
			<ErrorBoundary>
				<main id="main-content">
					{@render children()}
				</main>
			</ErrorBoundary>
			<ChatWidget />
		</QueryClientProvider>
	</div>
{/if}
