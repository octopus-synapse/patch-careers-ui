<script lang="ts">
import { createDeleteV1Accounts } from 'api-client';
import { Download, Trash2 } from 'lucide-svelte';
import { Input, Label, Loader } from 'ui';
import { goto } from '$app/navigation';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

let deleteConfirmation = $state('');
let showDeleteModal = $state(false);
let isExporting = $state(false);

const deleteAccount = createDeleteV1Accounts({
  mutation: {
    onSuccess() {
      goto('/identity/sign-in');
    },
  },
});

async function handleExportData() {
  isExporting = true;
  try {
    const { getV1MeGdprExport } = await import('api-client');
    const response = await getV1MeGdprExport();
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
    $deleteAccount.mutate({ data: { confirmationPhrase: deleteConfirmation } });
  }
}
</script>

<svelte:head>
	<title>{t('settings.dangerZone')} · {t('settings.pageTitle')}</title>
</svelte:head>

<div class="mx-auto max-w-lg">
	<div class="mb-4">
		<span class="text-xs font-medium text-gray-500 dark:text-neutral-500">
			{t('settings.pageTitle')}
		</span>
		<h3 class="text-sm font-bold text-gray-800 dark:text-neutral-200">
			{t('settings.dangerZone')}
		</h3>
	</div>

	<section
		class="overflow-hidden rounded-xl border border-red-500/30 bg-white dark:bg-neutral-800/50"
	>
		<div class="border-b border-red-500/30 px-5 py-4">
			<h2 class="text-xs font-medium text-red-500">
				{t('settings.dangerZone')}
			</h2>
		</div>
		<div class="space-y-4 p-5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-800 dark:text-neutral-200">
						{t('settings.exportData')}
					</p>
					<p class="text-[11px] text-gray-500 dark:text-neutral-500">
						{t('settings.exportDataDescription')}
					</p>
				</div>
				<button
					onclick={handleExportData}
					disabled={isExporting}
					class="flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-[11px] font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
				>
					{#if isExporting}
						<Loader size={13} />
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
					<p class="text-[11px] text-gray-500 dark:text-neutral-500">
						{t('settings.deleteAccountDescription')}
					</p>
				</div>
				<button
					onclick={() => (showDeleteModal = true)}
					class="flex items-center gap-2 rounded-full border border-red-500/30 px-4 py-2 text-[11px] font-semibold text-red-500 transition-all hover:bg-red-500/10"
				>
					<Trash2 size={13} />
					{t('settings.deleteButton')}
				</button>
			</div>
		</div>
	</section>
</div>

{#if showDeleteModal}
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
	>
		<div
			class="w-full max-w-md space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-800/50"
		>
			<h3 class="text-lg font-semibold text-red-500">{t('settings.deleteAccount')}</h3>
			<p class="text-sm text-gray-500 dark:text-neutral-500">
				{t('settings.deleteAccountWarning')}
			</p>
			<div>
				<Label for="delete-confirm">
					{t('settings.typeToConfirm')}
				</Label>
				<Input
					id="delete-confirm"
					type="text"
					bind:value={deleteConfirmation}
					placeholder={t('myProfile.deleteAccount.confirmPhrasePlaceholder')}
					class="mt-1 font-mono"
				/>
			</div>
			<div class="flex justify-end gap-2 pt-2">
				<button
					onclick={() => {
						showDeleteModal = false;
						deleteConfirmation = '';
					}}
					class="rounded-full border border-gray-300 px-5 py-2 text-[11px] font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
				>
					{t('common.cancel')}
				</button>
				<button
					onclick={handleDeleteAccount}
					disabled={deleteConfirmation !== 'DELETE MY ACCOUNT' || $deleteAccount.isPending}
					class="flex items-center gap-2 rounded-full bg-red-500 px-5 py-2 text-[11px] font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
				>
					{#if $deleteAccount.isPending}
						<Loader size={13} />
					{/if}
					{t('settings.deleteButton')}
				</button>
			</div>
		</div>
	</div>
{/if}
