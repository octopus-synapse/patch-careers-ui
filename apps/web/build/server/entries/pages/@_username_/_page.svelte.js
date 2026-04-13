import { b as sanitize_props, c as spread_props, d as slot, j as head, f as stringify, e as attr_class, l as attr_style, g as attr, h as derived, k as store_get, u as unsubscribe_stores } from "../../../chunks/renderer.js";
import { p as page } from "../../../chunks/stores.js";
import { l as createQuery, q as createMutation, t as customFetch, I as Icon, u as createAuthSession, v as useQueryClient } from "../../../chunks/Icon.js";
import { c as colorSchema } from "../../../chunks/color-schema.svelte.js";
import { L as Loader_circle } from "../../../chunks/loader-circle.js";
import { M as Message_circle, G as Globe } from "../../../chunks/message-circle.js";
import { e as escape_html } from "../../../chunks/escaping.js";
const getFollowFollowUrl = (userId) => {
  return `/api/v1/users/${userId}/follow`;
};
const followFollow = async (userId, options) => {
  return customFetch(
    getFollowFollowUrl(userId),
    {
      ...options,
      method: "POST"
    }
  );
};
const getFollowFollowMutationOptions = (options) => {
  const mutationKey = ["followFollow"];
  const { mutation: mutationOptions, request: requestOptions } = options ? options.mutation && "mutationKey" in options.mutation && options.mutation.mutationKey ? options : { ...options, mutation: { ...options.mutation, mutationKey } } : { mutation: { mutationKey }, request: void 0 };
  const mutationFn = (props) => {
    const { userId } = props ?? {};
    return followFollow(userId, requestOptions);
  };
  return { mutationFn, ...mutationOptions };
};
const createFollowFollow = (options, queryClient) => {
  return createMutation(() => ({ ...getFollowFollowMutationOptions(options?.()) }));
};
const getFollowUnfollowUrl = (userId) => {
  return `/api/v1/users/${userId}/follow`;
};
const followUnfollow = async (userId, options) => {
  return customFetch(
    getFollowUnfollowUrl(userId),
    {
      ...options,
      method: "DELETE"
    }
  );
};
const getFollowUnfollowMutationOptions = (options) => {
  const mutationKey = ["followUnfollow"];
  const { mutation: mutationOptions, request: requestOptions } = options ? options.mutation && "mutationKey" in options.mutation && options.mutation.mutationKey ? options : { ...options, mutation: { ...options.mutation, mutationKey } } : { mutation: { mutationKey }, request: void 0 };
  const mutationFn = (props) => {
    const { userId } = props ?? {};
    return followUnfollow(userId, requestOptions);
  };
  return { mutationFn, ...mutationOptions };
};
const createFollowUnfollow = (options, queryClient) => {
  return createMutation(() => ({ ...getFollowUnfollowMutationOptions(options?.()) }));
};
const getFollowIsFollowingUrl = (userId) => {
  return `/api/v1/users/${userId}/is-following`;
};
const followIsFollowing = async (userId, options) => {
  return customFetch(
    getFollowIsFollowingUrl(userId),
    {
      ...options,
      method: "GET"
    }
  );
};
const getFollowIsFollowingQueryKey = (userId) => {
  return [
    `/api/v1/users/${userId}/is-following`
  ];
};
const getFollowIsFollowingQueryOptions = (userId, options) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getFollowIsFollowingQueryKey(userId);
  const queryFn = ({ signal }) => followIsFollowing(userId, { signal, ...requestOptions });
  return { queryKey, queryFn, enabled: !!userId, ...queryOptions };
};
function createFollowIsFollowing(userId, options, queryClient) {
  const query = createQuery(() => getFollowIsFollowingQueryOptions(userId(), options?.()));
  return query;
}
const getFollowGetSocialStatsUrl = (userId) => {
  return `/api/v1/users/${userId}/social-stats`;
};
const followGetSocialStats = async (userId, options) => {
  return customFetch(
    getFollowGetSocialStatsUrl(userId),
    {
      ...options,
      method: "GET"
    }
  );
};
const getFollowGetSocialStatsQueryKey = (userId) => {
  return [
    `/api/v1/users/${userId}/social-stats`
  ];
};
const getFollowGetSocialStatsQueryOptions = (userId, options) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getFollowGetSocialStatsQueryKey(userId);
  const queryFn = ({ signal }) => followGetSocialStats(userId, { signal, ...requestOptions });
  return { queryKey, queryFn, enabled: !!userId, ...queryOptions };
};
function createFollowGetSocialStats(userId, options, queryClient) {
  const query = createQuery(() => getFollowGetSocialStatsQueryOptions(userId(), options?.()));
  return query;
}
const getUsersGetPublicProfileByUsernameUrl = (username) => {
  return `/api/v1/users/${username}/profile`;
};
const usersGetPublicProfileByUsername = async (username, options) => {
  return customFetch(
    getUsersGetPublicProfileByUsernameUrl(username),
    {
      ...options,
      method: "GET"
    }
  );
};
const getUsersGetPublicProfileByUsernameQueryKey = (username) => {
  return [
    `/api/v1/users/${username}/profile`
  ];
};
const getUsersGetPublicProfileByUsernameQueryOptions = (username, options) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getUsersGetPublicProfileByUsernameQueryKey(username);
  const queryFn = ({ signal }) => usersGetPublicProfileByUsername(username, { signal, ...requestOptions });
  return { queryKey, queryFn, enabled: !!username, ...queryOptions };
};
function createUsersGetPublicProfileByUsername(username, options, queryClient) {
  const query = createQuery(() => getUsersGetPublicProfileByUsernameQueryOptions(username(), options?.()));
  return query;
}
function File_down($$renderer, $$props) {
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
        "d": "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"
      }
    ],
    ["path", { "d": "M14 2v4a2 2 0 0 0 2 2h4" }],
    ["path", { "d": "M12 18v-6" }],
    ["path", { "d": "m9 15 3 3 3-3" }]
  ];
  Icon($$renderer, spread_props([
    { name: "file-down" },
    $$sanitized_props,
    {
      /**
       * @component @name FileDown
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTUgMkg2YTIgMiAwIDAgMC0yIDJ2MTZhMiAyIDAgMCAwIDIgMmgxMmEyIDIgMCAwIDAgMi0yVjdaIiAvPgogIDxwYXRoIGQ9Ik0xNCAydjRhMiAyIDAgMCAwIDIgMmg0IiAvPgogIDxwYXRoIGQ9Ik0xMiAxOHYtNiIgLz4KICA8cGF0aCBkPSJtOSAxNSAzIDMgMy0zIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/file-down
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
function Map_pin($$renderer, $$props) {
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
        "d": "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
      }
    ],
    ["circle", { "cx": "12", "cy": "10", "r": "3" }]
  ];
  Icon($$renderer, spread_props([
    { name: "map-pin" },
    $$sanitized_props,
    {
      /**
       * @component @name MapPin
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjAgMTBjMCA0Ljk5My01LjUzOSAxMC4xOTMtNy4zOTkgMTEuNzk5YTEgMSAwIDAgMS0xLjIwMiAwQzkuNTM5IDIwLjE5MyA0IDE0Ljk5MyA0IDEwYTggOCAwIDAgMSAxNiAwIiAvPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjMiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/map-pin
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
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    const cs = derived(() => colorSchema.mode);
    const username = derived(() => store_get($$store_subs ??= {}, "$page", page).params.username);
    const auth = createAuthSession(() => ({ query: { retry: false } }));
    const currentUserId = derived(() => String(auth.data?.data?.data?.user ? auth.data?.data?.data.user.id ?? "" : ""));
    const authenticated = derived(() => auth.data?.data?.data?.authenticated ?? false);
    const profile = createUsersGetPublicProfileByUsername(() => username() ?? "", () => ({ query: { enabled: !!username() } }));
    const profileData = derived(() => profile.data?.data?.data ?? null);
    const user = derived(() => profileData()?.user ?? null);
    const resume = derived(() => profileData()?.resume ?? null);
    let downloading = false;
    const userId = derived(() => user()?.id ?? "");
    const isOwnProfile = derived(() => !!currentUserId() && currentUserId() === userId());
    const socialStats = createFollowGetSocialStats(() => userId(), () => ({ query: { enabled: !!userId() } }));
    const stats = derived(() => socialStats.data?.data?.data ?? { followers: 0, following: 0 });
    const isFollowingQuery = createFollowIsFollowing(() => userId(), () => ({
      query: { enabled: !!userId() && !!currentUserId() && !isOwnProfile() }
    }));
    const isFollowing = derived(() => isFollowingQuery.data?.data?.data?.isFollowing ?? false);
    const queryClient = useQueryClient();
    createFollowFollow(() => ({
      mutation: {
        onSuccess() {
          queryClient.invalidateQueries({ queryKey: getFollowGetSocialStatsQueryKey(userId()) });
          queryClient.invalidateQueries({ queryKey: getFollowIsFollowingQueryKey(userId()) });
        }
      }
    }));
    createFollowUnfollow(() => ({
      mutation: {
        onSuccess() {
          queryClient.invalidateQueries({ queryKey: getFollowGetSocialStatsQueryKey(userId()) });
          queryClient.invalidateQueries({ queryKey: getFollowIsFollowingQueryKey(userId()) });
        }
      }
    }));
    function bannerGradient(name) {
      let hash = 0;
      for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      const h1 = Math.abs(hash % 360);
      const h2 = (h1 + 40) % 360;
      return `linear-gradient(135deg, hsl(${h1}, 50%, 40%), hsl(${h2}, 60%, 30%))`;
    }
    const text = derived(() => cs() === "dark" ? "text-neutral-200" : "text-gray-800");
    const muted = derived(() => cs() === "dark" ? "text-neutral-500" : "text-gray-500");
    const cardBg = derived(() => cs() === "dark" ? "bg-neutral-800/50" : "bg-gray-50");
    const border = derived(() => cs() === "dark" ? "border-neutral-800" : "border-gray-200");
    const btnPrimary = derived(() => cs() === "dark" ? "bg-neutral-200 text-neutral-900 hover:bg-neutral-300" : "bg-gray-800 text-white hover:bg-gray-700");
    const btnSecondary = derived(() => cs() === "dark" ? "border-neutral-600 text-neutral-300 hover:bg-neutral-800" : "border-gray-300 text-gray-700 hover:bg-gray-50");
    head("xyycvn", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(user()?.name ?? user()?.username ?? username())} — Profile</title>`);
      });
    });
    if (profile.isLoading) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="flex h-screen items-center justify-center">`);
      Loader_circle($$renderer2, { size: 20, class: `animate-spin ${stringify(muted())}` });
      $$renderer2.push(`<!----></div>`);
    } else if (profile.isError || !user()) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<div class="flex h-screen flex-col items-center justify-center gap-3"><span${attr_class(`text-4xl font-bold ${stringify(text())}`)}>404</span> <span${attr_class(`text-[11px] uppercase tracking-widest ${stringify(muted())}`)}>profile not found</span></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="min-h-screen pt-14"><div class="h-48 w-full sm:h-56"${attr_style(`background: ${stringify(bannerGradient(username() ?? ""))}`)}></div> <div class="mx-auto max-w-3xl px-6"><div class="relative -mt-16 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:gap-6">`);
      if (user().photoURL) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<img${attr("src", user().photoURL)}${attr("alt", user().name ?? username())}${attr_class(`h-32 w-32 rounded-full border-4 object-cover ${stringify(cs() === "dark" ? "border-neutral-900" : "border-white")}`)}/>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<div${attr_class(`flex h-32 w-32 items-center justify-center rounded-full border-4 text-4xl font-bold ${stringify(cs() === "dark" ? "border-neutral-900 bg-neutral-700 text-neutral-200" : "border-white bg-gray-200 text-gray-600")}`)}>${escape_html((user().name ?? username() ?? "?").charAt(0).toUpperCase())}</div>`);
      }
      $$renderer2.push(`<!--]--> <div class="flex flex-1 flex-col gap-3 pb-1 sm:flex-row sm:items-center sm:justify-between"><div><h1${attr_class(`text-2xl font-bold ${stringify(text())}`)}>${escape_html(user().name ?? username())}</h1> <span${attr_class(`text-sm ${stringify(muted())}`)}>@${escape_html(user().username ?? username())}</span></div> `);
      if (!isOwnProfile() && authenticated()) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="flex items-center gap-2"><button${attr_class(`rounded-full px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all ${stringify(isFollowing() ? "border " + btnSecondary() : btnPrimary())}`)}>${escape_html(isFollowing() ? "Following" : "Follow")}</button> <button${attr_class(`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all ${stringify(btnSecondary())}`)}>`);
        Message_circle($$renderer2, { size: 13 });
        $$renderer2.push(`<!----> Message</button></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div></div> `);
      if (user().bio) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<p${attr_class(`mt-4 max-w-xl text-sm leading-relaxed ${stringify(text())}`)}>${escape_html(user().bio)}</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div${attr_class(`mt-3 flex flex-wrap items-center gap-4 text-[12px] ${stringify(muted())}`)}>`);
      if (user().location) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="flex items-center gap-1">`);
        Map_pin($$renderer2, { size: 13 });
        $$renderer2.push(`<!----> ${escape_html(user().location)}</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (user().website) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<a${attr("href", user().website)} target="_blank" rel="noopener" class="flex items-center gap-1 hover:underline">`);
        Globe($$renderer2, { size: 13 });
        $$renderer2.push(`<!----> ${escape_html(user().website.replace(/^https?:\/\//, ""))}</a>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> <div${attr_class(`mt-4 flex flex-wrap items-center gap-5 border-b pb-5 ${stringify(border())}`)}><div class="flex items-center gap-4 text-sm"><span><strong${attr_class(text())}>${escape_html(stats().followers ?? 0)}</strong> <span${attr_class(muted())}>followers</span></span> <span><strong${attr_class(text())}>${escape_html(stats().following ?? 0)}</strong> <span${attr_class(muted())}>following</span></span></div> <div class="flex items-center gap-3">`);
      if (user().github) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<a${attr("href", `https://github.com/${stringify(user().github)}`)} target="_blank" rel="noopener"${attr_class(`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${stringify(cardBg())} ${stringify(muted())} hover:opacity-80`)}><svg viewBox="0 0 16 16" class="h-3.5 w-3.5 fill-current"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg> GitHub</a>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (user().linkedin) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<a${attr("href", `https://linkedin.com/in/${stringify(user().linkedin)}`)} target="_blank" rel="noopener"${attr_class(`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${stringify(cardBg())} ${stringify(muted())} hover:opacity-80`)}><svg viewBox="0 0 16 16" class="h-3.5 w-3.5 fill-current"><path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 01.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"></path></svg> LinkedIn</a>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div></div> `);
      if (resume() && authenticated()) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div${attr_class(`mt-6 rounded-xl border p-5 ${stringify(border())} ${stringify(cardBg())}`)}><div class="flex items-center justify-between"><div><h3${attr_class(`text-sm font-semibold ${stringify(text())}`)}>Resume</h3> <p${attr_class(`mt-0.5 text-[11px] ${stringify(muted())}`)}>Download ${escape_html(user().name ?? username())}'s resume</p> `);
        {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div> <button${attr("disabled", downloading, true)}${attr_class(`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all ${stringify(btnPrimary())} disabled:opacity-50`)}>`);
        {
          $$renderer2.push("<!--[-1-->");
          File_down($$renderer2, { size: 13 });
          $$renderer2.push(`<!----> Download`);
        }
        $$renderer2.push(`<!--]--></button></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
