import { m as attributes, n as bind_props, e as stringify } from "./renderer.js";
function Input($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const styles = {
      light: "border-gray-300 text-gray-900 placeholder:text-gray-500/50 focus:border-gray-900",
      dark: "border-neutral-700 text-neutral-200 placeholder:text-neutral-500/50 focus:border-neutral-200"
    };
    let {
      colorSchema = "light",
      value = "",
      class: className = "",
      $$slots,
      $$events,
      ...rest
    } = $$props;
    $$renderer2.push(`<input${attributes(
      {
        value,
        class: `w-full rounded-none border-b bg-transparent py-2 text-sm outline-none transition-all ${stringify(styles[colorSchema])} ${stringify(className)}`,
        ...rest
      },
      void 0,
      void 0,
      void 0,
      4
    )}/>`);
    bind_props($$props, { value });
  });
}
function Label($$renderer, $$props) {
  const styles = { light: "text-gray-500", dark: "text-neutral-500" };
  let {
    colorSchema = "light",
    children,
    class: className = "",
    $$slots,
    $$events,
    ...rest
  } = $$props;
  $$renderer.push(`<label${attributes({
    class: `text-[10px] font-bold uppercase tracking-widest ${stringify(styles[colorSchema])} ${stringify(className)}`,
    ...rest
  })}>`);
  children($$renderer);
  $$renderer.push(`<!----></label>`);
}
export {
  Input as I,
  Label as L
};
