import { b as sanitize_props, c as spread_props, d as slot, e as attr_class, f as stringify, l as attr_style, i as ensure_array_like, h as derived, g as attr, j as head } from "../../../chunks/renderer.js";
import { c as createQuery, a as createAuthSession, g as getAuthSessionQueryKey } from "../../../chunks/auth.js";
import { l as createMutation, q as customFetch, I as Icon, u as useQueryClient } from "../../../chunks/Icon.js";
import { B as Button } from "../../../chunks/button.js";
import { g as goto } from "../../../chunks/client.js";
import { c as colorSchema } from "../../../chunks/color-schema.svelte.js";
import { l as locale } from "../../../chunks/locale.svelte.js";
import { e as escape_html } from "../../../chunks/escaping.js";
import { L as Label, I as Input } from "../../../chunks/label.js";
import { L as Loader_circle } from "../../../chunks/loader-circle.js";
const getOnboardingGetSessionUrl = (params) => {
  const normalizedParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== void 0) {
      normalizedParams.append(key, value === null ? "null" : value.toString());
    }
  });
  const stringifiedParams = normalizedParams.toString();
  return stringifiedParams.length > 0 ? `/api/v1/onboarding/session?${stringifiedParams}` : `/api/v1/onboarding/session`;
};
const onboardingGetSession = async (params, options) => {
  return customFetch(
    getOnboardingGetSessionUrl(params),
    {
      ...options,
      method: "GET"
    }
  );
};
const getOnboardingGetSessionQueryKey = (params) => {
  return [
    `/api/v1/onboarding/session`,
    ...params ? [params] : []
  ];
};
const getOnboardingGetSessionQueryOptions = (params, options) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getOnboardingGetSessionQueryKey(params);
  const queryFn = ({ signal }) => onboardingGetSession(params, { signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions };
};
function createOnboardingGetSession(params, options, queryClient) {
  const query = createQuery(() => getOnboardingGetSessionQueryOptions(params?.(), options?.()));
  return query;
}
const getOnboardingNextStepUrl = (params) => {
  const normalizedParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== void 0) {
      normalizedParams.append(key, value === null ? "null" : value.toString());
    }
  });
  const stringifiedParams = normalizedParams.toString();
  return stringifiedParams.length > 0 ? `/api/v1/onboarding/session/next?${stringifiedParams}` : `/api/v1/onboarding/session/next`;
};
const onboardingNextStep = async (onboardingNextStepBody, params, options) => {
  return customFetch(
    getOnboardingNextStepUrl(params),
    {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: JSON.stringify(
        onboardingNextStepBody
      )
    }
  );
};
const getOnboardingNextStepMutationOptions = (options) => {
  const mutationKey = ["onboardingNextStep"];
  const { mutation: mutationOptions, request: requestOptions } = options ? options.mutation && "mutationKey" in options.mutation && options.mutation.mutationKey ? options : { ...options, mutation: { ...options.mutation, mutationKey } } : { mutation: { mutationKey }, request: void 0 };
  const mutationFn = (props) => {
    const { data, params } = props ?? {};
    return onboardingNextStep(data, params, requestOptions);
  };
  return { mutationFn, ...mutationOptions };
};
const createOnboardingNextStep = (options, queryClient) => {
  return createMutation(() => ({ ...getOnboardingNextStepMutationOptions(options?.()) }));
};
const getOnboardingPreviousStepUrl = (params) => {
  const normalizedParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== void 0) {
      normalizedParams.append(key, value === null ? "null" : value.toString());
    }
  });
  const stringifiedParams = normalizedParams.toString();
  return stringifiedParams.length > 0 ? `/api/v1/onboarding/session/previous?${stringifiedParams}` : `/api/v1/onboarding/session/previous`;
};
const onboardingPreviousStep = async (params, options) => {
  return customFetch(
    getOnboardingPreviousStepUrl(params),
    {
      ...options,
      method: "POST"
    }
  );
};
const getOnboardingPreviousStepMutationOptions = (options) => {
  const mutationKey = ["onboardingPreviousStep"];
  const { mutation: mutationOptions, request: requestOptions } = options ? options.mutation && "mutationKey" in options.mutation && options.mutation.mutationKey ? options : { ...options, mutation: { ...options.mutation, mutationKey } } : { mutation: { mutationKey }, request: void 0 };
  const mutationFn = (props) => {
    const { params } = props ?? {};
    return onboardingPreviousStep(params, requestOptions);
  };
  return { mutationFn, ...mutationOptions };
};
const createOnboardingPreviousStep = (options, queryClient) => {
  return createMutation(() => ({ ...getOnboardingPreviousStepMutationOptions(options?.()) }));
};
const getOnboardingGotoStepUrl = (params) => {
  const normalizedParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== void 0) {
      normalizedParams.append(key, value === null ? "null" : value.toString());
    }
  });
  const stringifiedParams = normalizedParams.toString();
  return stringifiedParams.length > 0 ? `/api/v1/onboarding/session/goto?${stringifiedParams}` : `/api/v1/onboarding/session/goto`;
};
const onboardingGotoStep = async (gotoStepRequestDto, params, options) => {
  return customFetch(
    getOnboardingGotoStepUrl(params),
    {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: JSON.stringify(
        gotoStepRequestDto
      )
    }
  );
};
const getOnboardingGotoStepMutationOptions = (options) => {
  const mutationKey = ["onboardingGotoStep"];
  const { mutation: mutationOptions, request: requestOptions } = options ? options.mutation && "mutationKey" in options.mutation && options.mutation.mutationKey ? options : { ...options, mutation: { ...options.mutation, mutationKey } } : { mutation: { mutationKey }, request: void 0 };
  const mutationFn = (props) => {
    const { data, params } = props ?? {};
    return onboardingGotoStep(data, params, requestOptions);
  };
  return { mutationFn, ...mutationOptions };
};
const createOnboardingGotoStep = (options, queryClient) => {
  return createMutation(() => ({ ...getOnboardingGotoStepMutationOptions(options?.()) }));
};
const getOnboardingSaveStepDataUrl = (params) => {
  const normalizedParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== void 0) {
      normalizedParams.append(key, value === null ? "null" : value.toString());
    }
  });
  const stringifiedParams = normalizedParams.toString();
  return stringifiedParams.length > 0 ? `/api/v1/onboarding/session/save?${stringifiedParams}` : `/api/v1/onboarding/session/save`;
};
const onboardingSaveStepData = async (onboardingSaveStepDataBody, params, options) => {
  return customFetch(
    getOnboardingSaveStepDataUrl(params),
    {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: JSON.stringify(
        onboardingSaveStepDataBody
      )
    }
  );
};
const getOnboardingSaveStepDataMutationOptions = (options) => {
  const mutationKey = ["onboardingSaveStepData"];
  const { mutation: mutationOptions, request: requestOptions } = { mutation: { mutationKey }, request: void 0 };
  const mutationFn = (props) => {
    const { data, params } = props ?? {};
    return onboardingSaveStepData(data, params, requestOptions);
  };
  return { mutationFn, ...mutationOptions };
};
const createOnboardingSaveStepData = (options, queryClient) => {
  return createMutation(() => ({ ...getOnboardingSaveStepDataMutationOptions() }));
};
const getOnboardingCompleteFromSessionUrl = () => {
  return `/api/v1/onboarding/session/complete`;
};
const onboardingCompleteFromSession = async (options) => {
  return customFetch(
    getOnboardingCompleteFromSessionUrl(),
    {
      ...options,
      method: "POST"
    }
  );
};
const getOnboardingCompleteFromSessionMutationOptions = (options) => {
  const mutationKey = ["onboardingCompleteFromSession"];
  const { mutation: mutationOptions, request: requestOptions } = options ? options.mutation && "mutationKey" in options.mutation && options.mutation.mutationKey ? options : { ...options, mutation: { ...options.mutation, mutationKey } } : { mutation: { mutationKey }, request: void 0 };
  const mutationFn = () => {
    return onboardingCompleteFromSession(requestOptions);
  };
  return { mutationFn, ...mutationOptions };
};
const createOnboardingCompleteFromSession = (options, queryClient) => {
  return createMutation(() => ({ ...getOnboardingCompleteFromSessionMutationOptions(options?.()) }));
};
function Arrow_left($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.475.0 - ISC
   *
   * ISC License
   *
   * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   *
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
   * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
   * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
   * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   */
  const iconNode = [
    ["path", { "d": "m12 19-7-7 7-7" }],
    ["path", { "d": "M19 12H5" }]
  ];
  Icon($$renderer, spread_props([
    { name: "arrow-left" },
    $$sanitized_props,
    {
      /**
       * @component @name ArrowLeft
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTIgMTktNy03IDctNyIgLz4KICA8cGF0aCBkPSJNMTkgMTJINSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/arrow-left
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Arrow_right($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.475.0 - ISC
   *
   * ISC License
   *
   * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   *
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
   * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
   * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
   * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   */
  const iconNode = [
    ["path", { "d": "M5 12h14" }],
    ["path", { "d": "m12 5 7 7-7 7" }]
  ];
  Icon($$renderer, spread_props([
    { name: "arrow-right" },
    $$sanitized_props,
    {
      /**
       * @component @name ArrowRight
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNSAxMmgxNCIgLz4KICA8cGF0aCBkPSJtMTIgNSA3IDctNyA3IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/arrow-right
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Check($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.475.0 - ISC
   *
   * ISC License
   *
   * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   *
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
   * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
   * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
   * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   */
  const iconNode = [["path", { "d": "M20 6 9 17l-5-5" }]];
  Icon($$renderer, spread_props([
    { name: "check" },
    $$sanitized_props,
    {
      /**
       * @component @name Check
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjAgNiA5IDE3bC01LTUiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/check
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Minus($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.475.0 - ISC
   *
   * ISC License
   *
   * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   *
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
   * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
   * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
   * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   */
  const iconNode = [["path", { "d": "M5 12h14" }]];
  Icon($$renderer, spread_props([
    { name: "minus" },
    $$sanitized_props,
    {
      /**
       * @component @name Minus
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNSAxMmgxNCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/minus
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Plus($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.475.0 - ISC
   *
   * ISC License
   *
   * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   *
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
   * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
   * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
   * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   */
  const iconNode = [["path", { "d": "M5 12h14" }], ["path", { "d": "M12 5v14" }]];
  Icon($$renderer, spread_props([
    { name: "plus" },
    $$sanitized_props,
    {
      /**
       * @component @name Plus
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNSAxMmgxNCIgLz4KICA8cGF0aCBkPSJNMTIgNXYxNCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/plus
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Shield($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.475.0 - ISC
   *
   * ISC License
   *
   * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   *
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
   * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
   * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
   * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   */
  const iconNode = [
    [
      "path",
      {
        "d": "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "shield" },
    $$sanitized_props,
    {
      /**
       * @component @name Shield
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjAgMTNjMCA1LTMuNSA3LjUtNy42NiA4Ljk1YTEgMSAwIDAgMS0uNjctLjAxQzcuNSAyMC41IDQgMTggNCAxM1Y2YTEgMSAwIDAgMSAxLTFjMiAwIDQuNS0xLjIgNi4yNC0yLjcyYTEuMTcgMS4xNyAwIDAgMSAxLjUyIDBDMTQuNTEgMy44MSAxNyA1IDE5IDVhMSAxIDAgMCAxIDEgMXoiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/shield
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Trash_2($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.475.0 - ISC
   *
   * ISC License
   *
   * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   *
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
   * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
   * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
   * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   */
  const iconNode = [
    ["path", { "d": "M3 6h18" }],
    ["path", { "d": "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }],
    ["path", { "d": "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }],
    ["line", { "x1": "10", "x2": "10", "y1": "11", "y2": "17" }],
    ["line", { "x1": "14", "x2": "14", "y1": "11", "y2": "17" }]
  ];
  Icon($$renderer, spread_props([
    { name: "trash-2" },
    $$sanitized_props,
    {
      /**
       * @component @name Trash2
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMyA2aDE4IiAvPgogIDxwYXRoIGQ9Ik0xOSA2djE0YzAgMS0xIDItMiAySDdjLTEgMC0yLTEtMi0yVjYiIC8+CiAgPHBhdGggZD0iTTggNlY0YzAtMSAxLTIgMi0yaDRjMSAwIDIgMSAyIDJ2MiIgLz4KICA8bGluZSB4MT0iMTAiIHgyPSIxMCIgeTE9IjExIiB5Mj0iMTciIC8+CiAgPGxpbmUgeDE9IjE0IiB4Mj0iMTQiIHkxPSIxMSIgeTI9IjE3IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/trash-2
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Modal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function Sidebar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      steps,
      currentStep,
      completedSteps,
      progress,
      strength,
      missingRequired = [],
      colorSchema: colorSchema2 = "light"
    } = $$props;
    const text = derived(() => colorSchema2 === "dark" ? "text-neutral-200" : "text-gray-800");
    const muted = derived(() => colorSchema2 === "dark" ? "text-neutral-500" : "text-gray-500");
    const border = derived(() => colorSchema2 === "dark" ? "border-neutral-700" : "border-gray-300");
    const barBg = derived(() => colorSchema2 === "dark" ? "bg-neutral-700" : "bg-gray-200");
    const checkBg = derived(() => colorSchema2 === "dark" ? "bg-neutral-200 text-neutral-900" : "bg-gray-800 text-white");
    const activeBg = derived(() => colorSchema2 === "dark" ? "bg-neutral-700/50" : "bg-white");
    const strengthScore = derived(() => strength?.score ?? progress);
    const strengthMessage = derived(() => strength?.message ?? "");
    const barColor = derived(() => strengthScore() >= 75 ? "bg-emerald-500" : strengthScore() >= 50 ? "bg-blue-500" : strengthScore() >= 25 ? "bg-blue-400" : colorSchema2 === "dark" ? "bg-neutral-500" : "bg-gray-400");
    function isCompleted(stepId) {
      return completedSteps.includes(stepId);
    }
    function isMissing(stepId) {
      return missingRequired.includes(stepId);
    }
    $$renderer2.push(`<aside${attr_class(`flex w-56 flex-shrink-0 flex-col border-r pr-6 ${stringify(border())}`)}><div class="mb-6"><div${attr_class(`h-1 rounded-full ${stringify(barBg())}`)}><div${attr_class(`h-1 rounded-full transition-all duration-700 ${stringify(barColor())}`)}${attr_style(`width: ${stringify(strengthScore())}%`)}></div></div> `);
    if (strengthMessage()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p${attr_class(`mt-2 text-[10px] font-semibold uppercase tracking-widest transition-all duration-500 ${stringify(muted())}`)}>${escape_html(strengthMessage())}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> <nav class="flex flex-col gap-1"><!--[-->`);
    const each_array = ensure_array_like(steps);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let step = each_array[$$index];
      const completed = isCompleted(step.id);
      const active = step.id === currentStep;
      const missing = isMissing(step.id);
      $$renderer2.push(`<button${attr_class(`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs cursor-pointer transition-colors ${stringify(active ? activeBg() : "")}`)}><div${attr_class(`relative flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${stringify(completed ? checkBg() : active ? text() + " border " + border() : muted() + " border " + border())}`)}>`);
      if (completed) {
        $$renderer2.push("<!--[0-->");
        Check($$renderer2, { size: 11 });
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`${escape_html(steps.indexOf(step) + 1)}`);
      }
      $$renderer2.push(`<!--]--> `);
      if (missing && !completed) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-red-500"></span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> <span${attr_class(active ? "font-semibold " + text() : muted())}>${escape_html(step.label)}</span></button>`);
    }
    $$renderer2.push(`<!--]--></nav></aside>`);
  });
}
function Stepper_mobile($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      progress,
      strength,
      colorSchema: colorSchema2 = "light"
    } = $$props;
    const barBg = derived(() => colorSchema2 === "dark" ? "bg-neutral-700" : "bg-gray-200");
    const muted = derived(() => colorSchema2 === "dark" ? "text-neutral-500" : "text-gray-500");
    const strengthScore = derived(() => strength?.score ?? progress);
    const strengthMessage = derived(() => strength?.message ?? "");
    const barColor = derived(() => strengthScore() >= 75 ? "bg-emerald-500" : strengthScore() >= 50 ? "bg-blue-500" : strengthScore() >= 25 ? "bg-blue-400" : colorSchema2 === "dark" ? "bg-neutral-500" : "bg-gray-400");
    $$renderer2.push(`<div class="mb-6">`);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div${attr_class(`mt-3 h-1 rounded-full ${stringify(barBg())}`)}><div${attr_class(`h-1 rounded-full transition-all duration-700 ${stringify(barColor())}`)}${attr_style(`width: ${stringify(strengthScore())}%`)}></div></div> `);
    if (strengthMessage()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p${attr_class(`mt-1.5 text-center text-[10px] font-semibold uppercase tracking-widest transition-all duration-500 ${stringify(muted())}`)}>${escape_html(strengthMessage())}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function Field_renderer($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { field, value, colorSchema: colorSchema2 = "light", onchange } = $$props;
    const muted = derived(() => colorSchema2 === "dark" ? "text-neutral-500" : "text-gray-400");
    const selectStyles = {
      light: "border-gray-300 text-gray-900 focus:border-gray-900",
      dark: "border-neutral-700 text-neutral-200 focus:border-neutral-200"
    };
    const textareaStyles = {
      light: "border-gray-300 text-gray-900 placeholder:text-gray-500/50 focus:border-gray-900",
      dark: "border-neutral-700 text-neutral-200 placeholder:text-neutral-500/50 focus:border-neutral-200"
    };
    const examples = derived(() => field.examples ?? []);
    let exampleIndex = 0;
    let focused = false;
    const placeholder = derived(() => focused || !examples().length ? "" : examples()[exampleIndex % examples().length]);
    const isSummary = derived(() => field.type === "textarea" || field.widget === "textarea");
    const summaryExamples = derived(() => isSummary() && examples().length ? examples() : []);
    function inputType(fieldType) {
      if (fieldType === "email") return "email";
      if (fieldType === "url") return "url";
      if (fieldType === "number") return "number";
      if (fieldType === "date") return "date";
      return "text";
    }
    $$renderer2.push(`<div>`);
    Label($$renderer2, {
      for: field.key,
      colorSchema: colorSchema2,
      children: ($$renderer3) => {
        $$renderer3.push(`<!---->${escape_html(field.label)}`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----> `);
    if (isSummary()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<textarea${attr("id", field.key)}${attr("placeholder", placeholder())}${attr("required", field.required, true)}${attr("rows", 3)}${attr_class(`w-full resize-none rounded-none border-b bg-transparent py-2 text-sm outline-none transition-all ${stringify(textareaStyles[colorSchema2])}`)}>`);
      const $$body = escape_html(value);
      if ($$body) {
        $$renderer2.push(`${$$body}`);
      }
      $$renderer2.push(`</textarea> `);
      if (summaryExamples().length && !value) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<button type="button"${attr_class(`mt-1 text-[10px] font-semibold uppercase tracking-widest underline transition-opacity hover:opacity-60 ${stringify(muted())}`)}>${escape_html("see example")}</button> `);
        {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    } else if (field.type === "select" || field.options && field.options.length > 0) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.select(
        {
          id: field.key,
          value,
          required: field.required,
          onchange: (e) => onchange(e.currentTarget.value),
          class: `w-full rounded-none border-b bg-transparent py-2 text-sm outline-none transition-all ${stringify(selectStyles[colorSchema2])}`
        },
        ($$renderer3) => {
          $$renderer3.option({ value: "" }, ($$renderer4) => {
            $$renderer4.push(`—`);
          });
          $$renderer3.push(`<!--[-->`);
          const each_array_1 = ensure_array_like(field.options ?? []);
          for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
            let opt = each_array_1[$$index_1];
            $$renderer3.option({ value: opt }, ($$renderer4) => {
              $$renderer4.push(`${escape_html(opt)}`);
            });
          }
          $$renderer3.push(`<!--]-->`);
        }
      );
    } else {
      $$renderer2.push("<!--[-1-->");
      Input($$renderer2, {
        id: field.key,
        type: inputType(field.type),
        value,
        placeholder: placeholder(),
        required: field.required,
        onfocus: () => focused = true,
        onblur: () => focused = false,
        oninput: (e) => onchange(e.currentTarget.value),
        colorSchema: colorSchema2
      });
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function Step_form($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { fields, data, colorSchema: colorSchema2 = "light", onupdate } = $$props;
    function handleFieldChange(key, value) {
      onupdate({ ...data, [key]: value });
    }
    $$renderer2.push(`<div class="space-y-5"><!--[-->`);
    const each_array = ensure_array_like(fields);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let field = each_array[$$index];
      Field_renderer($$renderer2, {
        field,
        value: data[field.key] ?? "",
        colorSchema: colorSchema2,
        onchange: (v) => handleFieldChange(field.key, v)
      });
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function Step_multi_items($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { items, colorSchema: colorSchema2 = "light", t } = $$props;
    const muted = derived(() => colorSchema2 === "dark" ? "text-neutral-500" : "text-gray-500");
    const text = derived(() => colorSchema2 === "dark" ? "text-neutral-200" : "text-gray-800");
    const cardBorder = derived(() => colorSchema2 === "dark" ? "border-neutral-700" : "border-gray-200");
    function itemSummary(item) {
      if (!item.content) return "—";
      const values = Object.values(item.content).filter(Boolean);
      return values.slice(0, 2).join(" · ") || "—";
    }
    $$renderer2.push(`<div>`);
    if (items.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p${attr_class(`text-sm ${stringify(muted())}`)}>${escape_html(t("onboarding.noData"))}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="space-y-2"><!--[-->`);
      const each_array = ensure_array_like(items);
      for (let i = 0, $$length = each_array.length; i < $$length; i++) {
        let item = each_array[i];
        $$renderer2.push(`<div${attr_class(`flex items-center justify-between border-b py-3 ${stringify(cardBorder())}`)}><span${attr_class(`text-sm ${stringify(text())}`)}>${escape_html(itemSummary(item))}</span> <button class="rounded p-1 text-red-500 transition-opacity hover:opacity-60">`);
        Trash_2($$renderer2, { size: 14 });
        $$renderer2.push(`<!----></button></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--> <button${attr_class(`mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-60 ${stringify(muted())}`)}>`);
    Plus($$renderer2, { size: 14 });
    $$renderer2.push(`<!----> ${escape_html(t("onboarding.addItem"))}</button></div> `);
    {
      Modal($$renderer2);
    }
    $$renderer2.push(`<!---->`);
  });
}
function Step_theme($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { themes, selectedThemeId, colorSchema: colorSchema2 = "light" } = $$props;
    const text = derived(() => colorSchema2 === "dark" ? "text-neutral-200" : "text-gray-800");
    const muted = derived(() => colorSchema2 === "dark" ? "text-neutral-500" : "text-gray-500");
    const cardBg = derived(() => colorSchema2 === "dark" ? "bg-neutral-800/50" : "bg-white");
    const cardBorder = derived(() => colorSchema2 === "dark" ? "border-neutral-700" : "border-gray-200");
    const cardSelected = derived(() => colorSchema2 === "dark" ? "border-neutral-200 ring-1 ring-neutral-200" : "border-gray-800 ring-1 ring-gray-800");
    const badgeBg = derived(() => colorSchema2 === "dark" ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-700");
    const tagBg = derived(() => colorSchema2 === "dark" ? "bg-neutral-700/50" : "bg-gray-100");
    $$renderer2.push(`<div class="flex flex-wrap justify-center gap-4"><!--[-->`);
    const each_array = ensure_array_like(themes);
    for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
      let theme = each_array[$$index_1];
      const selected = theme.id === selectedThemeId;
      $$renderer2.push(`<button${attr_class(`w-full max-w-xs overflow-hidden rounded-lg border text-left transition-all sm:w-64 ${stringify(cardBg())} ${stringify(selected ? cardSelected() : cardBorder())}`)}>`);
      if (theme.thumbnailUrl) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div${attr_class(`overflow-hidden border-b ${stringify(cardBorder())}`)}><img${attr("src", theme.thumbnailUrl)}${attr("alt", `Preview of ${stringify(theme.name)}`)} class="w-full" loading="lazy"/></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="p-4"><div class="flex items-center gap-2"><span${attr_class(`text-sm font-semibold ${stringify(text())}`)}>${escape_html(theme.name)}</span> `);
      if (selected) {
        $$renderer2.push("<!--[0-->");
        Check($$renderer2, { size: 14, class: text() });
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> `);
      if (theme.description) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<p${attr_class(`mt-1 line-clamp-2 text-[10px] ${stringify(muted())}`)}>${escape_html(theme.description)}</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (theme.atsScore) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div${attr_class(`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${stringify(badgeBg())}`)}>`);
        Shield($$renderer2, { size: 11 });
        $$renderer2.push(`<!----> ATS ${escape_html(theme.atsScore)}/100</div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (theme.tags?.length) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="mt-2 flex flex-wrap gap-1"><!--[-->`);
        const each_array_1 = ensure_array_like(theme.tags.slice(0, 3));
        for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
          let tag = each_array_1[$$index];
          $$renderer2.push(`<span${attr_class(`rounded px-1.5 py-0.5 text-[9px] ${stringify(muted())} ${stringify(tagBg())}`)}>${escape_html(tag)}</span>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div></button>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function Step_review($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      session,
      steps,
      colorSchema: colorSchema2 = "light"
    } = $$props;
    const text = derived(() => colorSchema2 === "dark" ? "text-neutral-200" : "text-gray-800");
    const muted = derived(() => colorSchema2 === "dark" ? "text-neutral-500" : "text-gray-500");
    const cardBg = derived(() => colorSchema2 === "dark" ? "bg-neutral-800/50" : "bg-white");
    const cardBorder = derived(() => colorSchema2 === "dark" ? "border-neutral-700/50" : "border-gray-200");
    const skippedBg = derived(() => colorSchema2 === "dark" ? "bg-neutral-800/30" : "bg-gray-50");
    const hoverStyle = derived(() => colorSchema2 === "dark" ? "hover:border-neutral-500" : "hover:border-gray-400");
    const sections = derived(() => {
      const result = [];
      const pi = session.personalInfo;
      if (pi) {
        const step = steps.find((s) => s.id === "personal-info");
        const entries = (step?.fields ?? []).filter((f) => pi[f.key]).map((f) => ({ label: f.label, value: String(pi[f.key]) }));
        if (entries.length) result.push({
          label: step?.label ?? "Personal Info",
          stepId: "personal-info",
          entries
        });
      }
      const username = session.username;
      if (username) {
        const step = steps.find((s) => s.id === "username");
        result.push({
          label: step?.label ?? "Username",
          stepId: "username",
          entries: [{ label: "", value: `@${username}` }]
        });
      }
      const pp = session.professionalProfile;
      if (pp) {
        const step = steps.find((s) => s.id === "professional-profile");
        const entries = (step?.fields ?? []).filter((f) => pp[f.key]).map((f) => ({
          label: f.label,
          value: String(pp[f.key]),
          long: f.key === "summary"
        }));
        if (entries.length) result.push({
          label: step?.label ?? "Profile",
          stepId: "professional-profile",
          entries
        });
      }
      const secs = session.sections;
      if (secs) {
        for (const sec of secs) {
          const step = steps.find((s) => s.id === `section:${sec.sectionTypeKey}`);
          const label = step?.label ?? sec.sectionTypeKey;
          const stepId = `section:${sec.sectionTypeKey}`;
          if (sec.noData || !sec.items?.length) {
            result.push({ label, stepId, entries: [], skipped: true });
            continue;
          }
          const entries = sec.items.map((item) => {
            const vals = Object.values(item.content ?? {}).filter(Boolean);
            return { label: "", value: vals.slice(0, 3).join(" · ") || "—" };
          });
          result.push({ label, stepId, entries });
        }
      }
      const ts = session.templateSelection;
      if (ts?.templateId) {
        const step = steps.find((s) => s.id === "template");
        const themeData = step?.data?.find((t) => t.id === ts.templateId);
        result.push({
          label: step?.label ?? "Theme",
          stepId: "template",
          entries: [],
          themeName: themeData?.name ?? ts.templateId,
          themePreview: themeData?.thumbnailUrl
        });
      }
      return result;
    });
    $$renderer2.push(`<div class="space-y-3"><!--[-->`);
    const each_array = ensure_array_like(sections());
    for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
      let section = each_array[$$index_1];
      $$renderer2.push(`<button${attr_class(`w-full cursor-pointer rounded-lg border p-5 text-left transition-colors ${stringify(section.skipped ? skippedBg() : cardBg())} ${stringify(cardBorder())} ${stringify(hoverStyle())}`)}><div class="mb-3 flex items-center gap-2">`);
      if (section.skipped) {
        $$renderer2.push("<!--[0-->");
        Minus($$renderer2, { size: 12, class: muted() });
      } else {
        $$renderer2.push("<!--[-1-->");
        Check($$renderer2, { size: 12, class: "text-emerald-500" });
      }
      $$renderer2.push(`<!--]--> <h3${attr_class(`text-[10px] font-bold uppercase tracking-widest ${stringify(muted())}`)}>${escape_html(section.label)}</h3></div> `);
      if (section.skipped) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<p${attr_class(`text-xs italic ${stringify(muted())}`)}>Skipped</p>`);
      } else if (section.themePreview || section.themeName) {
        $$renderer2.push("<!--[1-->");
        $$renderer2.push(`<div class="flex items-start gap-4">`);
        if (section.themePreview) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<img${attr("src", section.themePreview)}${attr("alt", section.themeName)}${attr_class(`w-20 rounded border ${stringify(cardBorder())}`)} loading="lazy"/>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <span${attr_class(`text-xs font-medium ${stringify(text())}`)}>${escape_html(section.themeName)}</span></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<dl class="space-y-2"><!--[-->`);
        const each_array_1 = ensure_array_like(section.entries);
        for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
          let entry = each_array_1[$$index];
          if (entry.long) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div>`);
            if (entry.label) {
              $$renderer2.push("<!--[0-->");
              $$renderer2.push(`<dt${attr_class(`mb-0.5 text-[10px] font-semibold uppercase tracking-widest ${stringify(muted())}`)}>${escape_html(entry.label)}</dt>`);
            } else {
              $$renderer2.push("<!--[-1-->");
            }
            $$renderer2.push(`<!--]--> <dd${attr_class(`text-xs leading-relaxed break-words ${stringify(text())}`)}>${escape_html(entry.value)}</dd></div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
            $$renderer2.push(`<div class="flex items-baseline justify-between gap-4">`);
            if (entry.label) {
              $$renderer2.push("<!--[0-->");
              $$renderer2.push(`<dt${attr_class(`flex-shrink-0 text-[10px] font-semibold uppercase tracking-widest ${stringify(muted())}`)}>${escape_html(entry.label)}</dt>`);
            } else {
              $$renderer2.push("<!--[-1-->");
            }
            $$renderer2.push(`<!--]--> <dd${attr_class(`text-right text-xs ${stringify(text())}`)}>${escape_html(entry.value)}</dd></div>`);
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]--></dl>`);
      }
      $$renderer2.push(`<!--]--></button>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function Preview_panel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { colorSchema: colorSchema2 = "light" } = $$props;
    const bg = derived(() => colorSchema2 === "dark" ? "bg-neutral-800/80" : "bg-gray-100");
    const border = derived(() => colorSchema2 === "dark" ? "border-neutral-700" : "border-gray-200");
    const muted = derived(() => colorSchema2 === "dark" ? "text-neutral-500" : "text-gray-400");
    $$renderer2.push(`<div${attr_class(`w-48 rounded-lg border shadow-sm overflow-hidden ${stringify(bg())} ${stringify(border())}`)}>`);
    {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="flex h-72 items-center justify-center">`);
      {
        $$renderer2.push("<!--[0-->");
        Loader_circle($$renderer2, { size: 16, class: `animate-spin ${stringify(muted())}` });
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const cs = derived(() => colorSchema.mode);
    const t = derived(() => locale.t);
    const text = derived(() => cs() === "dark" ? "text-neutral-200" : "text-gray-800");
    const muted = derived(() => cs() === "dark" ? "text-neutral-500" : "text-gray-500");
    const auth = createAuthSession(() => ({ query: { retry: false } }));
    const authenticated = derived(() => auth.data?.data?.data?.authenticated ?? false);
    const session = createOnboardingGetSession(() => ({ locale: locale.current }), () => ({ query: { enabled: authenticated() } }));
    const queryClient = useQueryClient();
    const queryKey = derived(() => getOnboardingGetSessionQueryKey({ locale: locale.current }));
    function invalidateSession() {
      queryClient.invalidateQueries({ queryKey: queryKey() });
    }
    const onboardingData = derived(() => session.data?.data?.data);
    const steps = derived(() => onboardingData()?.steps ?? []);
    const currentStepId = derived(() => onboardingData()?.currentStep ?? "");
    const currentStep = derived(() => steps().find((s) => s.id === currentStepId()));
    const completedSteps = derived(() => onboardingData()?.completedSteps ?? []);
    const progress = derived(() => onboardingData()?.progress ?? 0);
    const strength = derived(() => onboardingData()?.strength);
    const missingRequired = derived(() => onboardingData()?.missingRequired ?? []);
    const isLastStep = derived(() => !onboardingData()?.nextStep || currentStep()?.component === "review");
    let stepData = {};
    let multiItems = [];
    const nextStep = createOnboardingNextStep(() => ({ mutation: { onSuccess: invalidateSession } }));
    const prevStep = createOnboardingPreviousStep(() => ({ mutation: { onSuccess: invalidateSession } }));
    createOnboardingGotoStep(() => ({ mutation: { onSuccess: invalidateSession } }));
    const complete = createOnboardingCompleteFromSession(() => ({
      mutation: {
        onSuccess() {
          queryClient.invalidateQueries({ queryKey: getAuthSessionQueryKey() });
          goto();
        }
      }
    }));
    createOnboardingSaveStepData();
    const isSectionStep = derived(() => currentStepId().startsWith("section:"));
    function handleNext() {
      const body = currentStep()?.multipleItems ? { items: multiItems } : stepData;
      nextStep.mutate({ data: body, params: { locale: locale.current } });
    }
    function handleComplete() {
      complete.mutate({});
    }
    const isPending = derived(() => nextStep.isPending || prevStep.isPending || complete.isPending);
    head("fpvdp2", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(t()?.("onboarding.pageTitle") ?? "")}</title>`);
      });
    });
    if (auth.isLoading || session.isLoading) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="flex min-h-screen items-center justify-center pt-14">`);
      Loader_circle($$renderer2, { size: 24, class: `animate-spin ${stringify(muted())}` });
      $$renderer2.push(`<!----></div>`);
    } else if (t() && onboardingData() && currentStep()) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<div class="font-sans antialiased transition-colors duration-300"><main class="mx-auto max-w-6xl px-6" style="padding-top: max(5rem, calc((100vh - 36rem) / 2));"><div class="md:hidden">`);
      Stepper_mobile($$renderer2, {
        steps: steps(),
        currentStep: currentStepId(),
        completedSteps: completedSteps(),
        progress: progress(),
        strength: strength(),
        colorSchema: cs()
      });
      $$renderer2.push(`<!----></div> <div class="flex gap-10"><div class="hidden md:block flex-shrink-0">`);
      Sidebar($$renderer2, {
        steps: steps(),
        currentStep: currentStepId(),
        completedSteps: completedSteps(),
        progress: progress(),
        strength: strength(),
        missingRequired: missingRequired(),
        colorSchema: cs(),
        t: t()
      });
      $$renderer2.push(`<!----></div> <div class="min-w-0 flex-1 max-w-lg pb-12"><div class="mb-8 flex items-center justify-between"><span${attr_class(`text-[10px] font-semibold uppercase tracking-widest ${stringify(muted())}`)}>${escape_html(t()("onboarding.title"))}</span> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> <div class="mb-8 text-center"><h2${attr_class(`text-sm font-bold ${stringify(text())}`)}>${escape_html(currentStep().label)}</h2> `);
      if (currentStep().description) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<p${attr_class(`mt-1 text-[10px] ${stringify(muted())}`)}>${escape_html(currentStep().description)}</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> `);
      if (currentStep().component === "review") {
        $$renderer2.push("<!--[0-->");
        Step_review($$renderer2, {
          session: onboardingData(),
          steps: steps(),
          completedSteps: completedSteps(),
          colorSchema: cs()
        });
      } else if (currentStep().component === "template" && currentStep().data?.length) {
        $$renderer2.push("<!--[1-->");
        Step_theme($$renderer2, {
          themes: currentStep().data,
          selectedThemeId: stepData.templateId ?? "",
          colorSchema: cs()
        });
      } else if (currentStep().multipleItems) {
        $$renderer2.push("<!--[2-->");
        Step_multi_items($$renderer2, {
          fields: currentStep().fields ?? [],
          items: multiItems,
          colorSchema: cs(),
          t: t()
        });
      } else {
        $$renderer2.push("<!--[-1-->");
        Step_form($$renderer2, {
          fields: currentStep().fields ?? [],
          data: stepData,
          colorSchema: cs(),
          onupdate: (d) => stepData = d
        });
      }
      $$renderer2.push(`<!--]--> `);
      if (isSectionStep()) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<button${attr("disabled", isPending(), true)}${attr_class(`mt-6 text-[10px] font-semibold uppercase tracking-widest transition-opacity hover:opacity-60 disabled:opacity-30 ${stringify(muted())}`)}>${escape_html(t()("onboarding.skip"))}</button>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="mt-10 flex items-center justify-between">`);
      if (onboardingData().previousStep) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<button${attr("disabled", isPending(), true)}${attr_class(`flex items-center gap-2 text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-60 disabled:opacity-30 ${stringify(muted())}`)}>`);
        Arrow_left($$renderer2, { size: 14 });
        $$renderer2.push(`<!----> ${escape_html(t()("onboarding.back"))}</button>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<div></div>`);
      }
      $$renderer2.push(`<!--]--> `);
      if (isLastStep()) {
        $$renderer2.push("<!--[0-->");
        Button($$renderer2, {
          onclick: handleComplete,
          disabled: isPending() || missingRequired().length > 0,
          variant: "solid",
          colorSchema: cs(),
          class: "max-w-[200px]",
          children: ($$renderer3) => {
            if (complete.isPending) {
              $$renderer3.push("<!--[0-->");
              Loader_circle($$renderer3, { size: 14, class: "mx-auto animate-spin" });
            } else {
              $$renderer3.push("<!--[-1-->");
              $$renderer3.push(`${escape_html(t()("onboarding.complete"))}`);
            }
            $$renderer3.push(`<!--]-->`);
          },
          $$slots: { default: true }
        });
      } else {
        $$renderer2.push("<!--[-1-->");
        Button($$renderer2, {
          onclick: handleNext,
          disabled: isPending(),
          variant: "solid",
          colorSchema: cs(),
          class: "max-w-[200px]",
          children: ($$renderer3) => {
            if (nextStep.isPending) {
              $$renderer3.push("<!--[0-->");
              Loader_circle($$renderer3, { size: 14, class: "mx-auto animate-spin" });
            } else {
              $$renderer3.push("<!--[-1-->");
              $$renderer3.push(`<span class="flex items-center justify-center gap-2">${escape_html(t()("onboarding.next"))} `);
              Arrow_right($$renderer3, { size: 14 });
              $$renderer3.push(`<!----></span>`);
            }
            $$renderer3.push(`<!--]-->`);
          },
          $$slots: { default: true }
        });
      }
      $$renderer2.push(`<!--]--></div></div> <div class="hidden xl:block flex-shrink-0">`);
      Preview_panel($$renderer2, { token: auth.data?.data?.data?.accessToken, colorSchema: cs() });
      $$renderer2.push(`<!----></div></div></main></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
