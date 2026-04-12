import { j as head, e as attr_class, f as stringify, h as derived } from "../../../chunks/renderer.js";
import { t as isApiError } from "../../../chunks/Icon.js";
import { d as createAuthLogin } from "../../../chunks/auth.js";
import { B as Button } from "../../../chunks/button.js";
import { L as Label, I as Input } from "../../../chunks/label.js";
import { g as goto } from "../../../chunks/client.js";
import { c as colorSchema } from "../../../chunks/color-schema.svelte.js";
import { l as locale } from "../../../chunks/locale.svelte.js";
import { L as Loader_circle } from "../../../chunks/loader-circle.js";
import { e as escape_html } from "../../../chunks/escaping.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let email = "";
    let password = "";
    let error = "";
    const t = derived(() => locale.t);
    const cs = derived(() => colorSchema.mode);
    const muted = derived(() => cs() === "dark" ? "text-neutral-500" : "text-gray-500");
    const text = derived(() => cs() === "dark" ? "text-neutral-200" : "text-gray-800");
    const login = createAuthLogin(() => ({
      mutation: {
        onSuccess() {
          goto();
        },
        onError(err) {
          if (!t()) return;
          if (isApiError(err) && err.statusCode === 401) {
            error = t()("auth.shared.errorInvalidCredentials");
          } else {
            error = t()("auth.shared.errorGeneric");
          }
        }
      }
    }));
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      head("1x05zx6", $$renderer3, ($$renderer4) => {
        $$renderer4.title(($$renderer5) => {
          $$renderer5.push(`<title>${escape_html(t()?.("auth.sign-in.pageTitle") ?? "")}</title>`);
        });
      });
      if (t()) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="selection:bg-black selection:text-white min-h-screen font-sans antialiased transition-colors duration-300"><main class="flex min-h-screen items-center justify-center p-6 pt-20"><div class="w-full max-w-[340px]"><div class="mb-10"><h1${attr_class(`text-xl font-medium tracking-tight ${stringify(text())}`)}>${escape_html(t()("auth.sign-in.title"))}</h1> <p${attr_class(`text-sm ${stringify(muted())}`)}>${escape_html(t()("auth.sign-in.subtitle"))}</p></div> <form class="space-y-6"><div class="space-y-4"><div class="group relative">`);
        Label($$renderer3, {
          for: "email",
          colorSchema: cs(),
          children: ($$renderer4) => {
            $$renderer4.push(`<!---->${escape_html(t()("auth.shared.email"))}`);
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!----> `);
        Input($$renderer3, {
          id: "email",
          type: "email",
          required: true,
          placeholder: t()("auth.shared.emailPlaceholder"),
          colorSchema: cs(),
          get value() {
            return email;
          },
          set value($$value) {
            email = $$value;
            $$settled = false;
          }
        });
        $$renderer3.push(`<!----></div> <div class="group relative">`);
        Label($$renderer3, {
          for: "password",
          colorSchema: cs(),
          children: ($$renderer4) => {
            $$renderer4.push(`<!---->${escape_html(t()("auth.shared.password"))}`);
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!----> `);
        Input($$renderer3, {
          id: "password",
          type: "password",
          required: true,
          placeholder: t()("auth.shared.passwordPlaceholder"),
          colorSchema: cs(),
          get value() {
            return password;
          },
          set value($$value) {
            password = $$value;
            $$settled = false;
          }
        });
        $$renderer3.push(`<!----></div></div> `);
        if (error) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<p class="text-xs font-medium text-red-500/80">${escape_html(error)}</p>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> `);
        Button($$renderer3, {
          type: "submit",
          disabled: login.isPending,
          variant: "solid",
          colorSchema: cs(),
          children: ($$renderer4) => {
            if (login.isPending) {
              $$renderer4.push("<!--[0-->");
              Loader_circle($$renderer4, { size: 14, class: "mx-auto animate-spin" });
            } else {
              $$renderer4.push("<!--[-1-->");
              $$renderer4.push(`${escape_html(t()("auth.sign-in.submit"))}`);
            }
            $$renderer4.push(`<!--]-->`);
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!----></form> <footer class="mt-12 text-center"><p${attr_class(`text-xs ${stringify(muted())}`)}>${escape_html(t()("auth.sign-in.footer"))} <a href="/signup"${attr_class(`ml-1 font-bold ${stringify(text())} hover:underline`)}>${escape_html(t()("auth.sign-in.footerLink"))}</a></p></footer></div></main></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]-->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
export {
  _page as default
};
