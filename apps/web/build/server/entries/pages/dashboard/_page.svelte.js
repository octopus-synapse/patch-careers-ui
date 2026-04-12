import { j as head, f as stringify, e as attr_class, h as derived } from "../../../chunks/renderer.js";
import { a as createAuthSession, b as createAuthLogout, g as getAuthSessionQueryKey } from "../../../chunks/auth.js";
import { B as Button } from "../../../chunks/button.js";
import { g as goto } from "../../../chunks/client.js";
import { c as colorSchema } from "../../../chunks/color-schema.svelte.js";
import { l as locale } from "../../../chunks/locale.svelte.js";
import { u as useQueryClient } from "../../../chunks/Icon.js";
import { L as Loader_circle } from "../../../chunks/loader-circle.js";
import { L as Log_out } from "../../../chunks/log-out.js";
import { e as escape_html } from "../../../chunks/escaping.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const t = derived(() => locale.t);
    const cs = derived(() => colorSchema.mode);
    const muted = derived(() => cs() === "dark" ? "text-neutral-500" : "text-gray-500");
    const text = derived(() => cs() === "dark" ? "text-neutral-200" : "text-gray-800");
    const cardBg = derived(() => cs() === "dark" ? "bg-neutral-800/50" : "bg-white");
    const cardBorder = derived(() => cs() === "dark" ? "border-neutral-700/50" : "border-gray-200");
    const session = createAuthSession(() => ({ query: { retry: false } }));
    const queryClient = useQueryClient();
    const user = derived(() => session.data?.data?.data?.user);
    const authenticated = derived(() => session.data?.data?.data?.authenticated);
    const logout = createAuthLogout(() => ({
      mutation: {
        onSuccess() {
          queryClient.invalidateQueries({ queryKey: getAuthSessionQueryKey() });
          goto();
        }
      }
    }));
    function handleLogout() {
      logout.mutate({ data: {} });
    }
    head("x1i5gj", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(t()?.("dashboard.pageTitle") ?? "")}</title>`);
      });
    });
    if (session.isLoading) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="flex min-h-screen items-center justify-center pt-14">`);
      Loader_circle($$renderer2, { size: 24, class: `animate-spin ${stringify(muted())}` });
      $$renderer2.push(`<!----></div>`);
    } else if (t() && authenticated() && user()) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<div class="min-h-screen font-sans antialiased transition-colors duration-300"><main class="mx-auto max-w-2xl px-6 pt-24 pb-12"><h1${attr_class(`text-xl font-medium tracking-tight ${stringify(text())}`)}>${escape_html(t()("dashboard.welcome", { name: user().name ?? user().email }))}</h1> <div${attr_class(`mt-8 rounded-xl border p-6 ${stringify(cardBg())} ${stringify(cardBorder())}`)}><dl class="space-y-4"><div><dt${attr_class(`text-[10px] font-bold uppercase tracking-widest ${stringify(muted())}`)}>Email</dt> <dd${attr_class(`mt-1 text-sm ${stringify(text())}`)}>${escape_html(user().email)}</dd></div> `);
      if (user().name) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div><dt${attr_class(`text-[10px] font-bold uppercase tracking-widest ${stringify(muted())}`)}>Name</dt> <dd${attr_class(`mt-1 text-sm ${stringify(text())}`)}>${escape_html(user().name)}</dd></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div><dt${attr_class(`text-[10px] font-bold uppercase tracking-widest ${stringify(muted())}`)}>Role</dt> <dd${attr_class(`mt-1 text-sm ${stringify(text())}`)}>${escape_html(user().role)}</dd></div></dl></div> <div class="mt-8 max-w-[200px]">`);
      Button($$renderer2, {
        onclick: handleLogout,
        disabled: logout.isPending,
        variant: "solid",
        colorSchema: cs(),
        children: ($$renderer3) => {
          if (logout.isPending) {
            $$renderer3.push("<!--[0-->");
            Loader_circle($$renderer3, { size: 14, class: "mx-auto animate-spin" });
          } else {
            $$renderer3.push("<!--[-1-->");
            $$renderer3.push(`<span class="flex items-center justify-center gap-2">`);
            Log_out($$renderer3, { size: 14 });
            $$renderer3.push(`<!----> ${escape_html(t()("dashboard.logout"))}</span>`);
          }
          $$renderer3.push(`<!--]-->`);
        },
        $$slots: { default: true }
      });
      $$renderer2.push(`<!----></div></main></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
