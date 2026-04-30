import type { IntentKey } from '../../shared';

type ToastIntent = Extract<IntentKey, 'success' | 'danger' | 'info'>;

export type ToastAction = { label: string; onClick: () => void };

export type ToastItem = {
  id: number;
  message: string;
  intent: ToastIntent;
  action?: ToastAction;
  /** ms before auto-dismiss. 0 disables auto-dismiss. */
  duration: number;
};

let toasts = $state<ToastItem[]>([]);
let nextId = 0;

export const toastState = {
  get items() {
    return toasts;
  },
  show(
    message: string,
    intent: ToastIntent = 'info',
    options?: { action?: ToastAction; duration?: number },
  ): number {
    const id = nextId++;
    toasts = [
      ...toasts,
      {
        id,
        message,
        intent,
        action: options?.action,
        duration: options?.duration ?? 3000,
      },
    ];
    return id;
  },
  remove(id: number) {
    toasts = toasts.filter((t) => t.id !== id);
  },
};
