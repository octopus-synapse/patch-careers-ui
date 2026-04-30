<script lang="ts" module>
  import { type ApiError, isApiError } from 'api-client';
  import { toastState } from 'ui';

  type ToastIntent = 'success' | 'danger' | 'info';

  /**
   * Map a backend error code or 4xx/5xx range to the toast intent. The
   * backend is the source of truth for `severity` (toast/modal/banner/
   * inline/silent); this only resolves *which* tone a `toast` severity
   * should use. Codes/statuses outside the table fall through to `danger`.
   */
  export function intentFromCode(code: string | undefined, statusCode?: number): ToastIntent {
    if (statusCode !== undefined) {
      if (statusCode >= 500) return 'danger';
      if (statusCode >= 400) return 'danger';
      if (statusCode >= 300) return 'info';
      if (statusCode >= 200) return 'success';
    }
    if (!code) return 'danger';
    if (code.startsWith('SUCCESS_') || code === 'OK') return 'success';
    if (code.startsWith('INFO_')) return 'info';
    return 'danger';
  }

  type BannerEvent = {
    id: number;
    message: string;
    severity: 'banner';
    code: string;
    suggestedAction?: ApiError['suggestedAction'];
  };

  type ModalEvent = {
    id: number;
    message: string;
    severity: 'modal';
    code: string;
    statusCode: number;
    suggestedAction?: ApiError['suggestedAction'];
  };

  /**
   * Lightweight pub/sub for banner/modal errors. Components that want to
   * render a global banner or modal subscribe to these stores; the rest of
   * the app just calls `handleApiError(err)` and forgets about it.
   */
  let lastBanner = $state<BannerEvent | null>(null);
  let lastModal = $state<ModalEvent | null>(null);
  let nextId = 0;

  export const errorBannerStream = {
    get current() {
      return lastBanner;
    },
    dismiss() {
      lastBanner = null;
    },
  };

  export const errorModalStream = {
    get current() {
      return lastModal;
    },
    dismiss() {
      lastModal = null;
    },
  };

  /**
   * Single entry point for error dispatch. Reads `severity` off the
   * `ApiError` and routes to the correct surface. Non-`ApiError` values
   * fall through to a generic toast so callers don't need a prior shape
   * check.
   */
  export function handleApiError(err: unknown): void {
    if (!isApiError(err)) {
      toastState.show(err instanceof Error ? err.message : String(err), 'danger');
      return;
    }
    switch (err.severity) {
      case 'silent':
        return;
      case 'toast':
        toastState.show(err.message, intentFromCode(err.code, err.statusCode), {
          action: err.suggestedAction?.label
            ? {
                label: err.suggestedAction.label,
                onClick: () => {
                  if (err.suggestedAction?.href) {
                    if (typeof window !== 'undefined') {
                      window.location.assign(err.suggestedAction.href);
                    }
                  }
                },
              }
            : undefined,
        });
        return;
      case 'banner':
        lastBanner = {
          id: nextId++,
          message: err.message,
          severity: 'banner',
          code: err.code,
          suggestedAction: err.suggestedAction,
        };
        return;
      case 'modal':
        lastModal = {
          id: nextId++,
          message: err.message,
          severity: 'modal',
          code: err.code,
          statusCode: err.statusCode,
          suggestedAction: err.suggestedAction,
        };
        return;
      case 'inline':
        // `inline` is the caller's responsibility — they receive the
        // error in their form/page state and render it next to the
        // offending field. Passing through to a toast as a courtesy
        // ensures errors aren't lost when a caller forgets to handle
        // the inline case.
        toastState.show(err.message, intentFromCode(err.code, err.statusCode));
        return;
      default:
        toastState.show(err.message, intentFromCode(err.code, err.statusCode));
    }
  }
</script>

<script lang="ts">
  /**
   * Renders the current banner/modal error if any. Mount once near the
   * root layout so all `handleApiError(err)` calls have a surface to draw
   * on. Toasts are drawn by the existing `<ToastContainer>`; we only need
   * to handle banner + modal here.
   */
  type Props = {
    /** Optional override for an inline `err` prop (used by form callers). */
    err?: ApiError;
  };

  let { err }: Props = $props();

  $effect(() => {
    if (err) handleApiError(err);
  });

  const banner = $derived(errorBannerStream.current);
  const modal = $derived(errorModalStream.current);
</script>

{#if banner}
  <div
    role="alert"
    class="fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
  >
    <p class="flex-1 truncate">{banner.message}</p>
    <div class="flex items-center gap-2">
      {#if banner.suggestedAction?.href && banner.suggestedAction?.label}
        <a
          href={banner.suggestedAction.href}
          class="text-xs font-semibold underline"
        >
          {banner.suggestedAction.label}
        </a>
      {/if}
      <button
        type="button"
        class="text-xs font-semibold underline"
        onclick={() => errorBannerStream.dismiss()}
      >
        Fechar
      </button>
    </div>
  </div>
{/if}

{#if modal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    onclick={() => errorModalStream.dismiss()}
  >
    <div
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      class="max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900"
      onclick={(e) => e.stopPropagation()}
    >
      <h2 class="text-base font-semibold text-gray-900 dark:text-neutral-100">
        Algo deu errado
      </h2>
      <p class="mt-2 text-sm text-gray-600 dark:text-neutral-400">{modal.message}</p>
      <p class="mt-1 font-mono text-xs text-gray-400 dark:text-neutral-600">
        {modal.code} · {modal.statusCode}
      </p>
      <div class="mt-4 flex items-center justify-end gap-2">
        {#if modal.suggestedAction?.href && modal.suggestedAction?.label}
          <a
            href={modal.suggestedAction.href}
            class="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {modal.suggestedAction.label}
          </a>
        {/if}
        <button
          type="button"
          class="rounded-md bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700"
          onclick={() => errorModalStream.dismiss()}
        >
          OK
        </button>
      </div>
    </div>
  </div>
{/if}
