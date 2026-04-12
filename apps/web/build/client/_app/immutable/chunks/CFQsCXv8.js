import{c as $,a as f}from"./DsEfZl_f.js";import"./DIZn9874.js";import{f as m,h as e,g as n,i}from"./CWERkfRM.js";import{I as v,s as h}from"./DSwzJ_5H.js";import{l as _,s as I}from"./loKv-cgS.js";function P(t,o){const c=_(o,["children","$$slots","$$events","$$legacy"]);/**
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
 */const u=[["circle",{cx:"12",cy:"12",r:"10"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"}],["path",{d:"M2 12h20"}]];v(t,I({name:"globe"},()=>c,{get iconNode(){return u},children:(d,C)=>{var a=$(),p=m(a);h(p,o,"default",{}),f(d,a)},$$slots:{default:!0}}))}function R(t,o){const c=_(o,["children","$$slots","$$events","$$legacy"]);/**
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
 */const u=[["path",{d:"M7.9 20A9 9 0 1 0 4 16.1L2 22Z"}]];v(t,I({name:"message-circle"},()=>c,{get iconNode(){return u},children:(d,C)=>{var a=$(),p=m(a);h(p,o,"default",{}),f(d,a)},$$slots:{default:!0}}))}let s=i(!1),r=i(!1),l=i(null),g=i(null);const b={get isOpen(){return n(s)},get isFullscreen(){return n(r)},get activeConversationId(){return n(l)},get pendingRecipientId(){return n(g)},toggle(){e(s,!n(s))},open(){e(s,!0)},close(){e(s,!1),e(r,!1)},openFullscreen(){e(s,!0),e(r,!0)},toggleFullscreen(){e(r,!n(r))},exitFullscreen(){e(r,!1)},openConversation(t){e(l,t,!0),e(s,!0)},startConversationWith(t){e(g,t,!0),e(l,null),e(s,!0)},clearPendingRecipient(){e(g,null)},setActiveConversation(t){e(l,t,!0)}};export{P as G,R as M,b as c};
