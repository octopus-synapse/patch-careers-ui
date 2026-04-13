<script lang="ts">
	import { colorSchema } from '$lib/color-schema.svelte';
	import { locale } from '$lib/locale.svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { SegmentToggle, Label, Input, Textarea } from 'ui';
	import type { Locale } from 'i18n';
	import { useQueryClient } from '@tanstack/svelte-query';
	import {
		Loader2,
		User,
		AtSign,
		Lock,
		ShieldCheck,
		Palette,
		AlertTriangle,
		Check,
		X,
		Sun,
		Moon,
		Globe,
		Download,
		Trash2,
		Eye,
		EyeOff,
		Copy
	} from 'lucide-svelte';
	import {
		createAuthSession,
		createUsersGetProfile,
		createUsersUpdateProfile,
		createUsersUpdateUsername,
		createUsersCheckUsernameAvailability,
		createChangePasswordHandle,
		createTwoFactorAuthSetup,
		createTwoFactorAuthVerify,
		createTwoFactorAuthGetStatus,
		createAuthDisable,
		createTwoFactorAuthRegenerate,
		createDeleteAccountHandle,
		getUsersGetProfileQueryKey,
		getTwoFactorAuthGetStatusQueryKey,
		customFetch
	} from 'api-client';

	const t = $derived(locale.t);
	const queryClient = useQueryClient();

	// Auth check
	const auth = createAuthSession(() => ({ query: { retry: false, enabled: browser } }));
	const authenticated = $derived(auth.data?.authenticated ?? false);

	$effect(() => {
		if (!auth.isLoading && !authenticated) goto('/login');
	});

	const successText = 'text-emerald-500';
	const errorText = 'text-red-500';

	// ===== PROFILE SECTION =====
	const profileQuery = createUsersGetProfile(() => ({
		query: { enabled: browser && authenticated }
	}));
	const profileData = $derived(profileQuery.data as Record<string, string> | undefined);

	let profileName = $state('');
	let profileBio = $state('');
	let profileLocation = $state('');
	let profileWebsite = $state('');
	let profileLinkedin = $state('');
	let profileGithub = $state('');
	let profileSaved = $state(false);

	$effect(() => {
		if (profileData) {
			profileName = profileData.name ?? '';
			profileBio = profileData.bio ?? '';
			profileLocation = profileData.location ?? '';
			profileWebsite = profileData.website ?? '';
			profileLinkedin = profileData.linkedin ?? '';
			profileGithub = profileData.github ?? '';
		}
	});

	const updateProfile = createUsersUpdateProfile(() => ({
		mutation: {
			onSuccess() {
				queryClient.invalidateQueries({ queryKey: getUsersGetProfileQueryKey() });
				profileSaved = true;
				setTimeout(() => profileSaved = false, 3000);
			}
		}
	}));

	function handleSaveProfile() {
		updateProfile.mutate({
			data: {
				name: profileName,
				bio: profileBio,
				location: profileLocation,
				website: profileWebsite,
				linkedin: profileLinkedin,
				github: profileGithub
			}
		});
	}

	// ===== USERNAME SECTION =====
	const currentUsername = $derived(profileData?.username ?? '');
	let newUsername = $state('');
	let usernameDebounceTimer = $state<ReturnType<typeof setTimeout> | null>(null);
	let debouncedUsername = $state('');
	let usernameSaved = $state(false);

	$effect(() => {
		if (usernameDebounceTimer) clearTimeout(usernameDebounceTimer);
		if (newUsername.length >= 3) {
			usernameDebounceTimer = setTimeout(() => {
				debouncedUsername = newUsername;
			}, 500);
		} else {
			debouncedUsername = '';
		}
	});

	const usernameCheck = createUsersCheckUsernameAvailability(
		() => ({ username: debouncedUsername }),
		() => ({ query: { enabled: browser && debouncedUsername.length >= 3 } })
	);
	const usernameAvailable = $derived((usernameCheck.data as Record<string, boolean> | undefined)?.available);

	const updateUsername = createUsersUpdateUsername(() => ({
		mutation: {
			onSuccess() {
				queryClient.invalidateQueries({ queryKey: getUsersGetProfileQueryKey() });
				newUsername = '';
				debouncedUsername = '';
				usernameSaved = true;
				setTimeout(() => usernameSaved = false, 3000);
			}
		}
	}));

	function handleSaveUsername() {
		if (newUsername && usernameAvailable) {
			updateUsername.mutate({ data: { username: newUsername } });
		}
	}

	// ===== PASSWORD SECTION =====
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let showCurrentPassword = $state(false);
	let showNewPassword = $state(false);
	let passwordMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	const passwordsMatch = $derived(newPassword === confirmPassword);
	const passwordValid = $derived(newPassword.length >= 8 && passwordsMatch && currentPassword.length > 0);

	const changePassword = createChangePasswordHandle(() => ({
		mutation: {
			onSuccess() {
				currentPassword = '';
				newPassword = '';
				confirmPassword = '';
				passwordMessage = { type: 'success', text: t('settings.passwordChanged') };
				setTimeout(() => passwordMessage = null, 5000);
			},
			onError() {
				passwordMessage = { type: 'error', text: t('settings.passwordError') };
				setTimeout(() => passwordMessage = null, 5000);
			}
		}
	}));

	function handleChangePassword() {
		if (!passwordValid) return;
		changePassword.mutate({ data: { currentPassword, newPassword } });
	}

	// ===== 2FA SECTION =====
	const tfaStatus = createTwoFactorAuthGetStatus(() => ({
		query: { enabled: browser && authenticated }
	}));
	const tfaData = $derived(tfaStatus.data as Record<string, unknown> | undefined);
	const tfaEnabled = $derived(Boolean(tfaData?.enabled));
	const backupCodesRemaining = $derived(Number(tfaData?.backupCodesRemaining ?? 0));

	let tfaStep = $state<'idle' | 'setup' | 'verify'>('idle');
	let tfaCode = $state('');
	let tfaSetupData = $state<{ qrCode?: string; secret?: string } | null>(null);
	let tfaBackupCodes = $state<string[] | null>(null);
	let showDisableConfirm = $state(false);

	const setupTfa = createTwoFactorAuthSetup(() => ({
		mutation: {
			onSuccess(data) {
				tfaSetupData = { qrCode: data.qrCode, secret: data.secret };
				tfaStep = 'verify';
			}
		}
	}));

	const verifyTfa = createTwoFactorAuthVerify(() => ({
		mutation: {
			onSuccess(data) {
				tfaBackupCodes = data.backupCodes;
				tfaStep = 'idle';
				tfaCode = '';
				queryClient.invalidateQueries({ queryKey: getTwoFactorAuthGetStatusQueryKey() });
			}
		}
	}));

	const disableTfa = createAuthDisable(() => ({
		mutation: {
			onSuccess() {
				showDisableConfirm = false;
				queryClient.invalidateQueries({ queryKey: getTwoFactorAuthGetStatusQueryKey() });
			}
		}
	}));

	const regenerateCodes = createTwoFactorAuthRegenerate(() => ({
		mutation: {
			onSuccess(data) {
				tfaBackupCodes = data.backupCodes;
				queryClient.invalidateQueries({ queryKey: getTwoFactorAuthGetStatusQueryKey() });
			}
		}
	}));

	function handleSetup2fa() {
		tfaStep = 'setup';
		setupTfa.mutate();
	}

	function handleVerify2fa() {
		if (tfaCode.length > 0) {
			verifyTfa.mutate({ data: { code: tfaCode } });
		}
	}

	function handleDisable2fa() {
		disableTfa.mutate();
	}

	function handleRegenerateCodes() {
		regenerateCodes.mutate();
	}

	function copyBackupCodes() {
		if (tfaBackupCodes) {
			navigator.clipboard.writeText(tfaBackupCodes.join('\n'));
		}
	}

	// ===== PREFERENCES SECTION =====
	const themeOptions = [{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }];
	const localeOptions = $derived(locale.locales.map((l: string) => ({ value: l, label: l === 'pt-BR' ? 'PT' : 'EN' })));

	function handleThemeToggle(value: string) {
		if (value !== colorSchema.mode) colorSchema.toggle();
	}

	function handleLocaleChange(value: string) {
		locale.set(value as Locale);
	}

	// ===== DANGER ZONE =====
	let deleteConfirmation = $state('');
	let showDeleteModal = $state(false);
	let isExporting = $state(false);

	const deleteAccount = createDeleteAccountHandle(() => ({
		mutation: {
			onSuccess() {
				goto('/login');
			}
		}
	}));

	async function handleExportData() {
		isExporting = true;
		try {
			const { userConsentExportData } = await import('api-client');
			const response = await userConsentExportData();
			const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'my-data-export.json';
			a.click();
			URL.revokeObjectURL(url);
		} finally {
			isExporting = false;
		}
	}

	function handleDeleteAccount() {
		if (deleteConfirmation === 'DELETE MY ACCOUNT') {
			deleteAccount.mutate({ data: { confirmationPhrase: deleteConfirmation } });
		}
	}

	// Sidebar sections
	type SectionId = 'profile' | 'username' | 'password' | 'twoFactor' | 'preferences' | 'danger';
	const sections: { id: SectionId; icon: typeof User; labelKey: string }[] = [
		{ id: 'profile', icon: User, labelKey: 'settings.profile' },
		{ id: 'username', icon: AtSign, labelKey: 'settings.username' },
		{ id: 'password', icon: Lock, labelKey: 'settings.password' },
		{ id: 'twoFactor', icon: ShieldCheck, labelKey: 'settings.twoFactor' },
		{ id: 'preferences', icon: Palette, labelKey: 'settings.preferences' },
		{ id: 'danger', icon: AlertTriangle, labelKey: 'settings.dangerZone' }
	];
	let activeSection = $state<SectionId>('profile');
	const activeLabel = $derived(t(sections.find(s => s.id === activeSection)?.labelKey ?? 'settings.profile') ?? 'Profile');
</script>

<svelte:head>
	<title>{t('settings.pageTitle')}</title>
</svelte:head>

{#if auth.isLoading}
	<div class="flex min-h-screen items-center justify-center pt-14">
		<Loader2 size={24} class="animate-spin text-gray-500 dark:text-neutral-500" />
	</div>
{:else if t && authenticated}
	<div class="font-sans antialiased transition-colors duration-300">
		<main class="mx-auto max-w-5xl px-6" style="padding-top: max(5rem, calc((100vh - 36rem) / 2));">
			<div class="flex gap-10">
				<!-- Sidebar -->
				<aside class="hidden w-56 flex-shrink-0 md:block">
					<div class="sticky top-20 border-r pr-6 border-gray-200 dark:border-neutral-800">
						<div class="mb-6">
							<h2 class="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
								{t('settings.pageTitle')}
							</h2>
						</div>
						<nav class="flex flex-col gap-1">
							{#each sections as section}
								{@const active = activeSection === section.id}
								<button
									onclick={() => activeSection = section.id}
									class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs cursor-pointer transition-colors
										{active ? 'bg-white dark:bg-neutral-700/50' : 'text-gray-700 hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-neutral-700/50'}"
								>
									<section.icon size={15} class={active ? 'text-gray-800 dark:text-neutral-200' : 'text-gray-500 dark:text-neutral-500'} />
									<span class={active ? 'font-bold text-gray-800 dark:text-neutral-200' : 'text-gray-500 dark:text-neutral-500'}>
										{t(section.labelKey)}
									</span>
								</button>
							{/each}
						</nav>
					</div>
				</aside>

				<!-- Main content -->
				<div class="flex-1 max-w-lg pb-12">
					<div class="mb-4">
						<span class="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
							{t('settings.pageTitle')}
						</span>
						<h3 class="text-sm font-bold text-gray-800 dark:text-neutral-200">{activeLabel}</h3>
					</div>

					{#if activeSection === 'profile'}
					<!-- Profile Section -->
					<section id="profile" class="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50 overflow-hidden">
						<div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
							<h2 class="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
								{t('settings.profile')}
							</h2>
							{#if profileSaved}
								<span class="flex items-center gap-1 text-xs {successText}">
									<Check size={14} />
									{t('settings.saved')}
								</span>
							{/if}
						</div>
						<div class="p-5 space-y-4">
							<div>
								<Label for="profile-name">{t('settings.name')}</Label>
								<Input
									id="profile-name"
									type="text"
									bind:value={profileName}
									class="mt-1"
								/>
							</div>
							<div>
								<Label for="profile-bio">{t('settings.bio')}</Label>
								<Textarea
									id="profile-bio"
									bind:value={profileBio}
									rows={3}
									maxlength={500}
									class="mt-1"
								/>
								<p class="mt-1 text-right text-[10px] text-gray-500 dark:text-neutral-500">{profileBio.length}/500</p>
							</div>
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<Label for="profile-location">{t('settings.location')}</Label>
									<Input
										id="profile-location"
										type="text"
										bind:value={profileLocation}
										class="mt-1"
									/>
								</div>
								<div>
									<Label for="profile-website">{t('settings.website')}</Label>
									<Input
										id="profile-website"
										type="url"
										bind:value={profileWebsite}
										placeholder="https://"
										class="mt-1"
									/>
								</div>
								<div>
									<Label for="profile-linkedin">LinkedIn</Label>
									<Input
										id="profile-linkedin"
										type="url"
										bind:value={profileLinkedin}
										placeholder="https://linkedin.com/in/..."
										class="mt-1"
									/>
								</div>
								<div>
									<Label for="profile-github">GitHub</Label>
									<Input
										id="profile-github"
										type="url"
										bind:value={profileGithub}
										placeholder="https://github.com/..."
										class="mt-1"
									/>
								</div>
							</div>
							<div class="flex justify-end pt-2">
								<button
									onclick={handleSaveProfile}
									disabled={updateProfile.isPending}
									class="flex items-center gap-2 rounded-full px-5 py-2 text-[11px] font-semibold transition-all disabled:opacity-50 bg-gray-800 text-white hover:bg-gray-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300"
								>
									{#if updateProfile.isPending}
										<Loader2 size={13} class="animate-spin" />
									{/if}
									{t('common.save')}
								</button>
							</div>
							<div class="flex justify-start pt-4 border-t border-gray-200 dark:border-neutral-700 mt-4">
								<button
									onclick={async () => {
										await customFetch('/api/v1/onboarding/session/restart', { method: 'POST' });
										window.location.href = '/onboarding';
									}}
									class="text-xs font-semibold uppercase tracking-widest text-gray-500 hover:text-gray-800 dark:text-neutral-500 dark:hover:text-neutral-200 transition-colors"
								>
									Refresh my profile
								</button>
							</div>
						</div>
					</section>

					{/if}

					{#if activeSection === 'username'}
					<!-- Username Section -->
					<section id="username" class="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50 overflow-hidden">
						<div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
							<h2 class="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
								{t('settings.username')}
							</h2>
							{#if usernameSaved}
								<span class="flex items-center gap-1 text-xs {successText}">
									<Check size={14} />
									{t('settings.saved')}
								</span>
							{/if}
						</div>
						<div class="p-5 space-y-4">
							<div>
								<span class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">{t('settings.currentUsername')}</span>
								<p class="mt-1 text-sm text-gray-800 dark:text-neutral-200">@{currentUsername || '---'}</p>
							</div>
							<div>
								<Label for="new-username">{t('settings.newUsername')}</Label>
								<div class="relative mt-1">
									<Input
										id="new-username"
										type="text"
										bind:value={newUsername}
										placeholder={t('settings.usernamePlaceholder')}
										class="pr-10"
									/>
									{#if debouncedUsername.length >= 3 && !usernameCheck.isLoading}
										<div class="absolute right-3 top-1/2 -translate-y-1/2">
											{#if usernameAvailable}
												<Check size={16} class={successText} />
											{:else}
												<X size={16} class={errorText} />
											{/if}
										</div>
									{/if}
									{#if usernameCheck.isLoading}
										<div class="absolute right-3 top-1/2 -translate-y-1/2">
											<Loader2 size={14} class="animate-spin text-gray-500 dark:text-neutral-500" />
										</div>
									{/if}
								</div>
								{#if debouncedUsername.length >= 3 && !usernameCheck.isLoading}
									<p class="mt-1 text-xs {usernameAvailable ? successText : errorText}">
										{usernameAvailable ? t('settings.usernameAvailable') : t('settings.usernameTaken')}
									</p>
								{/if}
							</div>
							<p class="text-[10px] text-gray-500 dark:text-neutral-500">{t('settings.usernameNote')}</p>
							<div class="flex justify-end pt-2">
								<button
									onclick={handleSaveUsername}
									disabled={updateUsername.isPending || !usernameAvailable || !newUsername}
									class="flex items-center gap-2 rounded-full px-5 py-2 text-[11px] font-semibold transition-all disabled:opacity-50 bg-gray-800 text-white hover:bg-gray-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300"
								>
									{#if updateUsername.isPending}
										<Loader2 size={13} class="animate-spin" />
									{/if}
									{t('common.save')}
								</button>
							</div>
						</div>
					</section>

					{/if}

					{#if activeSection === 'password'}
					<!-- Password Section -->
					<section id="password" class="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50 overflow-hidden">
						<div class="px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
							<h2 class="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
								{t('settings.password')}
							</h2>
						</div>
						<div class="p-5 space-y-4">
							<div>
								<Label for="current-password">{t('settings.currentPassword')}</Label>
								<div class="relative mt-1">
									<Input
										id="current-password"
										type={showCurrentPassword ? 'text' : 'password'}
										bind:value={currentPassword}
										class="pr-10"
									/>
									<button
										type="button"
										onclick={() => showCurrentPassword = !showCurrentPassword}
										class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-neutral-500"
									>
										{#if showCurrentPassword}<EyeOff size={14} />{:else}<Eye size={14} />{/if}
									</button>
								</div>
							</div>
							<div>
								<Label for="new-password">{t('settings.newPassword')}</Label>
								<div class="relative mt-1">
									<Input
										id="new-password"
										type={showNewPassword ? 'text' : 'password'}
										bind:value={newPassword}
										class="pr-10"
									/>
									<button
										type="button"
										onclick={() => showNewPassword = !showNewPassword}
										class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-neutral-500"
									>
										{#if showNewPassword}<EyeOff size={14} />{:else}<Eye size={14} />{/if}
									</button>
								</div>
								{#if newPassword.length > 0 && newPassword.length < 8}
									<p class="mt-1 text-xs {errorText}">{t('settings.passwordMinLength')}</p>
								{/if}
							</div>
							<div>
								<Label for="confirm-password">{t('settings.confirmPassword')}</Label>
								<Input
									id="confirm-password"
									type="password"
									bind:value={confirmPassword}
									class="mt-1"
								/>
								{#if confirmPassword.length > 0 && !passwordsMatch}
									<p class="mt-1 text-xs {errorText}">{t('settings.passwordMismatch')}</p>
								{/if}
							</div>
							{#if passwordMessage}
								<p class="text-xs {passwordMessage.type === 'success' ? successText : errorText}">
									{passwordMessage.text}
								</p>
							{/if}
							<div class="flex justify-end pt-2">
								<button
									onclick={handleChangePassword}
									disabled={changePassword.isPending || !passwordValid}
									class="flex items-center gap-2 rounded-full px-5 py-2 text-[11px] font-semibold transition-all disabled:opacity-50 bg-gray-800 text-white hover:bg-gray-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300"
								>
									{#if changePassword.isPending}
										<Loader2 size={13} class="animate-spin" />
									{/if}
									{t('settings.changePassword')}
								</button>
							</div>
						</div>
					</section>

					{/if}

					{#if activeSection === 'twoFactor'}
					<!-- Two-Factor Authentication Section -->
					<section id="twoFactor" class="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50 overflow-hidden">
						<div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
							<h2 class="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
								{t('settings.twoFactor')}
							</h2>
							<span class="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider {tfaEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-neutral-500/10 text-gray-500 dark:text-neutral-500'}">
								{tfaEnabled ? t('settings.tfaEnabled') : t('settings.tfaDisabled')}
							</span>
						</div>
						<div class="p-5 space-y-4">
							{#if tfaBackupCodes}
								<div class="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
									<p class="text-xs font-semibold text-amber-500 mb-2">{t('settings.backupCodesWarning')}</p>
									<div class="grid grid-cols-2 gap-1">
										{#each tfaBackupCodes as code}
											<code class="text-xs font-mono text-gray-800 dark:text-neutral-200">{code}</code>
										{/each}
									</div>
									<button
										onclick={copyBackupCodes}
										class="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-neutral-500 hover:opacity-70"
									>
										<Copy size={12} />
										{t('settings.copyBackupCodes')}
									</button>
								</div>
							{/if}

							{#if !tfaEnabled}
								{#if tfaStep === 'idle'}
									<p class="text-sm text-gray-500 dark:text-neutral-500">{t('settings.tfaDescription')}</p>
									<button
										onclick={handleSetup2fa}
										disabled={setupTfa.isPending}
										class="flex items-center gap-2 rounded-full px-5 py-2 text-[11px] font-semibold transition-all disabled:opacity-50 bg-gray-800 text-white hover:bg-gray-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300"
									>
										{#if setupTfa.isPending}
											<Loader2 size={13} class="animate-spin" />
										{/if}
										{t('settings.enable2fa')}
									</button>
								{:else if tfaStep === 'verify' && tfaSetupData}
									<div class="space-y-4">
										{#if tfaSetupData.qrCode}
											<div class="flex justify-center">
												<img src={tfaSetupData.qrCode} alt="2FA QR Code" class="h-48 w-48 rounded-lg" />
											</div>
										{/if}
										{#if tfaSetupData.secret}
											<div>
												<p class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500 mb-1">{t('settings.manualEntry')}</p>
												<code class="block rounded-lg border p-2 text-xs font-mono bg-white border-gray-300 text-gray-800 placeholder-gray-400 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 dark:placeholder-neutral-500">{tfaSetupData.secret}</code>
											</div>
										{/if}
										<div>
											<Label for="tfa-code">{t('settings.verificationCode')}</Label>
											<Input
												id="tfa-code"
												type="text"
												bind:value={tfaCode}
												maxlength={6}
												placeholder="000000"
												class="mt-1 font-mono tracking-widest"
											/>
										</div>
										<div class="flex gap-2">
											<button
												onclick={() => { tfaStep = 'idle'; tfaSetupData = null; tfaCode = ''; }}
												class="rounded-full border px-5 py-2 text-[11px] font-semibold transition-all border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
											>
												{t('common.cancel')}
											</button>
											<button
												onclick={handleVerify2fa}
												disabled={verifyTfa.isPending || tfaCode.length < 6}
												class="flex items-center gap-2 rounded-full px-5 py-2 text-[11px] font-semibold transition-all disabled:opacity-50 bg-gray-800 text-white hover:bg-gray-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300"
											>
												{#if verifyTfa.isPending}
													<Loader2 size={13} class="animate-spin" />
												{/if}
												{t('settings.verify')}
											</button>
										</div>
									</div>
								{/if}
							{:else}
								<div class="space-y-3">
									<p class="text-sm text-gray-500 dark:text-neutral-500">
										{t('settings.backupCodesRemaining', { count: String(backupCodesRemaining) })}
									</p>
									<div class="flex flex-wrap gap-2">
										<button
											onclick={handleRegenerateCodes}
											disabled={regenerateCodes.isPending}
											class="flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold transition-all disabled:opacity-50 border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
										>
											{#if regenerateCodes.isPending}
												<Loader2 size={13} class="animate-spin" />
											{/if}
											{t('settings.regenerateBackupCodes')}
										</button>
										{#if !showDisableConfirm}
											<button
												onclick={() => showDisableConfirm = true}
												class="rounded-full border border-red-500/30 px-4 py-2 text-[11px] font-semibold text-red-500 transition-all hover:bg-red-500/10"
											>
												{t('settings.disable2fa')}
											</button>
										{:else}
											<div class="flex items-center gap-2">
												<span class="text-xs text-red-500">{t('settings.confirmDisable2fa')}</span>
												<button
													onclick={handleDisable2fa}
													disabled={disableTfa.isPending}
													class="rounded-full bg-red-500 px-4 py-1.5 text-[11px] font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
												>
													{#if disableTfa.isPending}
														<Loader2 size={13} class="animate-spin" />
													{:else}
														{t('common.confirm')}
													{/if}
												</button>
												<button
													onclick={() => showDisableConfirm = false}
													class="text-xs text-gray-500 dark:text-neutral-500 hover:opacity-70"
												>
													{t('common.cancel')}
												</button>
											</div>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					</section>

					{/if}

					{#if activeSection === 'preferences'}
					<!-- Preferences Section -->
					<section id="preferences" class="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50 overflow-hidden">
						<div class="px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
							<h2 class="text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
								{t('settings.preferences')}
							</h2>
						</div>
						<div class="p-5 space-y-4">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<Sun size={16} class="hidden dark:block text-neutral-500" /><Moon size={16} class="block dark:hidden text-gray-500" />
									<span class="text-sm text-gray-800 dark:text-neutral-200">{t('settings.theme')}</span>
								</div>
								<SegmentToggle options={themeOptions} selected={colorSchema.mode} onchange={handleThemeToggle} />
							</div>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<Globe size={16} class="text-gray-500 dark:text-neutral-500" />
									<span class="text-sm text-gray-800 dark:text-neutral-200">{t('settings.language')}</span>
								</div>
								<SegmentToggle options={localeOptions} selected={locale.current} onchange={handleLocaleChange} />
							</div>
						</div>
					</section>

					{/if}

					{#if activeSection === 'danger'}
					<!-- Danger Zone Section -->
					<section id="danger" class="rounded-xl border border-red-500/30 bg-white dark:bg-neutral-800/50 overflow-hidden">
						<div class="px-5 py-4 border-b border-red-500/30">
							<h2 class="text-[10px] font-semibold uppercase tracking-widest text-red-500">
								{t('settings.dangerZone')}
							</h2>
						</div>
						<div class="p-5 space-y-4">
							<div class="flex items-center justify-between">
								<div>
									<p class="text-sm font-medium text-gray-800 dark:text-neutral-200">{t('settings.exportData')}</p>
									<p class="text-[11px] text-gray-500 dark:text-neutral-500">{t('settings.exportDataDescription')}</p>
								</div>
								<button
									onclick={handleExportData}
									disabled={isExporting}
									class="flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold transition-all disabled:opacity-50 border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
								>
									{#if isExporting}
										<Loader2 size={13} class="animate-spin" />
									{:else}
										<Download size={13} />
									{/if}
									{t('settings.exportButton')}
								</button>
							</div>
							<div class="h-px bg-red-500/10"></div>
							<div class="flex items-center justify-between">
								<div>
									<p class="text-sm font-medium text-red-500">{t('settings.deleteAccount')}</p>
									<p class="text-[11px] text-gray-500 dark:text-neutral-500">{t('settings.deleteAccountDescription')}</p>
								</div>
								<button
									onclick={() => showDeleteModal = true}
									class="flex items-center gap-2 rounded-full border border-red-500/30 px-4 py-2 text-[11px] font-semibold text-red-500 transition-all hover:bg-red-500/10"
								>
									<Trash2 size={13} />
									{t('settings.deleteButton')}
								</button>
							</div>
						</div>
					</section>
					{/if}
				</div>
			</div>
		</main>
	</div>

	<!-- Delete Account Modal -->
	{#if showDeleteModal}
		<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
			<div class="w-full max-w-md rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/50 p-6 space-y-4">
				<h3 class="text-lg font-semibold text-red-500">{t('settings.deleteAccount')}</h3>
				<p class="text-sm text-gray-500 dark:text-neutral-500">{t('settings.deleteAccountWarning')}</p>
				<div>
					<Label for="delete-confirm">
						{t('settings.typeToConfirm')}
					</Label>
					<Input
						id="delete-confirm"
						type="text"
						bind:value={deleteConfirmation}
						placeholder="DELETE MY ACCOUNT"
						class="mt-1 font-mono"
					/>
				</div>
				<div class="flex justify-end gap-2 pt-2">
					<button
						onclick={() => { showDeleteModal = false; deleteConfirmation = ''; }}
						class="rounded-full border px-5 py-2 text-[11px] font-semibold transition-all border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
					>
						{t('common.cancel')}
					</button>
					<button
						onclick={handleDeleteAccount}
						disabled={deleteConfirmation !== 'DELETE MY ACCOUNT' || deleteAccount.isPending}
						class="flex items-center gap-2 rounded-full bg-red-500 px-5 py-2 text-[11px] font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
					>
						{#if deleteAccount.isPending}
							<Loader2 size={13} class="animate-spin" />
						{/if}
						{t('settings.deleteButton')}
					</button>
				</div>
			</div>
		</div>
	{/if}
{/if}
