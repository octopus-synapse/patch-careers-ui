import { k as head, f as escape_html, g as derived } from "../../chunks/renderer.js";
import { l as locale } from "../../chunks/locale.svelte.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const t = derived(() => locale.t);
    head("1uha8ag", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Patch Careers</title>`);
      });
    });
    $$renderer2.push(`<main class="flex min-h-screen items-center justify-center">`);
    if (t()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<h1 class="text-4xl font-bold">${escape_html(t()("auth.greeting", { name: "Patch Careers" }))}</h1>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></main>`);
  });
}
export {
  _page as default
};
