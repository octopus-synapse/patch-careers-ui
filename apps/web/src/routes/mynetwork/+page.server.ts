import type { PageServerLoad } from './$types';
import { getBaseUrl } from 'api-client';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const base = getBaseUrl();

	const headers: Record<string, string> = {};
	const cookieHeader = cookies.getAll().map(c => `${c.name}=${c.value}`).join('; ');
	if (cookieHeader) headers.cookie = cookieHeader;

	async function safeFetch(path: string) {
		try {
			const res = await fetch(`${base}${path}`, { headers });
			if (!res.ok) return null;
			const json = await res.json();
			return json?.data ?? json ?? null;
		} catch {
			return null;
		}
	}

	const [connections, pending, suggestions] = await Promise.all([
		safeFetch('/api/v1/users/me/connections?page=1&limit=10'),
		safeFetch('/api/v1/users/me/connections/pending?page=1&limit=10'),
		safeFetch('/api/v1/users/me/connections/suggestions?page=1&limit=20'),
	]);

	return { connections, pending, suggestions };
};
