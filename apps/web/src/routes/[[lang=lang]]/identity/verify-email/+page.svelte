<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createGetV1AuthEmailVerificationResendStatus,
  createPostV1AuthEmailVerificationSend,
  createVerify,
  sessionQueryKey,
  postV1AuthEmailVerificationSendMutationKey,
  isApiError,
} from 'api-client';
import { CheckCircle2, Mail } from 'lucide-svelte';
import { onMount } from 'svelte';
import { Badge, Button, Loader, OtpInput } from 'ui';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { useAuth } from '$lib/state/auth.svelte';
import { locale } from '$lib/state/locale.svelte';


const t = $derived(locale.t);
const queryClient = useQueryClient();

const CODE_LENGTH = 6;

const tokenFromUrl = $derived($page.url.searchParams.get('token') ?? '');

const session = useAuth();
const authenticated = $derived(session.isAuthenticated);
const email = $derived(session.user?.email ?? '');
const needsEmailVerification = $derived(Boolean(session.needsEmailVerification));

// Resend cooldown is owned by the backend — the UI just mirrors it so the
// countdown survives page reloads.
// svelte-ignore state_referenced_locally
const resendStatus = createGetV1AuthEmailVerificationResendStatus({
  query: { retry: false, enabled: browser && authenticated === true, refetchOnWindowFocus: false },
});

let verificationCode = $state('');
let verifyError = $state('');
let resentFlash = $state(false);
let autoVerifying = $state(false);
let cooldownRemaining = $state(0);
let cooldownTimer: ReturnType<typeof setInterval> | null = null;

async function leaveVerifyScreen() {
  await queryClient.invalidateQueries({ queryKey: sessionQueryKey() });
  goto('/onboarding');
}

function isAlreadyVerified(err: unknown): boolean {
  // OAuth sign-ups arrive pre-verified, so the backend answers 409
  // `EMAIL_ALREADY_VERIFIED` to both verify and send. Treat it as a success
  // signal: we only need to refresh the session so OnboardingGuard forwards.
  return isApiError(err) && err.code === 'EMAIL_ALREADY_VERIFIED';
}

let verifiedOnce = $state(false);

const verifyEmail = createVerify({
  mutation: {
    async onSuccess() {
      verifiedOnce = true;
      await leaveVerifyScreen();
    },
    async onError(err: unknown) {
      if (isAlreadyVerified(err)) {
        verifiedOnce = true;
        await leaveVerifyScreen();
        return;
      }
      // A late-arriving error from a racing duplicate submit can land after
      // verification already succeeded — don't clobber the success UI.
      if (verifiedOnce) return;
      if (!t) return;
      autoVerifying = false;
      if (isApiError(err)) verifyError = err.message;
      verificationCode = '';
    },
  },
});

const sendVerification = createPostV1AuthEmailVerificationSend({
  mutation: {
    async onError(err: unknown) {
      if (isAlreadyVerified(err)) {
        await leaveVerifyScreen();
        return;
      }
      if (!t) return;
      if (isApiError(err)) verifyError = err.message;
    },
  },
});

function startCooldown(seconds: number) {
  if (cooldownTimer) clearInterval(cooldownTimer);
  cooldownRemaining = Math.max(0, Math.floor(seconds));
  if (cooldownRemaining <= 0) {
    cooldownTimer = null;
    return;
  }
  cooldownTimer = setInterval(() => {
    cooldownRemaining -= 1;
    if (cooldownRemaining <= 0 && cooldownTimer) {
      clearInterval(cooldownTimer);
      cooldownTimer = null;
    }
  }, 1000);
}

// Sync the local ticker with the backend whenever resend-status refetches.
$effect(() => {
  const data = $resendStatus.data;
  if (!data || !('secondsUntilResendAllowed' in data)) return;
  startCooldown(data.secondsUntilResendAllowed);
});

onMount(() => {
  if (tokenFromUrl) {
    autoVerifying = true;
    $verifyEmail.mutate({ data: { token: tokenFromUrl } });
  }
  return () => {
    if (cooldownTimer) clearInterval(cooldownTimer);
  };
});

$effect(() => {
  if (!browser || session.isLoading) return;
  if (authenticated === false) {
    goto('/identity/sign-in');
    return;
  }
  if (authenticated === true && !needsEmailVerification) {
    goto('/onboarding');
  }
});

// Guard against double-submission: the OtpInput's `oncomplete` can race with
// an implicit form submit (Enter) or a click, firing the mutation twice with
// the same code. The second call lands after the token was already consumed
// server-side and comes back as "Invalid or expired", clobbering the first
// success and keeping the user stuck on this screen.
function submitToken(code: string) {
  if ($verifyEmail.isPending || $verifyEmail.isSuccess) return;
  verifyError = '';
  $verifyEmail.mutate({ data: { token: code } });
}

function handleCompleted(code: string) {
  submitToken(code);
}

function handleSubmit(e: Event) {
  e.preventDefault();
  if (verificationCode.length !== CODE_LENGTH) {
    verifyError = t?.('identity.verifyEmail.errorIncomplete') ?? 'Enter all 6 digits.';
    return;
  }
  submitToken(verificationCode);
}

function handleResend() {
  if (cooldownRemaining > 0) return;
  resentFlash = false;
  verifyError = '';
  verificationCode = '';
  $sendVerification.mutate(undefined, {
    onSuccess(response) {
      resentFlash = true;
      setTimeout(() => (resentFlash = false), 4000);
      if (response && 'cooldown' in response) {
        startCooldown(response.cooldown.secondsUntilResendAllowed);
      }
      queryClient.invalidateQueries({
        queryKey: postV1AuthEmailVerificationSendMutationKey(),
      });
    },
  });
}
</script>

<svelte:head>
	<title>{t?.('identity.verifyEmail.pageTitle') ?? 'Verify email'}</title>
</svelte:head>

{#if t}
	<main class="flex min-h-screen items-center justify-center p-4 pt-20 sm:p-6 bg-gray-50 dark:bg-neutral-950">
		<div class="w-full max-w-[440px]">
			<div class="rounded-2xl border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 shadow-sm p-6 sm:p-8">
				{#if autoVerifying || $verifyEmail.isPending}
					<div class="py-10 text-center" role="status" aria-live="polite">
						<Loader size={28} class="mx-auto mb-4" />
						<p class="text-sm text-gray-500 dark:text-neutral-400">
							{t('identity.verifyEmail.verifying')}
						</p>
					</div>
				{:else if $verifyEmail.isSuccess}
					<div class="py-10 text-center" role="status" aria-live="polite">
						<CheckCircle2 size={36} class="mx-auto mb-4 text-emerald-500" />
						<h1 class="text-lg font-semibold text-gray-800 dark:text-neutral-100">
							{t('identity.verifyEmail.success')}
						</h1>
					</div>
				{:else}
					<div class="mb-6 flex flex-col items-center text-center">
						<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
							<Mail size={26} />
						</div>
						<h1 class="text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-100">
							{t('identity.verifyEmail.title')}
						</h1>
						<p class="mt-2 text-sm text-gray-500 dark:text-neutral-400">
							{t('identity.verifyEmail.subtitleNoEmail')}
						</p>
						{#if email}
							<div class="mt-3">
								<Badge intent="neutral" size="md">{email}</Badge>
							</div>
						{/if}
					</div>

					<form onsubmit={handleSubmit} class="space-y-5">
						<OtpInput
							bind:value={verificationCode}
							length={CODE_LENGTH}
							error={Boolean(verifyError)}
							disabled={$verifyEmail.isPending}
							autofocus
							oncomplete={handleCompleted}
							groupAriaLabel={t('ui.otpInput.verificationCodeAria')}
							digitAriaLabel={(i) => t('ui.otpInput.digitAria', { index: i })}
						/>

						{#if verifyError}
							<p role="alert" class="text-center text-xs font-medium text-red-500/80">{verifyError}</p>
						{/if}

						<Button type="submit" disabled={$verifyEmail.isPending || verificationCode.length !== CODE_LENGTH} variant="solid">
							{t('identity.verifyEmail.submit')}
						</Button>

						<div class="text-center space-y-1.5">
							<p class="text-xs text-gray-500 dark:text-neutral-500">
								{t('identity.verifyEmail.noEmailHelp')}
							</p>
							{#if cooldownRemaining > 0}
								<p class="text-xs text-gray-500 dark:text-neutral-500">
									{t('identity.verifyEmail.resendCooldown').replace('{seconds}', String(cooldownRemaining))}
								</p>
							{:else}
								<button
									type="button"
									onclick={handleResend}
									disabled={$sendVerification.isPending}
									class="text-xs font-bold text-gray-800 dark:text-neutral-200 hover:underline disabled:opacity-50"
								>
									{#if $sendVerification.isPending}
										{t('identity.verifyEmail.resending')}
									{:else}
										{t('identity.verifyEmail.resend')}
									{/if}
								</button>
							{/if}
							{#if resentFlash}
								<p class="text-xs text-emerald-600 dark:text-emerald-400">
									{t('identity.verifyEmail.resentOk')}
								</p>
							{/if}
						</div>
					</form>
				{/if}
			</div>
		</div>
	</main>
{/if}
