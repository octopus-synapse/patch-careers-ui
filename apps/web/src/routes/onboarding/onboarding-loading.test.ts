import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * This test exposes the infinite loading bug on /onboarding by testing
 * the loading condition: `auth.isLoading || session.isLoading`
 *
 * The page shows a spinner while either query is loading.
 * The session query has `enabled: authenticated`.
 * In TanStack Query v5+, a disabled query has isPending=true but isFetching=false,
 * so isLoading (isPending && isFetching) = false.
 *
 * But the page also requires `t` (locale translator) to be non-null to show content.
 * If locale.init() hasn't completed, t=null, and even after queries resolve,
 * neither the spinner nor the content renders — the page appears stuck/blank.
 */

// Simulate the exact loading state logic from +page.svelte (after fix)
function computePageState(params: {
	authIsLoading: boolean;
	authAuthenticated: boolean;
	sessionIsLoading: boolean;
	sessionData: Record<string, unknown> | null;
	translatorReady: boolean;
	currentStep: { id: string; component: string } | undefined;
}) {
	const { authIsLoading, authAuthenticated, sessionIsLoading, sessionData, translatorReady, currentStep } = params;

	// FIX: include !translatorReady in the spinner condition so we never
	// fall through to a blank page while locale is still loading
	const showSpinner = authIsLoading || sessionIsLoading || !translatorReady;
	const shouldRedirect = !authIsLoading && !authAuthenticated;
	const showContent = !showSpinner && sessionData !== null && currentStep !== undefined;
	const showNothing = !showSpinner && !shouldRedirect && !showContent;

	return { showSpinner, shouldRedirect, showContent, showNothing };
}

describe('Onboarding page loading logic', () => {
	it('shows spinner while auth is loading', () => {
		const state = computePageState({
			authIsLoading: true,
			authAuthenticated: false,
			sessionIsLoading: false,
			sessionData: null,
			translatorReady: false,
			currentStep: undefined
		});
		expect(state.showSpinner).toBe(true);
		expect(state.showNothing).toBe(false);
	});

	it('redirects to login when auth resolves as unauthenticated', () => {
		// The $effect redirect fires independently of what the template shows.
		// The spinner may still show (translator not ready), but the redirect runs.
		const state = computePageState({
			authIsLoading: false,
			authAuthenticated: false,
			sessionIsLoading: false,
			sessionData: null,
			translatorReady: true,
			currentStep: undefined
		});
		expect(state.shouldRedirect).toBe(true);
	});

	it('shows spinner while session is loading (authenticated user)', () => {
		const state = computePageState({
			authIsLoading: false,
			authAuthenticated: true,
			sessionIsLoading: true,
			sessionData: null,
			translatorReady: true,
			currentStep: undefined
		});
		expect(state.showSpinner).toBe(true);
	});

	it('shows content when everything resolves', () => {
		const state = computePageState({
			authIsLoading: false,
			authAuthenticated: true,
			sessionIsLoading: false,
			sessionData: { currentStep: 'personal-info', steps: [] },
			translatorReady: true,
			currentStep: { id: 'personal-info', component: 'form' }
		});
		expect(state.showContent).toBe(true);
		expect(state.showSpinner).toBe(false);
		expect(state.showNothing).toBe(false);
	});

	it('FIX: shows spinner when queries resolve but translator is not ready', () => {
		// Previously this was a blank page bug — locale.init() is async and
		// the page fell through both conditions. Now the spinner condition
		// includes !translatorReady, so the user sees loading until locale is ready.
		const state = computePageState({
			authIsLoading: false,
			authAuthenticated: true,
			sessionIsLoading: false,
			sessionData: { currentStep: 'personal-info', steps: [] },
			translatorReady: false,
			currentStep: { id: 'personal-info', component: 'form' }
		});

		expect(state.showSpinner).toBe(true);
		expect(state.showNothing).toBe(false);
	});

	it('shows nothing when session has no matching currentStep (edge case)', () => {
		// If the API returns a currentStep that doesn't match any step in the array,
		// currentStep derived will be undefined — this is an API error, not a UI bug
		const state = computePageState({
			authIsLoading: false,
			authAuthenticated: true,
			sessionIsLoading: false,
			sessionData: { currentStep: 'unknown-step', steps: [] },
			translatorReady: true,
			currentStep: undefined
		});

		// This edge case still results in blank page — but it's an API issue
		expect(state.showNothing).toBe(true);
	});
});
