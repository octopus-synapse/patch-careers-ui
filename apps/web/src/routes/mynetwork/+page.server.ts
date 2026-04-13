import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const [connectionsRes, pendingRes, suggestionsRes] = await Promise.all([
		fetch('/api/v1/users/me/connections?page=1&limit=10'),
		fetch('/api/v1/users/me/connections/pending?page=1&limit=10'),
		fetch('/api/v1/users/me/connections/suggestions?page=1&limit=20'),
	]);

	const [connections, pending, suggestions] = await Promise.all([
		connectionsRes.ok ? connectionsRes.json() : null,
		pendingRes.ok ? pendingRes.json() : null,
		suggestionsRes.ok ? suggestionsRes.json() : null,
	]);

	return { connections, pending, suggestions };
};
