import { j as head, e as attr_class, f as stringify, k as store_get, u as unsubscribe_stores, h as derived } from "../../chunks/renderer.js";
import { p as page } from "../../chunks/stores.js";
import { c as colorSchema } from "../../chunks/color-schema.svelte.js";
import { e as escape_html } from "../../chunks/escaping.js";
function _error($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    const cs = derived(() => colorSchema.mode);
    const text = derived(() => cs() === "dark" ? "text-neutral-200" : "text-gray-800");
    const muted = derived(() => cs() === "dark" ? "text-neutral-500" : "text-gray-500");
    head("1j96wlh", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(store_get($$store_subs ??= {}, "$page", page).status)} — Page not found</title>`);
      });
    });
    $$renderer2.push(`<div class="flex flex-col items-center justify-center gap-3" style="min-height: calc(100vh - 3.5rem); padding-top: 3.5rem;"><span${attr_class(`text-6xl font-bold ${stringify(text())}`)}>${escape_html(store_get($$store_subs ??= {}, "$page", page).status)}</span> <span${attr_class(`text-[11px] uppercase tracking-widest ${stringify(muted())}`)}>${escape_html(store_get($$store_subs ??= {}, "$page", page).status === 404 ? "page not found" : store_get($$store_subs ??= {}, "$page", page).error?.message ?? "something went wrong")}</span> <a href="/"${attr_class(`mt-4 text-[11px] uppercase tracking-widest ${stringify(muted())} underline hover:opacity-70`)}>go home</a></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _error as default
};
