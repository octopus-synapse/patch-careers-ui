import { j as head, e as attr_class, f as stringify, h as derived } from "../../../chunks/renderer.js";
import { c as colorSchema } from "../../../chunks/color-schema.svelte.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const cs = derived(() => colorSchema.mode);
    const text = derived(() => cs() === "dark" ? "text-neutral-200" : "text-gray-800");
    const muted = derived(() => cs() === "dark" ? "text-neutral-500" : "text-gray-500");
    head("1524c3l", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>404 — Page not found</title>`);
      });
    });
    $$renderer2.push(`<div class="flex flex-col items-center justify-center gap-3" style="min-height: calc(100vh - 3.5rem); padding-top: 3.5rem;"><span${attr_class(`text-6xl font-bold ${stringify(text())}`)}>404</span> <span${attr_class(`text-[11px] uppercase tracking-widest ${stringify(muted())}`)}>page not found</span> <a href="/"${attr_class(`mt-4 text-[11px] uppercase tracking-widest ${stringify(muted())} underline hover:opacity-70`)}>go home</a></div>`);
  });
}
export {
  _page as default
};
