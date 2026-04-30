/**
 * Svelte action: traps focus inside a dialog/modal and returns focus to the
 * originally-focused element on teardown.
 *
 * Usage:
 *   <div use:focusTrap={{ active: open }}> ... </div>
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
].join(',');

export interface FocusTrapOptions {
  active?: boolean;
  returnFocus?: boolean;
}

export function focusTrap(node: HTMLElement, options: FocusTrapOptions = {}) {
  let previouslyFocused: Element | null = null;
  let cleanup: (() => void) | null = null;

  function activate() {
    previouslyFocused = document.activeElement;
    const focusables = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => !el.hasAttribute('inert') && el.offsetParent !== null,
    );

    focusables[0]?.focus({ preventScroll: true });

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab' || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    node.addEventListener('keydown', onKeyDown);
    cleanup = () => {
      node.removeEventListener('keydown', onKeyDown);
      if (options.returnFocus !== false && previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }

  if (options.active !== false) activate();

  return {
    update(next: FocusTrapOptions) {
      options = next;
      if (next.active === false) {
        cleanup?.();
        cleanup = null;
      } else if (!cleanup) {
        activate();
      }
    },
    destroy() {
      cleanup?.();
      cleanup = null;
    },
  };
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
