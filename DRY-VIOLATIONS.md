# DRY Violations — patch-careers-ui

Audit of duplicated code, copy-paste patterns, and repeated logic/styles/constants
across the hand-written source (auto-generated `packages/api-client/src/generated/**`
excluded). All `path:line` references are relative to the repo root and were verified
by reading the files.

**35 findings** — 6 High · 17 Medium · 12 Low.

---

## Summary

| #  | Severity | Cluster      | Violation |
|----|----------|--------------|-----------|
| A1 | High     | Auth         | Post-auth `exchangeSession → bootstrap → replace(route)` hand-rolled in 4 places |
| A2 | High     | Auth         | `setSubmitting` + try/finally submit envelope in 6 screens |
| A3 | High     | Auth         | `extractApiErrorMessages` + toast catch-block copy-pasted (sign-in/sign-up) |
| U1 | High     | packages/ui  | Password-strength 4-signal scoring duplicated in two modules |
| U2 | High     | packages/ui  | Tamagui theme-getter `.get()` unwrap copy-pasted |
| P1 | High     | packages     | Zustand persisted-store + migrate boilerplate across 3 stores |
| A4 | Medium   | Auth         | Per-field "clear error on change" `onChangeText` closure repeated |
| A5 | Medium   | Auth         | Email/password `UnderlineInput` field block duplicated verbatim |
| A6 | Medium   | Auth         | `useTranslator/useRouter/useToast/useLocalSearchParams` header quartet |
| A7 | Medium   | Auth         | "danger toast → replace(sign-in)" failure recovery + reused i18n key |
| A8 | Medium   | Auth         | OAuth handler + `patchcareers://auth/callback` literal in 3 files |
| O1 | Medium   | Onboarding   | `usernameState` mapped through 3 parallel conditional ladders |
| O2 | Medium   | Onboarding   | "uppercase eyebrow label" text style recipe in 10 StyleSheet entries |
| O3 | Medium   | Onboarding   | Underline / hairline-error input treatment re-implemented 3× |
| U3 | Medium   | packages/ui  | Haptic-on-press wired 3 inconsistent ways (FAB double-fires) |
| U4 | Medium   | packages/ui  | `ConfirmModal` vs `DangerConfirmModal` near-identical bodies |
| U5 | Medium   | packages/ui  | `FadeInDown.delay().duration().easing()` entrance repeated 6× |
| U6 | Medium   | packages/ui  | Bottom-sheet+search+rows reimplemented in PhoneInput vs ListPicker |
| P2 | Medium   | packages     | `Accept-Mode: tokens` header block duplicated (2 auth fetch paths) |
| P3 | Medium   | packages     | `Bearer ${accessToken}` getAuthHeader closure duplicated |
| P4 | Medium   | packages     | `extractTokenPair` token-triple validation re-implemented in OAuth |
| P5 | Medium   | packages     | Single-flight refresh primitive implemented twice |
| P6 | Medium   | packages     | Locale key + persistence + validation duplicated (I18nProvider vs store) |
| A9 | Low      | Auth         | Two divergent translator accessors (`useI18n` vs `useTranslator`) |
| A10| Low      | Auth         | `Pressable` caption-button + `{padding:8}` style duplicated |
| A11| Low      | Auth         | "Back to sign-in" `<Link>` + caption Text duplicated 3× |
| A12| Low      | Auth         | Success/error banner `StyleSheet` blocks differ only by palette |
| O4 | Low      | Onboarding   | Modal scrim + transparent/fade boilerplate across 3 modals |
| O5 | Low      | Onboarding   | "Plus icon + addLabel" add-affordance row repeated 3× |
| O6 | Low      | Onboarding   | Storage flag get/set/clear + TTL-guard shape repeated |
| U7 | Low      | packages/ui  | Token-bypassing literals (`borderRadius:999/9999`, hairlines, `$gray*`) |
| U8 | Low      | packages/ui  | `LooseProps` type + loose-cast idiom redeclared outside the shim |
| U9 | Low      | packages/ui  | Inline underlined-link `<TText>` recipe repeated 3× |
| P7 | Low      | packages     | Web storage adapter repeats `store instanceof Map` branch 5× |
| P8 | Low      | packages     | `navigator.product === "ReactNative"` runtime sniff duplicated |

> **Root cause note (Auth):** two parallel auth design systems coexist — `sign-in`/`sign-up`
> use the newer `AuthShell` + `@patch-careers/ui/editorial` DS, while `forgot-password`,
> `verify-email`, `2fa-verify`, `reset-password`, `oauth-callback` use the older
> `AuthScreenLayout` + raw `@patch-careers/ui` primitives. Several Auth findings (A5, A6,
> A9–A12) stem from this split; pick a target DS before deduping.

---

## Auth cluster

Files: `apps/client/src/app/(auth)/*`, `app/reset-password.tsx`, `app/oauth-callback.tsx`,
`components/AuthScreenLayout.tsx`, `components/auth/{validation,oauth-glyphs}.ts(x)`,
`providers/AuthProvider.tsx`.

### A1 — Post-auth completion sequence hand-rolled in 4 places · High
**Locations:**
- `apps/client/src/app/(auth)/sign-in.tsx:84-85`
- `apps/client/src/app/(auth)/2fa-verify.tsx:44-48`
- `apps/client/src/app/(auth)/verify-email.tsx:61-63`
- `apps/client/src/app/oauth-callback.tsx:47-48`

**What's duplicated:** the "finish a successful authentication" sequence — optional
`exchangeSessionForTokens(...)`, then `await bootstrap().catch(() => undefined)`, then
`router.replace(getCurrentAuthenticatedRoute())`. Three carry the identical
session-exchange + bootstrap pair:
```ts
if (result.sessionExchangeId) {
  await exchangeSessionForTokens(result.sessionExchangeId);
}
await bootstrap().catch(() => undefined);
router.replace(getCurrentAuthenticatedRoute());
```
Most drift-prone duplication in the cluster: route/bootstrap-convention changes must be
edited in lockstep across four sites.

**Suggested fix:** a `useCompleteAuth()` hook exposing `finishAuthentication({ sessionExchangeId? })`
in `apps/client/src/components/auth/useCompleteAuth.ts` (or fold into `navigation/authRedirect`).

### A2 — Submit boilerplate (`setSubmitting` + try/finally) in every screen · High
**Locations:**
- `apps/client/src/app/(auth)/sign-in.tsx:62-96`
- `apps/client/src/app/(auth)/sign-up.tsx:57-96`
- `apps/client/src/app/(auth)/forgot-password.tsx:27-43`
- `apps/client/src/app/(auth)/verify-email.tsx:56-71`
- `apps/client/src/app/(auth)/2fa-verify.tsx:34-54`
- `apps/client/src/app/reset-password.tsx:45-65`

**What's duplicated:** every screen declares `const [submitting, setSubmitting] = useState(false)`
and wraps its API call in the same `setSubmitting(true)` / `try` / `finally setSubmitting(false)`
envelope — six copies.

**Suggested fix:** a `useSubmit(handler)` hook returning `{ submitting, run }` in
`apps/client/src/components/auth/useSubmit.ts`. Composes with A3.

### A3 — `extractApiErrorMessages` + toast catch-block copy-pasted · High
**Locations:**
- `apps/client/src/app/(auth)/sign-in.tsx:86-93`
- `apps/client/src/app/(auth)/sign-up.tsx:83-92`

**What's duplicated:** the entire catch block (only the fallback key differs):
```ts
} catch (err) {
  const { toast: title, fields } = extractApiErrorMessages(err, locale, t, "<fallbackKey>", {
    email: trimmedEmail, password,
  });
  if (Object.keys(fields).length > 0) setFieldErrors(fields);
  toast.show({ title, intent: "danger" });
}
```
**Suggested fix:** `handleAuthApiError(err, { locale, t, toast, setFieldErrors, fallbackKey, payload })`
co-located with `components/auth/validation.ts` (where `extractApiErrorMessages` already lives).

### A4 — Per-field "clear error on change" closure repeated · Medium
**Locations:**
- `apps/client/src/app/(auth)/sign-in.tsx:123-126` (email), `147-151` (password)
- `apps/client/src/app/(auth)/sign-up.tsx:112-115` (email), `136-139` (password)
- `apps/client/src/app/(auth)/forgot-password.tsx:76-79` (email)
- `apps/client/src/app/reset-password.tsx:100-103` (newPassword), `127-130` (confirm)

**What's duplicated:**
```ts
onChangeText={(next) => {
  setEmail(next);
  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
}}
```
sign-in/sign-up email handlers are byte-identical; password ones differ only in field name.

**Suggested fix:** a `useAuthFields()` hook returning `bind("email")` → `{ value, onChangeText, hasError }`,
in `apps/client/src/components/auth/`.

### A5 — Email/password field block duplicated verbatim · Medium
**Locations:**
- `apps/client/src/app/(auth)/sign-in.tsx:118-139` (email), password block follows
- `apps/client/src/app/(auth)/sign-up.tsx:107-128` (email), password block follows

**What's duplicated:** the whole `<AnimatedField delay={300}>` → `<UnderlineInput …>` →
`<FieldError>` email block is identical except `testID` (`"auth.email"` vs `"signup.email"`):
same `keyboardType`, `autoCapitalize`, `autoComplete`, `textContentType`, `autoCorrect`,
`returnKeyType`, `onSubmitEditing`, `blurOnSubmit`. Password blocks are near-identical.

**Suggested fix:** `AuthEmailField` / `AuthPasswordField` wrapper components in
`apps/client/src/components/auth/`.

### A6 — Screen-setup hook quartet repeated · Medium
**Locations:**
- `apps/client/src/app/(auth)/verify-email.tsx:30-33`
- `apps/client/src/app/(auth)/2fa-verify.tsx:24-27`
- `apps/client/src/app/reset-password.tsx:32-35`
- `apps/client/src/app/oauth-callback.tsx:24-27`
- `apps/client/src/app/(auth)/forgot-password.tsx:19-20` (subset)

**What's duplicated:** `const t = useTranslator(); const router = useRouter(); const toast = useToast();
const params = useLocalSearchParams<…>();`

**Suggested fix:** a `useAuthScreen()` convenience hook returning `{ t, router, toast }` (and
optionally `locale`, addressing A9), in `apps/client/src/components/auth/`.

### A7 — "danger toast → replace(sign-in)" recovery + reused i18n key · Medium
**Locations:**
- `apps/client/src/app/(auth)/2fa-verify.tsx:37-38`, `50`
- `apps/client/src/app/oauth-callback.tsx:50-51`
- `apps/client/src/app/(auth)/verify-email.tsx:65` and `app/reset-password.tsx:61` both surface
  `t("auth.resetInvalidToken")` — verify-email borrows the *reset* key for a verification failure.

**Suggested fix:** a `failToSignIn(toast, router, titleKey)` helper; give verify-email its own
i18n key rather than borrowing `auth.resetInvalidToken`.

### A8 — OAuth handler + callback-URL literal in 3 files · Medium
**Locations:**
- `apps/client/src/app/(auth)/sign-in.tsx:98-111` (`handleOAuth` + `"patchcareers://auth/callback"`)
- `apps/client/src/providers/AuthProvider.tsx:95` (`event.url.includes("/auth/callback")`)
- `apps/client/src/app/oauth-callback.tsx:43` (`patchcareers://auth/callback?${usp}`)

**Suggested fix:** hoist `OAUTH_CALLBACK_URL` to `config/api.ts` (or `navigation/authRedirect.ts`);
extract a `useOAuthSignIn()` hook returning `handleOAuth(provider)`.

### A9 — Two divergent translator accessors · Low
`useI18n()` (`sign-in.tsx:52`, `sign-up.tsx:45`, needs `locale`) vs `useTranslator()`
(`forgot-password.tsx:19`, `verify-email.tsx:30`, `2fa-verify.tsx:24`, `reset-password.tsx:32`,
`oauth-callback.tsx:24`). Standardize on one (or expose both via the A6 hook).

### A10 — Caption-button + `{padding:8}` style duplicated · Low
- `apps/client/src/app/(auth)/verify-email.tsx:118-129` + `styles.resendButton` (`152-156`)
- `apps/client/src/app/(auth)/2fa-verify.tsx:95-104` + `styles.toggleButton` (`124-128`)

Same `<Pressable style={{padding:8}}>` wrapping `<Text preset="caption" color={palette.blue[600]}>`.
**Fix:** a `CaptionButton`/`TextButton` in `packages/ui` (reused in 2+ routes → per CLAUDE.md goes to `packages/ui`).

### A11 — "Back to sign-in" link duplicated 3× · Low
- `apps/client/src/app/(auth)/forgot-password.tsx:92-101`
- `apps/client/src/app/(auth)/verify-email.tsx:140-146`
- `apps/client/src/app/(auth)/2fa-verify.tsx:112-118`

`<Link href="/(auth)/sign-in">` + `<Text preset="caption" color={palette.blue[600]}>{t("common.back")}</Text>`;
verify-email and 2fa-verify share the identical `<XStack justifyContent="center" gap={4} marginTop={8}>`.
**Fix:** a `BackToSignInLink` component.

### A12 — Banner style blocks differ only by palette · Low
- `apps/client/src/app/(auth)/forgot-password.tsx:108-115` (`successBanner`)
- `apps/client/src/app/reset-password.tsx:158-165` (`errorBanner`)

`{ backgroundColor: palette.<c>[50], borderColor: palette.<c>[200], borderWidth: 1, borderRadius: 8, padding: 16 }`.
**Fix:** a `<Banner intent="success" | "danger">` component in `packages/ui`.

> Verified non-issues: `oauth-glyphs.tsx` (thin icon adapters), `AuthScreenLayout.tsx`,
> `AuthProvider.tsx` (already the shared extractions).

---

## Onboarding cluster

Files: `apps/client/src/features/onboarding/**` (notably `OnboardingWizard.tsx`, ~2714 lines).

### O1 — `usernameState` mapped through 3 parallel ladders · Medium
**Locations** (`apps/client/src/features/onboarding/OnboardingWizard.tsx`):
`1342-1356` (dot color), `1357-1371` (text color), `1372-1379` (label). The
`available`/`unavailable`/`error`/fallback ordering is repeated verbatim three times.
**Fix:** one `USERNAME_STATE_META: Record<UsernameState, { dot; color; labelKey }>` map.

### O2 — "uppercase eyebrow label" recipe in 10 StyleSheet entries · Medium
**Locations** (`OnboardingWizard.tsx`, the `ed` StyleSheet): `2078-2085`, `2128-2135`,
`2141-2149`, `2304-2312`, `2323-2330`, `2346-2353`, `2426-2433`, `2460-2467`, `2575-2582`,
`2593-2600`. All share `fontFamily: fonts.sans, fontWeight:"600", textTransform:"uppercase"`
+ letter-spacing, differing only in `fontSize`/`letterSpacing`/`color`.
**Fix:** `const eyebrow = { fontFamily: fonts.sans, fontWeight:"600", textTransform:"uppercase" } as const;`
spread into each entry.

### O3 — Underline / hairline-error input treatment re-implemented · Medium
**Locations** (`OnboardingWizard.tsx`): `textareaLine*` (`2160-2162`), `dateLine*` (`2204-2205`);
usage at `1097` (date), `1304-1310` (textarea). Both hand-roll the 1px bottom rule + error
variant + label + `FieldError` triad that `UnderlineInput` (`@patch-careers/ui/editorial`)
already encapsulates and the plain-text branch (`1318-1334`) uses.
**Fix:** a `FieldShell` wrapper (label + children + hairline + error), or extend `UnderlineInput`
with a custom control slot.

### O4 — Modal scrim + transparent/fade boilerplate across 3 modals · Low
**Locations** (`OnboardingWizard.tsx`): `MonthYearPicker` (`1141-1148`), `MultiItemEditorModal`
(`1577-1595`), `ResumeStyleModal` (`1767-1768`); scrim styles `pickerOverlay` (`2208-2214`),
`editorModalOverlay` (`2355-2360`), `modalBackdrop` (`2663-2667`) all repeat
`rgba(10,10,10,0.45/0.55)` + flex-center. Same `<Modal transparent statusBarTranslucent
animationType="fade" onRequestClose>` prop set + tap-to-dismiss backdrop.
**Fix:** a shared `<OverlayModal>` (Modal props + scrim + backdrop dismiss).

### O5 — "Plus icon + addLabel" add row repeated 3× · Low
**Locations** (`OnboardingWizard.tsx`): `1515-1518` (`ed.addRow`), `1652-1655` (`ed.emptyAdd`),
`1884-1897` (`ed.addSection`). Each renders `<Plus … strokeWidth={2} />` + uppercase label.
**Fix:** an `AddRow`/`AddButton` component (`{ label, onPress, loading?, variant? }`).

### O6 — Storage flag get/set/clear + TTL-guard shape repeated · Low
**Locations** (`apps/client/src/features/onboarding/storage.ts`): `savePhoneCountry`/`readPhoneCountry`
(`78-84`), `markWelcomeSeen`/`readWelcomeSeen` (`88-95`), `markResumeDismissed`/`read`/`clear`
(`99-110`); plus TTL-guard duplicated between `readSessionSnapshot` (`30-39`) and `readStepDraft`
(`60-70`).
**Fix:** a `makeFlag(key)` factory + a `readFresh<T>(key, maxAge)` TTL/parse helper.

> Verified non-issues (already well-factored): per-section add/remove/update handlers are a single
> generic `MultiItemStep` (`1401-1541`); per-step render is one `kind` dispatch (`591-632`);
> validation is centralized in `helpers.ts` (`validateStepFields`/`canContinueStep`).

---

## packages/ui (design system)

Files: `packages/ui/src/{primitives,compounds,editorial,internal,icons}/*`.

### U1 — Password-strength 4-signal scoring duplicated · High
**Locations:**
- `packages/ui/src/internal/password-strength.ts:14-36` (`evaluatePasswordStrength`)
- `packages/ui/src/internal/editorial-password.ts:16-25` (`scorePassword`), `53-60` (`passwordChecks`)
- Consumers: `compounds/password-strength-bar.tsx`, `editorial/password-strength-meter.tsx`

Both compute the same four signals with byte-identical regexes: `length>=8`, `/[A-Z]/&&/[a-z]/`,
`/\d/`, `/[^A-Za-z0-9]/`. Genuine divergence is only editorial's "hard 0 below 6 chars" clamp
and label/color ramps.
**Fix:** extract `passwordSignals(password): { longEnough, mixedCase, hasDigit, hasSymbol }`;
both scorers + `passwordChecks` consume it; keep clamp/ramps as thin wrappers.

### U2 — Tamagui theme-getter `.get()` unwrap copy-pasted · High
**Locations:**
- `packages/ui/src/internal/use-theme-name.ts:12-19` (for `theme.name`)
- `packages/ui/src/icons/icon.tsx:48-55` (for `theme.color`)

Identical defensive "value may be string or `{ get() }`" unwrap.
**Fix:** `readThemeValue(raw: unknown): string | undefined` in `internal/`; both collapse to one call.

### U3 — Haptic-on-press wired 3 inconsistent ways · Medium
**Locations:** `primitives/button.tsx:58-61` (light every press), `compounds/fab.tsx:38-41`
(re-wraps `onPress` — **double-fires**, since FAB is built on `<Button>` which already fires the
light haptic), `compounds/confirm-modal.tsx:80-83` (heavy before confirm).
**Fix:** delete FAB's manual wrapper (`fab.tsx:38-42`); add `withHaptic(impact, fn)` in
`internal/haptics.ts` for the heavy/danger case.

### U4 — `ConfirmModal` vs `DangerConfirmModal` near-identical · Medium
**Locations:** `packages/ui/src/compounds/confirm-modal.tsx:35-62` and `64-90`. Shared
`<Modal>` + footer `<TXStack>` + outlined Cancel button + confirm Button; deltas are intent
(`accent` vs `danger`), default labels, and the danger heavy haptic.
**Fix:** one `ConfirmModalBase` with `danger?: boolean`; both become thin wrappers.

### U5 — `FadeInDown.delay().duration().easing()` entrance repeated 6× · Medium
**Locations:** `editorial/animated-field.tsx:18`, `consent-checkbox.tsx:42`,
`display-heading.tsx:22` & `41`, `oauth-button.tsx:39-41`, `primary-action.tsx:51`. Only
`delay`/`duration` vary; `Easing.out(Easing.cubic)` is verbatim each time.
**Fix:** `editorialFadeInDown(delay, duration=500)` factory, or route all through the existing
`AnimatedField`.

### U6 — Bottom-sheet+search+rows reimplemented · Medium
**Locations:** `packages/ui/src/compounds/list-picker.tsx:64-113` and
`compounds/phone-input.tsx:147-173`. Both render `<Sheet>` + title + search `<Input>` +
`<ScrollView keyboardShouldPersistTaps="handled">` of `<Pressable>` rows, plus an identical
case-insensitive filter `useMemo` (`list-picker.tsx:57-62` vs `phone-input.tsx:104-110`).
`ListPicker` was built to generalize exactly this.
**Fix:** render PhoneInput's country sheet through `<ListPicker>` (dial-code in the `trailing` slot).

### U7 — Token-bypassing literals · Low
"Full radius" spelled four ways: `radius.full` vs raw `9999` (`segmented-control.tsx:33`),
`999` (`oauth-button.tsx:51`, `primary-action.tsx:100`), `28` (`fab.tsx:24`). Hairline
`height={1}` + color rebuilt at `divider.tsx:16-17`, `or-divider.tsx:14,25`,
`underline-input.tsx:99`. Hardcoded `$gray*`/`$red*` at `divider.tsx:12`, `empty-state.tsx:29`,
`form-field.tsx:29,32`, `list-picker.tsx:77,94,99`, `password-strength-bar.tsx:51,59`,
`skeleton.tsx:25`, `tabs.tsx:23`, `phone-input.tsx:125,142`, `input.tsx:23`.
**Fix:** use `radius.full` everywhere; route hairlines through the `<Divider>` primitive;
alias the `$gray5` semantic into a token.

### U8 — `LooseProps` type + loose-cast idiom redeclared · Low
`type LooseProps = Record<string, unknown> & { children?: ReactNode }` declared 3× —
`internal/tamagui-shim.ts:32`, `compounds/sheet.tsx:12`, `compounds/toast.tsx:24` — plus the
`X as unknown as ComponentType<LooseProps>` cast in `long-press-menu.tsx:13-21`,
`swipeable-row.tsx:53-57`. The shim's doc-comment claims it's the only place relaxing typing.
**Fix:** export `LooseProps` + `asLoose<T>()` from `internal/tamagui-shim.ts`; import it.

### U9 — Inline underlined-link `<TText>` recipe repeated 3× · Low
`editorial/inline-link.tsx:28-40` (the dedicated `InlineLink`) vs hand-written copies in
`consent-checkbox.tsx:68-86` (two, byte-identical) and `footer-prompt.tsx:31-41`.
**Fix:** extract `EditorialTextLink` (inline variant); `InlineLink` wraps it for the block case.

> Verified non-issues: `primitives/avatar.tsx` vs `internal/avatar.ts` (component vs pure logic —
> correct); `modal.tsx` vs `sheet.tsx` (genuinely different Tamagui primitives).

---

## packages + app infrastructure

Files: `packages/{auth,state,i18n,storage,tokens}/src/*`, `api-client` (hand-written only),
`apps/client/src/providers/*`, `components/{NetInfoBanner,PlaceholderScreen}.tsx`, `config/api.ts`,
`navigation/authRedirect.ts`, `app/_layout.tsx`, `app/(tabs)/*`.

### P1 — Zustand persisted-store + migrate boilerplate across 3 stores · High
**Locations:** `packages/state/src/color-scheme.store.ts:18-49`, `consent.store.ts:27-66`,
`locale.store.ts:16-44`. All three share the `create()(persist(..., { name, storage:
zustandJSONStorage(storage), version, migrate }))` skeleton, with near-identical hand-rolled
migrate guards (`persisted !== null && typeof persisted === "object" && "<field>" in persisted &&
typeof … === "<type>"` → validate → recovered slice or fallback, action setters stubbed).
**Fix:** a `createPersistedStore({ key, version, storage, initialState, actions, validate })`
factory in `packages/state/src/persist.ts`; each store declares only shape + key + validator.

### P2 — `Accept-Mode: tokens` header block duplicated · Medium
**Locations:** `packages/auth/src/client.ts:209-213` (`refreshAccessTokenRaw`) and `266-270`
(`exchangeSessionForTokens`). Both build the same JSON headers + conditional
`if (runtime.preferTokens) headers["Accept-Mode"] = "tokens"`. (They intentionally bypass the
Kubb fetcher, so they can't reuse it — but should share between themselves.)
**Fix:** a private `authJsonHeaders()` helper in `client.ts`.

### P3 — `Bearer ${accessToken}` getAuthHeader closure duplicated · Medium
**Locations:** `packages/auth/src/client.ts:68-73` (`configureAuthClient`) and
`oauth.ts:122-128` (`completeOAuth`). Same read-storage → null-guard → `Bearer ${pair.accessToken}`.
**Fix:** export `makeBearerAuthHeader(tokenStorage): GetAuthHeader`; or have `completeOAuth`
delegate to a shared `ensureApiClientConfigured(apiBaseURL, storage)`.

### P4 — `extractTokenPair` validation re-implemented in OAuth · Medium
**Locations:** `packages/auth/src/client.ts:100-120` (`extractTokenPair`, module-private) vs
`oauth.ts:108-115` (rebuilds the same `TokenPair` from URL params with its own null/NaN guards).
**Fix:** move `extractTokenPair` + a sibling `parseTokenPairFromParams(searchParams)` into a shared
`packages/auth/src/token-pair.ts`; both import it.

### P5 — Single-flight refresh primitive implemented twice · Medium
**Locations:** `packages/auth/src/refresh-queue.ts:20-28` (`refreshOnce`) vs
`packages/api-client/src/client/fetcher.ts:208-235` (`runRefreshOnce`). Both keep a module-level
`inFlight: Promise | null` with the same contract (the auth file's comment says it mirrors the
fetcher). Only divergence: slot-clear timing (`.finally` vs `queueMicrotask`).
**Fix:** a generic `singleFlight<T>()` factory in `@patch-careers/api-client`
(`src/client/single-flight.ts`); both instantiate it; reconcile to the `queueMicrotask` variant.

### P6 — Locale key + persistence + validation duplicated · Medium
**Locations:** `apps/client/src/providers/I18nProvider.tsx:30` + `89-106` (hardcodes
`"patch-careers:locale"`, manual `mundane.getItem/setItem`, inline `=== "en" || === "pt-BR"`
guard) vs `packages/state/src/locale.store.ts:14` (`LOCALE_STORE_KEY`) + `16-44` (`createLocaleStore`
does the same validation + persistence). Two sources of truth for both the key and the
supported-locale rule.
**Fix:** have `I18nProvider` consume `createLocaleStore(mundane)`; at minimum import
`LOCALE_STORE_KEY` instead of the literal.

### P7 — Web storage adapter repeats `store instanceof Map` branch · Low
**Locations:** `packages/storage/src/web.ts:16-54` — all five methods open with
`const store = backend();` then `if (store instanceof Map) { … }`. (The web/mobile interface
split itself is intentional and not flagged.)
**Fix:** wrap the `Map` fallback in a `Storage`-shaped facade, or a single internal `adapt(store)`,
so the methods stop branching.

### P8 — `navigator.product === "ReactNative"` sniff duplicated · Low
**Locations:** `packages/api-client/src/client/fetcher.ts:115-128` (`detectNative`) vs
`packages/storage/src/index.ts:21-26` (`isWebRuntime`) — same sentinel + caveat comment, inverted
result.
**Fix:** an `isReactNativeRuntime()` in a shared `@patch-careers/platform` (or a `runtime.ts` both
can import). Lower priority — extracting adds a cross-package dep for a 3-line function.

> Verified non-issues: the 5 `(tabs)/*.tsx` screens already delegate to `PlaceholderScreen`;
> `en.ts`/`pt-BR.ts` are structurally identical by design (per-locale values, kept aligned by
> `TranslationDict`); `token-storage.ts` `Promise.all` triples differ per operation;
> `themeLight`/`themeDark` are explicit theme declarations.

---

## Suggested sequencing

1. **Highest ROI / lowest risk:** P1 (store factory), U1 (password signals), U2 (theme getter),
   A1–A3 (auth completion + submit + error handling). These remove the most drift-prone logic
   duplication.
2. **Pick a target auth DS first**, then collapse A5/A6/A9–A12 against it.
3. **Mechanical token cleanups** (U7, O2) can land independently and unblock further DS work.
4. **Cross-package extractions** (P5 single-flight, P8 runtime sniff) last — they introduce
   new shared modules/deps, so weigh against the small size of each duplicate.
