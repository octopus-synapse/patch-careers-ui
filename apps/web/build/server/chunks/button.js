import { o as attributes, f as stringify } from "./renderer.js";
function Button($$renderer, $$props) {
  const variantStyles = {
    solid: {
      light: "bg-gray-800 text-gray-50",
      dark: "bg-neutral-200 text-neutral-900"
    }
  };
  let {
    colorSchema = "light",
    variant = "solid",
    children,
    class: className = "",
    $$slots,
    $$events,
    ...rest
  } = $$props;
  $$renderer.push(`<button${attributes({
    class: `w-full rounded-full py-3 text-xs font-bold uppercase tracking-widest transition-transform active:scale-[0.98] disabled:opacity-50 ${stringify(variantStyles[variant][colorSchema])} ${stringify(className)}`,
    ...rest
  })}>`);
  children($$renderer);
  $$renderer.push(`<!----></button>`);
}
export {
  Button as B
};
