<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  type PatchV1UsersProfileMutationRequest,
  createGetV1UsersProfile,
  createPatchV1UsersProfile,
  postV1OnboardingSessionRestart,
  getV1UsersProfileQueryKey,
} from 'api-client';
import { patchV1UsersProfileMutationRequestSchema } from 'api-client/zod';
import { Check } from 'lucide-svelte';
import { Button, Card, Input, Label, Loader, Textarea } from 'ui';
import { browser } from '$app/environment';
import { createForm } from '$lib/state/create-form.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);
const queryClient = useQueryClient();

const profileQuery = createGetV1UsersProfile({
  query: { enabled: browser },
});
const profileData = $derived($profileQuery.data);

let profileSaved = $state(false);

const updateProfile = createPatchV1UsersProfile({
  mutation: {
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: getV1UsersProfileQueryKey() });
      profileSaved = true;
      setTimeout(() => (profileSaved = false), 3000);
    },
  },
});

const profileForm = createForm<PatchV1UsersProfileMutationRequest>({
  schema: patchV1UsersProfileMutationRequestSchema,
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

	<Card>
		{#snippet title()}
			<div class="flex items-center justify-between">
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
		{/snippet}
		<div class="space-y-4">
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
				<Button
					variant="solid"
					size="md"
					textCase="normal"
					onclick={handleSaveProfile}
					disabled={$updateProfile.isPending}
				>
					{#if $updateProfile.isPending}
						<Loader size={13} />
					{/if}
					{t('common.save')}
				</Button>
			</div>
			<div class="mt-4 flex justify-start border-t border-gray-200 pt-4 dark:border-neutral-700">
				<Button
					variant="ghost"
					size="xs"
					onclick={async () => {
						await postV1OnboardingSessionRestart();
						window.location.href = '/onboarding';
					}}
				>
					Refresh my profile
				</Button>
			</div>
		</div>
	</Card>
</div>
