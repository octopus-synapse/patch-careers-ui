<!--
  Reusable SEO head: emits `<title>`, description, canonical URL, Open Graph
  and Twitter card tags. Drop inside any `+page.svelte` that should be
  crawlable / shareable.
-->
<script lang="ts">
import { page } from '$app/stores';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

interface Props {
  title: string;
  description?: string;
  image?: string;
  canonical?: string;
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

let {
  title,
  description = 'ProFile / Patch Careers — build, share, and land jobs with a resume that earns you interviews.',
  image,
  canonical,
  type = 'website',
  noindex = false,
  jsonLd,
}: Props = $props();

const appTitle = 'Patch Careers';
const fullTitle = $derived(title === appTitle ? title : t('seo.titleSuffix', { title, appTitle }));
const url = $derived(canonical ?? $page.url.toString());
const ogImage = $derived(image ?? `${$page.url.origin}/og-default.png`);

const jsonLdStr = $derived(jsonLd ? JSON.stringify(jsonLd) : null);
</script>

<svelte:head>
  <title>{fullTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={url} />
  {#if noindex}
    <meta name="robots" content="noindex, nofollow" />
  {:else}
    <meta name="robots" content="index, follow" />
  {/if}

  <!-- Open Graph -->
  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={url} />
  <meta property="og:type" content={type} />
  <meta property="og:site_name" content={appTitle} />
  <meta property="og:image" content={ogImage} />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={fullTitle} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={ogImage} />

  {#if jsonLdStr}
    {@html `<script type="application/ld+json">${jsonLdStr}</` + `script>`}
  {/if}
</svelte:head>
