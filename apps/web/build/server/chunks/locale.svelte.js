const LOCALES = ["pt-BR", "en"];
const DEFAULT_LOCALE = LOCALES[0];
function resolve(dictionary, key) {
  const segments = key.split(".");
  let current2 = dictionary;
  for (const segment of segments) {
    if (typeof current2 !== "object" || current2 === null) return void 0;
    current2 = current2[segment];
  }
  return typeof current2 === "string" ? current2 : void 0;
}
function interpolate(template, params) {
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (_, name) => params[name] !== void 0 ? String(params[name]) : `{{${name}}}`
  );
}
function createTranslator(dictionary) {
  return (key, params) => {
    const value = resolve(dictionary, key);
    if (value === void 0) return key;
    return params ? interpolate(value, params) : value;
  };
}
const cache = /* @__PURE__ */ new Map();
const loaders = {
  en: () => import("./en.js"),
  "pt-BR": () => import("./pt-BR.js")
};
async function loadDictionary(locale2) {
  const cached = cache.get(locale2);
  if (cached) return cached;
  const dictionary = await loaders[locale2]();
  cache.set(locale2, dictionary);
  return dictionary;
}
let current = DEFAULT_LOCALE;
let translator = null;
const LOCALE_LABELS = { "pt-BR": "Português", en: "English" };
const locale = {
  get current() {
    return current;
  },
  get t() {
    return translator;
  },
  get labels() {
    return LOCALE_LABELS;
  },
  get locales() {
    return LOCALES;
  },
  async set(value) {
    current = value;
    const dict = await loadDictionary(value);
    translator = createTranslator(dict);
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", value);
      document.documentElement.lang = value;
    }
  },
  async init() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("locale");
      if (saved && LOCALES.includes(saved)) {
        current = saved;
      }
    }
    const dict = await loadDictionary(current);
    translator = createTranslator(dict);
  }
};
export {
  locale as l
};
