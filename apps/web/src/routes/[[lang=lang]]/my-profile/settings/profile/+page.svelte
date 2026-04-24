<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createUsersGetProfile,
  createUsersUpdateProfile,
  getUsersGetProfileQueryKey,
  onboardingRestartOnboarding,
} from 'api-client';
import { UsersUpdateProfileBody } from 'api-client/zod';
import { Check, Loader2 } from 'lucide-svelte';
import { Input, Label, Textarea } from 'ui';
import { browser } from '$app/environment';
import { createForm } from '$lib/state/create-form.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);
const queryClient = useQueryClient();

const profileQuery = createUsersGetProfile(() => ({
  query: { enabled: browser },
}));
const profileData = $derived(profileQuery.data as Record<string, string> | undefined);

let profileSaved = $state(false);

const updateProfile = createUsersUpdateProfile(() => ({
  mutation: {
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: getUsersGetProfileQueryKey() });
      profileSaved = true;
      setTimeout(() => (profileSaved = false), 3000);
    },
  },
}));

const profileForm = createForm({
  schema: UsersUpdateProfileBody,
  initial: { name: '', bio: '', location: '', website: '', linkedin: '', github: '' },
  mutation: updateProfile,
  transform: (v) => ({
    name: v.name?.trim() || undefined,
    bio: v.bio?.trim() || undefined,
    location: v.location?.trim() || undefined,
    website: v.website?.trim() || undefined,
    linkedin: v.linkedin?.trim() || undefined,
    github: v.github?.trim() || undefined,
  }),
});

$effect(() => {
  if (profileData) {
    profileForm.values.name = profileData.name ?? '';
    profileForm.values.bio = profileData.bio ?? '';
    profileForm.values.location = profileData.location ?? '';
    profileForm.values.website = profileData.website ?? '';
    profileForm.values.linkedin = profileData.linkedin ?? '';
    profileForm.values.github = profileData.github ?? '';
  }
});

function handleSaveProfile() {
  profileForm.submit();
}
</script>

<svelte:head>
	<title>{t('settings.profile')} · {t('settings.pageTitle')}</title>
</svelte:head>

<div class="mx-auto max-w-lg">
	<div class="mb-4">
		<span class="text-xs font-medium text-gray-500 dark:text-neutral-500">
			{t('settings.pageTitle')}
		</span>
		<h3 class="text-sm font-bold text-gray-800 dark:text-neutral-200">{t('settings.profile')}</h3>
	</div>

	<section
		class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-800/50"
	>
		<div
			class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-neutral-800"
		>
			<h2 class="text-xs font-medium text-gray-500 dark:text-neutral-500">
				{t('settings.profile')}
			</h2>
			{#if profileSaved}
				<span class="flex items-center gap-1 text-xs text-emerald-500">
					<Check size={14} />
					{t('settings.saved')}
				</span>
			{/if}
		</div>
		<div class="space-y-4 p-5">
			<div>
				<Label for="profile-name">{t('settings.name')}</Label>
				<Input id="profile-name" type="text" bind:value={profileForm.values.name} class="mt-1" />
			</div>
			<div>
				<Label for="profile-bio">{t('settings.bio')}</Label>
				<Textarea
					id="profile-bio"
					bind:value={profileForm.values.bio}
					rows={3}
					maxlength={500}
					class="mt-1"
				/>
				<p class="mt-1 text-right text-[10px] text-gray-500 dark:text-neutral-500">
					{(profileForm.values.bio ?? '').length}/500
				</p>
			</div>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<Label for="profile-location">{t('settings.location')}</Label>
					<Input
						id="profile-location"
						type="text"
						bind:value={profileForm.values.location}
						class="mt-1"
					/>
				</div>
				<div>
					<Label for="profile-website">{t('settings.website')}</Label>
					<Input
						id="profile-website"
						type="url"
						bind:value={profileForm.values.website}
						placeholder="https://"
						class="mt-1"
					/>
				</div>
				<div>
					<Label for="profile-linkedin">LinkedIn</Label>
					<Input
						id="profile-linkedin"
						type="url"
						bind:value={profileForm.values.linkedin}
						placeholder="https://linkedin.com/in/..."
						class="mt-1"
					/>
				</div>
				<div>
					<Label for="profile-github">GitHub</Label>
					<Input
						id="profile-github"
						type="url"
						bind:value={profileForm.values.github}
						placeholder="https://github.com/..."
						class="mt-1"
					/>
				</div>
			</div>
			<div class="flex justify-end pt-2">
				<button
					onclick={handleSaveProfile}
					disabled={updateProfile.isPending}
					class="flex items-center gap-2 rounded-full bg-gray-800 px-5 py-2 text-[11px] font-semibold text-white transition-all hover:bg-gray-700 disabled:opacity-50 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300"
				>
					{#if updateProfile.isPending}
						<Loader2 size={13} class="animate-spin" />
					{/if}
					{t('common.save')}
				</button>
			</div>
			<div class="mt-4 flex justify-start border-t border-gray-200 pt-4 dark:border-neutral-700">
				<button
					onclick={async () => {
						await onboardingRestartOnboarding();
						window.location.href = '/onboarding';
					}}
					class="text-xs font-semibold uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200"
				>
					Refresh my profile
				</button>
			</div>
		</div>
	</section>
</div>
