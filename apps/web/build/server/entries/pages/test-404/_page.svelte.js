import { e as escape_html } from "../../../chunks/escaping.js";
function _page($$renderer) {
  const now = Date.now();
  $$renderer.push(`<div style="padding: 100px; text-align: center;"><h1 style="font-size: 48px;">Test Page</h1> <p>Rendered at: ${escape_html(now)}</p> <p>This page has zero dependencies.</p></div>`);
}
export {
  _page as default
};
