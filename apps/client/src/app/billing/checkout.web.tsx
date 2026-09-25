import { fetcher } from "@patch-careers/api-client";
import { editorialPalette } from "@patch-careers/tokens";
import { Text, YStack } from "@patch-careers/ui";
import { editorialFonts, PrimaryAction, useEditorialPalette } from "@patch-careers/ui/editorial";
import { useLocalSearchParams } from "expo-router";
import Head from "expo-router/head";
import { CreditCard, LockKeyhole, ShieldCheck } from "lucide-react-native";
import { type FormEvent, type ReactElement, useEffect, useRef, useState } from "react";
import QRCode from "react-native-qrcode-svg";
import { DevFillLink } from "@/components/auth/dev-fill-link";
import { devTestCardDetails, isDevTestFillEnabled } from "@/config/dev-flags";
import { useAuthBootstrap, useAuthState } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";

type Checkout = {
  id: string;
  offerCode: string;
  kind: "card" | "pix";
  status: string;
  amountCents: number;
  listAmountCents: number;
  creditAppliedCents: number;
  currency: string;
  expiresAt: string;
  publicKey: string | null;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
};

type CardFormData = {
  token?: string;
  paymentMethodId?: string;
  installments?: number | string;
};
type CardForm = { getCardFormData: () => CardFormData; unmount?: () => void };
type MercadoPagoSdk = new (
  publicKey: string,
  options: { locale: string },
) => {
  cardForm: (options: {
    amount: string;
    iframe: boolean;
    form: {
      id: string;
      cardholderName: { id: string; placeholder: string };
      cardholderEmail: { id: string; placeholder: string };
      cardNumber: { id: string; placeholder: string };
      cardExpirationDate: { id: string; placeholder: string };
      securityCode: { id: string; placeholder: string };
      installments: { id: string; placeholder: string };
      identificationType: { id: string; placeholder: string };
      identificationNumber: { id: string; placeholder: string };
      issuer: { id: string; placeholder: string };
    };
    callbacks: {
      onFormMounted: (error?: unknown) => void;
      onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    };
  }) => CardForm;
};

const checkoutFormStyle = { display: "grid", gap: 18 } as const;

function mercadoPagoSdk(): MercadoPagoSdk | undefined {
  return (window as unknown as { MercadoPago?: MercadoPagoSdk }).MercadoPago;
}

function loadMercadoPago(): Promise<void> {
  if (mercadoPagoSdk()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://sdk.mercadopago.com/js/v2"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("sdk_load_failed")), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.referrerPolicy = "strict-origin";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("sdk_load_failed"));
    document.head.appendChild(script);
  });
}

export default function CheckoutScreen(): ReactElement {
  const { checkout: checkoutId } = useLocalSearchParams<{ checkout?: string }>();
  const { t, locale } = useI18n();
  const { hasBootstrapped } = useAuthBootstrap();
  const { currentUser } = useAuthState();
  const palette = useEditorialPalette();
  const devTestFillEnabled = isDevTestFillEnabled();
  const inputStyle = {
    width: "100%",
    minWidth: 0,
    height: 52,
    border: `1px solid ${palette.hairlineStrong}`,
    borderRadius: 12,
    padding: "0 16px",
    background: palette.surface,
    color: palette.ink,
    fontSize: 15,
    fontFamily: editorialFonts.sans,
    lineHeight: "normal",
    boxSizing: "border-box" as const,
    outline: "none",
  };
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const formRef = useRef<CardForm | null>(null);
  const checkoutKind = checkout?.kind;
  const checkoutStatus = checkout?.status;
  const checkoutAmountCents = checkout?.amountCents;
  const checkoutPublicKey = checkout?.publicKey;
  const checkoutExpiresAt = checkout?.expiresAt;
  const approvedDestination = currentUser?.hasCompletedOnboarding
    ? "/go?checkout=success"
    : "/onboarding";

  useEffect(() => {
    // AuthProvider configures the shared API client during bootstrap. Child
    // effects may otherwise run first and accidentally request `/api/...`
    // from the Expo dev server instead of the backend.
    if (!hasBootstrapped) return;
    if (!checkoutId) {
      setError(t("go.checkoutError"));
      return;
    }
    let mounted = true;
    const refresh = async () => {
      try {
        const response = await fetcher<Checkout>({
          method: "GET",
          url: `/api/v1/billing/checkouts/${encodeURIComponent(checkoutId)}`,
        });
        if (!mounted) return;
        setCheckout(response.data);
        setError(null);
      } catch {
        if (mounted) setError(t("go.checkoutError"));
      }
    };
    void refresh();
    const poll = window.setInterval(() => {
      if (
        checkoutStatus &&
        (checkoutStatus === "pending" || (checkoutKind === "pix" && checkoutStatus === "created"))
      )
        void refresh();
    }, 3_000);
    return () => {
      mounted = false;
      window.clearInterval(poll);
    };
  }, [checkoutId, checkoutKind, checkoutStatus, hasBootstrapped, t]);

  useEffect(() => {
    // Keep the displayed expiry in sync with the wall clock independently
    // from the slower provider-status polling above.
    setNow(Date.now());
    const clock = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    if (checkoutStatus !== "approved" || !hasBootstrapped) return;
    // Give the confirmation animation and message time to be seen before the
    // next onboarding step opens. The button below also allows continuing now.
    const handle = window.setTimeout(() => window.location.assign(approvedDestination), 4200);
    return () => window.clearTimeout(handle);
  }, [checkoutStatus, approvedDestination, hasBootstrapped]);

  useEffect(() => {
    if (
      checkoutKind !== "card" ||
      checkoutStatus !== "created" ||
      !checkoutPublicKey ||
      checkoutAmountCents === undefined ||
      !checkoutExpiresAt ||
      new Date(checkoutExpiresAt).getTime() <= Date.now() ||
      !checkoutId
    )
      return;
    const publicKey = checkoutPublicKey;
    let mounted = true;
    void loadMercadoPago()
      .then(() => {
        const Constructor = mercadoPagoSdk();
        if (!mounted || !Constructor) return;
        const mercadoPago = new Constructor(publicKey, {
          locale: locale === "pt-BR" ? "pt-BR" : "en-US",
        });
        formRef.current = mercadoPago.cardForm({
          amount: (checkoutAmountCents / 100).toFixed(2),
          iframe: true,
          form: {
            id: "form-checkout",
            cardholderName: {
              id: "form-checkout__cardholderName",
              placeholder: t("go.cardholderName"),
            },
            cardholderEmail: {
              id: "form-checkout__cardholderEmail",
              placeholder: t("go.cardholderEmail"),
            },
            cardNumber: { id: "form-checkout__cardNumber", placeholder: "0000 0000 0000 0000" },
            cardExpirationDate: {
              id: "form-checkout__expirationDate",
              placeholder: t("go.cardExpiration"),
            },
            securityCode: {
              id: "form-checkout__securityCode",
              placeholder: t("go.cardSecurityCode"),
            },
            installments: {
              id: "form-checkout__installments",
              placeholder: t("go.cardInstallments"),
            },
            identificationType: {
              id: "form-checkout__identificationType",
              placeholder: t("go.cardDocumentType"),
            },
            identificationNumber: {
              id: "form-checkout__identificationNumber",
              placeholder: t("go.cardDocumentNumber"),
            },
            issuer: { id: "form-checkout__issuer", placeholder: t("go.cardIssuer") },
          },
          callbacks: {
            onFormMounted: (mountError) => {
              if (!mounted) return;
              if (mountError) setError(t("go.checkoutError"));
              else {
                setReady(true);
                setError(null);
              }
            },
            onSubmit: async (event) => {
              event.preventDefault();
              const cardData = formRef.current?.getCardFormData();
              const cardToken = cardData?.token;
              if (!cardToken) return setError(t("go.checkoutError"));
              setSaving(true);
              setError(null);
              try {
                const response = await fetcher<Checkout>({
                  method: "POST",
                  url: `/api/v1/billing/checkouts/${encodeURIComponent(checkoutId)}/card`,
                  data: {
                    cardToken,
                    paymentMethodId: cardData.paymentMethodId,
                    installments: 1,
                  },
                });
                setCheckout(response.data);
              } catch {
                setError(t("go.checkoutError"));
              } finally {
                setSaving(false);
              }
            },
          },
        });
      })
      .catch(() => setError(t("go.checkoutError")));
    return () => {
      mounted = false;
      formRef.current?.unmount?.();
      formRef.current = null;
    };
  }, [
    checkoutAmountCents,
    checkoutExpiresAt,
    checkoutId,
    checkoutKind,
    checkoutPublicKey,
    checkoutStatus,
    locale,
    t,
  ]);

  const remainingSeconds = checkout
    ? Math.max(0, Math.ceil((new Date(checkout.expiresAt).getTime() - now) / 1_000))
    : 0;
  const checkoutHasExpired =
    !!checkout &&
    ["created", "pending"].includes(checkout.status) &&
    new Date(checkout.expiresAt).getTime() <= now;
  const remaining = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(
    remainingSeconds % 60,
  ).padStart(2, "0")}`;
  const qrSource = checkout?.qrCodeBase64
    ? checkout.qrCodeBase64.startsWith("data:")
      ? checkout.qrCodeBase64
      : `data:image/png;base64,${checkout.qrCodeBase64}`
    : null;
  const formattedAmount = checkout
    ? new Intl.NumberFormat(locale, {
        style: "currency",
        currency: checkout.currency,
      }).format(checkout.amountCents / 100)
    : null;

  const runTestCard = async () => {
    if (!devTestFillEnabled || !checkoutId || !checkoutPublicKey || checkoutHasExpired || saving)
      return;
    const card = devTestCardDetails();
    const [expirationMonth, shortExpirationYear] = card.expiration.split("/");
    const expirationYear =
      shortExpirationYear?.length === 2 ? `20${shortExpirationYear}` : shortExpirationYear;
    if (!expirationMonth || !expirationYear) return setError(t("go.checkoutError"));

    setSaving(true);
    setError(null);
    try {
      // Secure Mercado Pago fields are cross-origin and intentionally cannot
      // be scripted. The DEV-only helper tokenizes the documented test card
      // directly with the public sandbox key, then exercises our real API.
      const tokenResponse = await fetch(
        `https://api.mercadopago.com/v1/card_tokens?public_key=${encodeURIComponent(checkoutPublicKey)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            card_number: card.number,
            expiration_month: Number(expirationMonth),
            expiration_year: Number(expirationYear),
            security_code: card.securityCode,
            cardholder: {
              name: card.holderName,
              identification: { type: card.documentType, number: card.documentNumber },
            },
          }),
        },
      );
      const token = (await tokenResponse.json()) as { id?: string };
      if (!tokenResponse.ok || !token.id) throw new Error("test_card_token_failed");
      const response = await fetcher<Checkout>({
        method: "POST",
        url: `/api/v1/billing/checkouts/${encodeURIComponent(checkoutId)}/card`,
        data: {
          cardToken: token.id,
          paymentMethodId: card.paymentMethodId,
          installments: 1,
          test: true,
        },
      });
      setCheckout(response.data);
    } catch {
      setError(t("go.checkoutError"));
    } finally {
      setSaving(false);
    }
  };

  const backToPlans = async () => {
    if (leaving) return;
    if (currentUser?.hasCompletedOnboarding) {
      window.location.assign("/go");
      return;
    }
    setLeaving(true);
    try {
      const flow = await fetcher<{ step: string }>({
        method: "GET",
        url: "/api/v1/onboarding/flow",
      });
      if (flow.data.step === "payment") {
        await fetcher({
          method: "POST",
          url: "/api/v1/onboarding/flow/step",
          data: { to: "plan" },
        });
      }
      window.location.assign("/onboarding");
    } catch {
      setError(t("go.backToPlansError"));
      setLeaving(false);
    }
  };

  const retryCheckout = async () => {
    if (!checkout?.offerCode || retrying) return;
    setRetrying(true);
    setError(null);
    try {
      const response = await fetcher<Checkout>({
        method: "POST",
        url: "/api/v1/billing/checkouts",
        data: { offerCode: checkout.offerCode },
      });
      window.location.assign(`/billing/checkout?checkout=${encodeURIComponent(response.data.id)}`);
    } catch {
      setError(t("go.checkoutError"));
      setRetrying(false);
    }
  };

  return (
    <YStack flex={1} minHeight="100vh" backgroundColor={palette.bg} padding={24}>
      <Head>
        <title>
          {checkoutStatus === "approved" ? t("go.checkoutApprovedTitle") : t("go.checkoutTitle")}
          {" · Patch Careers"}
        </title>
        <meta name="referrer" content="strict-origin" />
        <meta name="robots" content="noindex,nofollow" />
        <style>{`
          .checkout-shell { width: 100%; max-width: 1040px; margin: 0 auto; padding: 76px 0 56px; font-family: Inter, system-ui, sans-serif; }
          .checkout-header { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; margin-bottom: 28px; }
          .checkout-title { grid-column: 2; }
          .checkout-grid { display: grid; grid-template-columns: minmax(280px, .82fr) minmax(420px, 1.18fr); gap: 24px; align-items: start; }
          .checkout-panel { border-radius: 24px; overflow: hidden; }
          .checkout-summary { position: sticky; top: 96px; }
          .checkout-card-visual { aspect-ratio: 1.586 / 1; min-height: 206px; display: flex; flex-direction: column; justify-content: space-between; border-radius: 20px; padding: 24px; overflow: hidden; position: relative; }
          .checkout-card-visual::after { content: ""; position: absolute; width: 240px; height: 240px; border: 1px solid currentColor; opacity: .14; border-radius: 50%; right: -96px; bottom: -130px; }
          .checkout-card-top { display: flex; justify-content: space-between; align-items: center; }
          .checkout-card-brand { font-size: 20px; font-weight: 800; letter-spacing: -.04em; }
          .checkout-chip { width: 42px; height: 31px; border-radius: 7px; background: linear-gradient(135deg, #d9c58e, #f2e5b6 52%, #bca269); position: relative; }
          .checkout-chip::before { content: ""; position: absolute; inset: 6px 0; border-top: 1px solid rgba(78,63,23,.28); border-bottom: 1px solid rgba(78,63,23,.28); }
          .checkout-card-number { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 20px; letter-spacing: .12em; white-space: nowrap; }
          .checkout-card-meta { display: flex; justify-content: space-between; gap: 12px; margin-top: 16px; font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
          .checkout-summary-body { margin-top: 14px; padding: 20px; border-radius: 16px; }
          .checkout-summary-row { display: flex; justify-content: space-between; gap: 16px; }
          .checkout-panel-header { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
          .checkout-panel-header-copy { display: grid; gap: 3px; flex: 1; }
          .checkout-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 12px; }
          .checkout-field { display: grid; gap: 8px; min-width: 0; }
          .checkout-field-full { grid-column: 1 / -1; }
          .checkout-field label { font-size: 13px; font-weight: 650; letter-spacing: .01em; }
          .checkout-field input, .checkout-field select, .checkout-secure-field { transition: border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease; }
          .checkout-field input::placeholder { color: ${palette.muted}; opacity: .78; text-overflow: ellipsis; }
          .checkout-secure-field { height: 52px !important; min-height: 52px !important; padding: 0 16px !important; overflow: hidden; display: flex; align-items: center; }
          .checkout-secure-field iframe { width: 100% !important; height: 50px !important; min-height: 50px !important; border: 0 !important; display: block; }
          .checkout-field input:focus, .checkout-field select:focus, .checkout-secure-field:focus-within { border-color: currentColor !important; box-shadow: 0 0 0 3px rgba(47, 107, 79, .12); }
          .checkout-button { width: 100%; height: 52px; border: 0; border-radius: 12px; cursor: pointer; font: inherit; font-size: 15px; font-weight: 750; transition: transform 120ms ease, opacity 120ms ease; }
          .checkout-button:hover:not(:disabled) { transform: translateY(-1px); }
          .checkout-button:disabled { cursor: wait; opacity: .58; }
          .checkout-back { border: 0; background: transparent; cursor: pointer; font: inherit; padding: 8px; }
          .checkout-success { min-height: min(72vh, 680px); padding: 48px 20px 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
          .checkout-success-action { width: 100%; max-width: 240px; }
          .checkout-success-mark { width: 132px; height: 132px; border-radius: 50%; display: grid; place-items: center; background: ${palette.success}1c; margin-bottom: 32px; animation: checkout-success-pop 680ms cubic-bezier(.2, .85, .25, 1.2) both; }
          .checkout-success-ring { fill: none; stroke: ${palette.success}; stroke-width: 5; stroke-linecap: round; stroke-dasharray: 240; stroke-dashoffset: 240; transform: rotate(-90deg); transform-origin: center; animation: checkout-success-draw 650ms ease-out 180ms forwards; }
          .checkout-success-check { fill: none; stroke: ${palette.success}; stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 70; stroke-dashoffset: 70; animation: checkout-success-draw 490ms ease-out 620ms forwards; }
          @keyframes checkout-success-pop { from { transform: scale(.65); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          @keyframes checkout-success-draw { to { stroke-dashoffset: 0; } }
          @media (prefers-reduced-motion: reduce) {
            .checkout-success-mark, .checkout-success-ring, .checkout-success-check { animation: none; }
            .checkout-success-ring, .checkout-success-check { stroke-dashoffset: 0; }
          }
          @media (max-width: 800px) {
            .checkout-shell { padding-top: 64px; }
            .checkout-header { grid-template-columns: 1fr; gap: 20px; }
            .checkout-title { grid-column: 1; grid-row: 2; justify-self: center; }
            .checkout-grid { grid-template-columns: 1fr; }
            .checkout-summary { position: static; }
            .checkout-card-visual { min-height: 190px; aspect-ratio: auto; }
          }
          @media (max-width: 520px) {
            .checkout-shell { padding-top: 52px; }
            .checkout-panel { border-radius: 18px; }
            .checkout-form-grid { grid-template-columns: 1fr; }
            .checkout-field-full { grid-column: auto; }
            .checkout-card-number { font-size: 17px; }
          }
        `}</style>
      </Head>
      <div className="checkout-shell">
        {checkoutStatus === "approved" ? (
          <div className="checkout-success" role="status" aria-live="polite">
            <div className="checkout-success-mark" aria-hidden="true">
              <svg width="108" height="108" viewBox="0 0 96 96">
                <title>{t("go.checkoutApprovedTitle")}</title>
                <circle className="checkout-success-ring" cx="48" cy="48" r="38" />
                <path className="checkout-success-check" d="M27 49 41 62 69 32" />
              </svg>
            </div>
            <h1
              style={{
                fontFamily: editorialFonts.serif,
                fontSize: "clamp(52px, 6vw, 72px)",
                lineHeight: 1.06,
                fontWeight: 700,
                letterSpacing: "-1.2px",
                color: palette.ink,
                margin: 0,
              }}
            >
              {t("go.checkoutApprovedTitle")}
            </h1>
            <p
              style={{
                fontFamily: editorialFonts.sans,
                fontSize: 18,
                lineHeight: 1.5,
                color: palette.body,
                margin: "20px 0 32px",
              }}
            >
              {t("go.checkoutApproved")}
            </p>
            <div className="checkout-success-action">
              <PrimaryAction
                label={t("common.continue")}
                onPress={() => window.location.assign(approvedDestination)}
                fullWidth
              />
            </div>
          </div>
        ) : (
          <div className="checkout-header">
            <button
              type="button"
              className="checkout-back"
              style={{ color: palette.accentDeep, justifySelf: "start" }}
              disabled={leaving}
              onClick={() => void backToPlans()}
            >
              ← {t("go.backToPlans")}
            </button>
            <div className="checkout-title">
              <Text
                fontFamily={editorialFonts.serif}
                fontSize={48}
                lineHeight={51}
                fontWeight="700"
                letterSpacing={-1.2}
                textAlign="center"
                color={palette.ink}
              >
                {t("go.checkoutTitle")}
              </Text>
            </div>
          </div>
        )}
        {error ? (
          <div
            role="alert"
            style={{
              color: palette.danger,
              border: `1px solid ${palette.danger}`,
              borderRadius: 12,
              padding: "12px 14px",
              marginBottom: 18,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        ) : null}
        {!checkout && !error ? <Text color={palette.muted}>{t("go.checkoutLoading")}</Text> : null}
        {checkoutStatus !== "approved" && checkout?.creditAppliedCents ? (
          <Text color={palette.accent}>
            {t("go.creditApplied", {
              value: new Intl.NumberFormat(locale, {
                style: "currency",
                currency: checkout.currency,
              }).format(checkout.creditAppliedCents / 100),
            })}
          </Text>
        ) : null}
        {checkoutHasExpired ||
        ["expired", "canceled", "rejected", "failed"].includes(checkout?.status ?? "") ? (
          <YStack gap={12}>
            <Text color={palette.danger}>{t("go.checkoutExpired")}</Text>
            <PrimaryAction
              label={t("common.retry")}
              onPress={() => void retryCheckout()}
              loading={retrying}
            />
          </YStack>
        ) : null}
        {checkout && !checkoutHasExpired && ["created", "pending"].includes(checkout.status) ? (
          <div className="checkout-grid">
            <aside className="checkout-summary" style={{ color: palette.ink }}>
              <div
                className="checkout-card-visual"
                style={{ background: palette.primary, color: palette.onPrimary }}
              >
                <div className="checkout-card-top">
                  <span className="checkout-card-brand">patch.</span>
                  <CreditCard size={24} strokeWidth={1.6} color={palette.onPrimary} />
                </div>
                <div className="checkout-chip" aria-hidden="true" />
                <div>
                  <div className="checkout-card-number">•••• •••• •••• ••••</div>
                  <div className="checkout-card-meta">
                    <span>{t("go.checkoutCardVisualName")}</span>
                    <span>••/••</span>
                  </div>
                </div>
              </div>
              <div
                className="checkout-summary-body"
                style={{
                  background: palette.panel,
                  border: `1px solid ${palette.hairline}`,
                  color: palette.ink,
                }}
              >
                <div
                  style={{
                    color: palette.muted,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                    marginBottom: 14,
                  }}
                >
                  {t("go.checkoutSummary")}
                </div>
                <div className="checkout-summary-row">
                  <span style={{ color: palette.body, fontSize: 15 }}>
                    {t("go.checkoutSubscription")}
                  </span>
                  <strong style={{ color: palette.ink, fontSize: 18 }}>{formattedAmount}</strong>
                </div>
                <div
                  style={{
                    borderTop: `1px solid ${palette.hairline}`,
                    marginTop: 18,
                    paddingTop: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: palette.muted,
                    fontSize: 12,
                  }}
                >
                  <LockKeyhole size={14} color={palette.accentDeep} />
                  {t("go.checkoutSecureShort")}
                </div>
              </div>
            </aside>

            <section
              className="checkout-panel"
              style={{
                background: palette.panel,
                border: `1px solid ${palette.hairline}`,
                padding: "clamp(22px, 4vw, 36px)",
                boxShadow: "0 18px 50px rgba(30, 38, 32, 0.07)",
              }}
            >
              {checkout.kind === "card" && checkout.status === "created" ? (
                <>
                  <div className="checkout-panel-header">
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: palette.bg,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CreditCard size={21} color={palette.accentDeep} />
                    </div>
                    <div className="checkout-panel-header-copy">
                      <Text
                        fontFamily={editorialFonts.sans}
                        fontSize={20}
                        fontWeight="700"
                        color={palette.ink}
                      >
                        {t("go.checkoutCardTitle")}
                      </Text>
                    </div>
                    {devTestFillEnabled && !saving ? (
                      <DevFillLink onPress={() => void runTestCard()} testID="checkout-test-fill" />
                    ) : null}
                  </div>
                  <form id="form-checkout" style={checkoutFormStyle}>
                    <div className="checkout-form-grid">
                      <div className="checkout-field checkout-field-full">
                        <label htmlFor="form-checkout__cardNumber" style={{ color: palette.body }}>
                          {t("go.cardNumber")}
                        </label>
                        <div
                          id="form-checkout__cardNumber"
                          className="checkout-secure-field"
                          style={inputStyle}
                        />
                      </div>
                      <div className="checkout-field">
                        <label
                          htmlFor="form-checkout__expirationDate"
                          style={{ color: palette.body }}
                        >
                          {t("go.cardExpirationLabel")}
                        </label>
                        <div
                          id="form-checkout__expirationDate"
                          className="checkout-secure-field"
                          style={inputStyle}
                        />
                      </div>
                      <div className="checkout-field">
                        <label
                          htmlFor="form-checkout__securityCode"
                          style={{ color: palette.body }}
                        >
                          {t("go.cardSecurityCode")}
                        </label>
                        <div
                          id="form-checkout__securityCode"
                          className="checkout-secure-field"
                          style={inputStyle}
                        />
                      </div>
                      <div className="checkout-field checkout-field-full">
                        <label
                          htmlFor="form-checkout__cardholderName"
                          style={{ color: palette.body }}
                        >
                          {t("go.cardholderName")}
                        </label>
                        <input
                          id="form-checkout__cardholderName"
                          autoComplete="cc-name"
                          placeholder={t("go.cardholderNamePlaceholder")}
                          style={inputStyle}
                        />
                      </div>
                      <div className="checkout-field checkout-field-full">
                        <label
                          htmlFor="form-checkout__cardholderEmail"
                          style={{ color: palette.body }}
                        >
                          {t("go.cardholderEmail")}
                        </label>
                        <input
                          id="form-checkout__cardholderEmail"
                          type="email"
                          autoComplete="email"
                          placeholder={t("go.cardholderEmailPlaceholder")}
                          style={inputStyle}
                        />
                      </div>
                      <div className="checkout-field checkout-field-full">
                        <label htmlFor="form-checkout__issuer" style={{ color: palette.body }}>
                          {t("go.cardIssuer")}
                        </label>
                        <select
                          id="form-checkout__issuer"
                          style={inputStyle}
                          aria-label={t("go.cardIssuer")}
                        />
                      </div>
                      <div className="checkout-field">
                        <label
                          htmlFor="form-checkout__identificationType"
                          style={{ color: palette.body }}
                        >
                          {t("go.cardDocumentType")}
                        </label>
                        <select
                          id="form-checkout__identificationType"
                          style={inputStyle}
                          aria-label={t("go.cardDocumentType")}
                        />
                      </div>
                      <div className="checkout-field">
                        <label
                          htmlFor="form-checkout__identificationNumber"
                          style={{ color: palette.body }}
                        >
                          {t("go.cardDocumentNumber")}
                        </label>
                        <input
                          id="form-checkout__identificationNumber"
                          inputMode="numeric"
                          placeholder="000.000.000-00"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <select
                      id="form-checkout__installments"
                      style={{ ...inputStyle, display: "none" }}
                      aria-label={t("go.cardInstallments")}
                    />
                    <button
                      id="form-checkout__submit"
                      className="checkout-button"
                      type="submit"
                      disabled={!ready || saving}
                      style={{ background: palette.primary, color: palette.onPrimary }}
                    >
                      {saving
                        ? t("go.checkoutProcessing")
                        : t("go.checkoutCardSubmitWithPrice", { price: formattedAmount ?? "" })}
                    </button>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 7,
                        color: palette.muted,
                        fontSize: 12,
                      }}
                    >
                      <ShieldCheck size={14} color={palette.accentDeep} />
                      {t("go.checkoutSecure")}
                    </div>
                  </form>
                </>
              ) : null}
              {checkout.kind === "pix" && ["created", "pending"].includes(checkout.status) ? (
                <YStack gap={14} alignItems="center">
                  <Text
                    fontFamily={editorialFonts.sans}
                    fontSize={24}
                    fontWeight="700"
                    color={palette.ink}
                  >
                    {formattedAmount}
                  </Text>
                  {qrSource ? (
                    <img src={qrSource} width={260} height={260} alt={t("go.pixQrAlt")} />
                  ) : checkout.qrCode ? (
                    <QRCode
                      value={checkout.qrCode}
                      size={236}
                      quietZone={12}
                      color={editorialPalette.ink}
                      backgroundColor={editorialPalette.panel}
                    />
                  ) : null}
                  {checkout.qrCode ? (
                    <textarea
                      readOnly
                      value={checkout.qrCode}
                      style={{ ...inputStyle, minHeight: 96 }}
                    />
                  ) : null}
                  <PrimaryAction
                    label={copied ? t("go.pixCopied") : t("go.pixCopy")}
                    onPress={() => {
                      if (!checkout.qrCode) return;
                      void navigator.clipboard
                        .writeText(checkout.qrCode)
                        .then(() => setCopied(true));
                    }}
                  />
                  <Text color={palette.muted}>{t("go.pixExpires", { time: remaining })}</Text>
                </YStack>
              ) : null}
              {checkout.status === "pending" && checkout.kind === "card" ? (
                <Text color={palette.muted}>{t("go.checkoutProcessing")}</Text>
              ) : null}
            </section>
          </div>
        ) : null}
      </div>
    </YStack>
  );
}
