import type { Translator } from "@patch-careers/i18n";
import { AUTH_SIGN_IN_ROUTE } from "../../../navigation/authRedirect";

type ToastLike = { show: (options: { title: string; intent: "danger" }) => void };
type RouterLike = { replace: (href: typeof AUTH_SIGN_IN_ROUTE) => void };

/**
 * "Show a danger toast, then bounce to sign-in" — the failure recovery
 * 2fa-verify and oauth-callback were each repeating.
 */
export function failToSignIn(options: {
  toast: ToastLike;
  router: RouterLike;
  t: Translator;
  titleKey: string;
}): void {
  options.toast.show({ title: options.t(options.titleKey), intent: "danger" });
  options.router.replace(AUTH_SIGN_IN_ROUTE);
}
