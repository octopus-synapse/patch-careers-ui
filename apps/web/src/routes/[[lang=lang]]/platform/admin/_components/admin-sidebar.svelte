<script lang="ts">
import { Sidebar } from 'ui';
import { useAuth } from '$lib/state/auth.svelte';
import { useFeatureFlags } from '$lib/state/feature-flags.svelte';
import { locale } from '$lib/state/locale.svelte';
import { ADMIN_NAV_LINKS } from './admin-nav-links';

type Props = {
  currentPath: string;
};

let { currentPath }: Props = $props();

const t = $derived(locale.t);
const auth = useAuth();
const authenticated = $derived(auth.isAuthenticated ?? false);
const flags = useFeatureFlags(() => ({ authenticated }));

const items = $derived(
  ADMIN_NAV_LINKS.filter((l) => !l.flagKey || flags.enabled(l.flagKey)).map((l) => ({
    id: l.href,
    href: l.href,
    exact: l.exact,
    label: t(l.labelKey),
    icon: l.icon,
  })),
);
</script>

<Sidebar {items} active={currentPath} title="Admin" collapsible />
