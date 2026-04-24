<script lang="ts">
import { Sidebar } from 'ui';
import { locale } from '$lib/state/locale.svelte';
import { SETTINGS_NAV_LINKS } from './settings-nav-links';

type Props = {
  currentPath: string;
};

let { currentPath }: Props = $props();

const t = $derived(locale.t);

const items = $derived(
  SETTINGS_NAV_LINKS.map((l) => ({
    id: l.href,
    href: l.href,
    exact: l.exact,
    label: t(l.labelKey),
    icon: l.icon,
  })),
);
</script>

<Sidebar {items} active={currentPath} title={t('settings.pageTitle')} collapsible />
