let mode = "light";
const colorSchema = {
  get mode() {
    return mode;
  },
  toggle() {
    mode = mode === "light" ? "dark" : "light";
    save();
  },
  init() {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("colorSchema");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    mode = saved ?? (prefersDark ? "dark" : "light");
  }
};
function save() {
  localStorage.setItem("colorSchema", mode);
}
export {
  colorSchema as c
};
