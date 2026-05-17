<script lang="ts">
  /**
   * Public profile (@username) — burra: chama createGetV1UsersProfile e renderiza
   * o perfil público do usuário com seções de skills, badges, atividades.
   *
   * Connect/Follow ficaram fora desta versão (SDK em remodelagem). Quando
   * o slice F4-social estabilizar createSocialFollow* e createSocialConnections*,
   * basta plugar de volta os botões nesta página.
   */
  import { createGetV1ProfilesUsername, getV1ExportUserUserIdResumePdf } from 'api-client';
  import { FileDown, Globe, MapPin } from 'lucide-svelte';
  import { Button, Loader } from 'ui';
  import { handleApiError } from '$lib/components/errors/error-renderer.svelte';
  import { page } from '$app/stores';
  import { useAuth } from '$lib/state/auth.svelte';
  import { locale } from '$lib/state/locale.svelte';
  import ProfileActivityTabs from './_components/profile-activity-tabs.svelte';
  import ProfileBadges from './_components/profile-badges.svelte';
  import SkillsSection from './_components/skills-section.svelte';
  import SeoHead from '$lib/components/seo/seo-head.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const t = $derived(locale.t);

  const username = $derived($page.params.username ?? '');

  const auth = useAuth();
  const currentUserId = $derived(String(auth.userId ?? ''));
  const authenticated = $derived(auth.isAuthenticated);

  // `+page.server.ts` already fetched the profile so the SSR'd HTML
  // carries real content (name, bio, photo, JSON-LD). Seeding the
  // TanStack hook with `initialData` keeps that content on screen
  // until the first client-side refetch picks up any drift. `data`
  // is a $props rune — wrap the read in a getter so Svelte's
  // `state_referenced_locally` lint is satisfied.
  const profile = createGetV1ProfilesUsername(() => username, {
    query: {
      enabled: () => !!username,
      initialData: () => data.profile,
    },
  });

  const user = $derived($profile.data?.user);
  const resume = $derived($profile.data?.resume);

  const userId = $derived(user?.id ?? '');
  const isOwnProfile = $derived(!!currentUserId && currentUserId === userId);

  let downloading = $state(false);
  let downloadError = $state<string | null>(null);

  async function downloadResume() {
    if (!userId || downloading) return;
    downloading = true;
    downloadError = null;
    try {
      const res = await getV1ExportUserUserIdResumePdf(userId);
      const bytes = Uint8Array.from(atob(res.pdf), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      downloadError = err instanceof Error ? err.message : t('myProfile.public.downloadResumeError');
    } finally {
      downloading = false;
    }
  }

  let copiedLink = $state(false);
  async function copyPublicLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      copiedLink = true;
      setTimeout(() => (copiedLink = false), 2000);
    } catch (err) {
      handleApiError(err);
    }
  }

  function bannerGradient(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const h1 = Math.abs(hash % 360);
    const h2 = (h1 + 40) % 360;
    return `linear-gradient(135deg, hsl(${h1}, 50%, 40%), hsl(${h2}, 60%, 30%))`;
  }
</script>

<SeoHead
  title={user?.name ?? user?.username ?? username ?? 'Profile'}
  description={user?.bio
    ? user.bio.slice(0, 180)
    : `${user?.name ?? username ?? ''} — professional profile and resume on Patch Careers.`}
  image={user?.photoURL || undefined}
  type="profile"
  jsonLd={user
    ? {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: user.name ?? user.username,
        alternateName: user.username,
        image: user.photoURL,
        url: $page.url.toString(),
        jobTitle: resume?.jobTitle || undefined,
      }
    : undefined}
/>

{#if $profile.isLoading}
  <div class="flex h-screen items-center justify-center">
    <Loader size={20} />
  </div>
{:else if $profile.isError || !user}
  <div class="flex h-screen flex-col items-center justify-center gap-3">
    <span class="text-4xl font-bold text-gray-800 dark:text-neutral-200">404</span>
    <span class="text-xs text-gray-500 dark:text-neutral-500">profile not found</span>
  </div>
{:else}
  <div class="min-h-screen pt-14">
    <div class="h-48 w-full sm:h-56" style:background={bannerGradient(username ?? '')}></div>

    <div class="mx-auto max-w-3xl px-3 sm:px-6">
      <div
        class="relative -mt-14 sm:-mt-16 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:gap-6"
      >
        {#if user.photoURL}
          <img
            src={user.photoURL}
            alt={user.name ?? username}
            class="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 object-cover border-white dark:border-neutral-900"
          />
        {:else}
          <div
            class="flex h-24 w-24 sm:h-32 sm:w-32 items-center justify-center rounded-full border-4 text-3xl sm:text-4xl font-bold border-white bg-gray-200 text-gray-600 dark:border-neutral-900 dark:bg-neutral-700 dark:text-neutral-200"
          >
            {(user.name ?? username ?? '?').charAt(0).toUpperCase()}
          </div>
        {/if}

        <div class="flex flex-1 flex-col gap-3 pb-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-neutral-200">
              {user.name ?? username}
            </h1>
            <span class="text-sm text-gray-500 dark:text-neutral-500">
              @{user.username ?? username}
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onclick={copyPublicLink}
              class="rounded-full px-4 py-1.5 text-[11px]"
            >
              {copiedLink ? t('myProfile.public.copiedButton') : t('actions.copyLink')}
            </Button>
          </div>
        </div>
      </div>

      {#if user.bio}
        <p class="mt-4 max-w-xl text-sm leading-relaxed text-gray-800 dark:text-neutral-200">
          {user.bio}
        </p>
      {/if}

      {#if userId}
        <div class="mt-3">
          <ProfileBadges {userId} />
        </div>
      {/if}

      <div class="mt-3 flex flex-wrap items-center gap-4 text-[12px] text-gray-500 dark:text-neutral-500">
        {#if user.location}
          <span class="flex items-center gap-1">
            <MapPin size={13} />
            {user.location}
          </span>
        {/if}
        {#if user.website}
          <a
            href={user.website}
            target="_blank"
            rel="noopener"
            class="flex items-center gap-1 hover:underline"
          >
            <Globe size={13} />
            {user.website.replace(/^https?:\/\//, '')}
          </a>
        {/if}
      </div>

      {#if userId}
        <div class="mt-6">
          <SkillsSection
            {userId}
            {isOwnProfile}
            viewerAuthenticated={authenticated}
          />
        </div>
        <ProfileActivityTabs {userId} />
      {/if}

      {#if resume && authenticated}
        <div
          class="mt-6 rounded-xl border p-4 sm:p-5 border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50"
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 class="text-sm font-semibold text-gray-800 dark:text-neutral-200">Resume</h3>
              <p class="mt-0.5 text-[11px] text-gray-500 dark:text-neutral-500">
                Download {user.name ?? username}'s resume
              </p>
              {#if downloadError}
                <p class="mt-1 text-[11px] text-red-500">{downloadError}</p>
              {/if}
            </div>
            <Button
              variant="solid"
              size="sm"
              onclick={downloadResume}
              disabled={downloading}
              class="rounded-full px-4 py-1.5 text-[11px]"
            >
              {#if downloading}
                <Loader size={13} />
                Generating...
              {:else}
                <FileDown size={13} />
                Download
              {/if}
            </Button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
